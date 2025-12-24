import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import type { ReservaExtractedData } from '../types';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface TripContext {
  tripId?: string;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
}

// Prompt del sistema para extraccion de reservas
const EXTRACT_RESERVA_PROMPT = `Eres un asistente que extrae informacion estructurada de imagenes de reservas de viaje.
Analiza la imagen y extrae la siguiente informacion en formato JSON EXACTO:

{
  "categoria": "transport" | "accommodation" | "food" | "activity" | "other",
  "nombre": "Nombre descriptivo de la reserva",
  "proveedor": "Nombre de la aerolinea/hotel/restaurante/empresa o null",
  "numeroConfirmacion": "Codigo/numero de confirmacion o null",
  "fechaInicio": "YYYY-MM-DD o null",
  "horaInicio": "HH:MM o null (formato 24h)",
  "fechaFin": "YYYY-MM-DD o null (solo para hoteles o actividades de varios dias)",
  "horaFin": "HH:MM o null (formato 24h)",
  "ubicacion": "Ciudad, Pais o nombre del lugar o null",
  "direccion": "Direccion completa o null",
  "precio": numero o null (solo el valor numerico, sin simbolos),
  "moneda": "EUR" | "USD" | "GBP" | etc. o null,
  "notas": "Informacion adicional relevante o null",
  "metadatos": {
    // Para vuelos (transport aereo):
    "aerolinea": "Nombre aerolinea",
    "numeroVuelo": "Codigo vuelo",
    "terminal": "Terminal",
    "puerta": "Puerta embarque",
    "asiento": "Numero asiento",
    "clase": "economica/business/primera",

    // Para hoteles (accommodation):
    "tipoHabitacion": "Tipo habitacion",
    "numNoches": numero,
    "checkIn": "HH:MM",
    "checkOut": "HH:MM",

    // Para restaurantes (food):
    "numPersonas": numero,
    "tipoComida": "desayuno/comida/cena",

    // Para actividades (activity):
    "duracion": "2 horas / 1 dia / etc",
    "incluye": ["elemento1", "elemento2"],

    // General (cualquier categoria):
    "contacto": "Nombre contacto",
    "telefono": "Telefono",
    "email": "Email",
    "web": "URL sitio web",
    "politicaCancelacion": "Texto politica"
  },
  "confianza": "alta" | "media" | "baja"
}

REGLAS IMPORTANTES:
1. categoria debe ser EXACTAMENTE uno de: "transport", "accommodation", "food", "activity", "other"
2. Si no encuentras informacion, usa null (no string vacio)
3. Solo incluye en metadatos los campos relevantes para la categoria detectada
4. fechas en formato ISO (YYYY-MM-DD), horas en formato 24h (HH:MM)
5. precio debe ser solo numero, sin simbolos de moneda
6. confianza: "alta" si todos los datos clave estan claros, "media" si faltan algunos, "baja" si es dificil leer
7. Devuelve SOLO el JSON, sin texto adicional antes ni despues.`;

// Prompt del sistema para el asistente de viaje
const ASSISTANT_PROMPT = `Eres un asistente de viaje inteligente para la app Viatio.
Tu funci�n es ayudar al usuario con:
- Recomendaciones de lugares para visitar
- Sugerencias de actividades
- Informaci�n sobre destinos
- Organizaci�n del itinerario
- Consejos de viaje

S� conciso, amigable y �til. Usa el contexto del viaje si est� disponible.`;

/**
 * Extrae datos estructurados de una o múltiples imágenes de reserva usando Gemini Vision
 */
async function extractReservaFromImageImpl(
  imageOrImages: string | Array<{ base64: string; mimeType: string }>,
  mimeType?: string
): Promise<ReservaExtractedData> {
    try {
      // Usar gemini-2.0-flash-exp: Modelo experimental de Gemini 2.0 Flash
      // - Soporta vision (imagenes y PDFs)
      // - Mejor rendimiento y precision que 1.5
      // - Gratuito durante preview
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Preparar contenido para Gemini
      const contentParts: any[] = [EXTRACT_RESERVA_PROMPT];

      // Soporte para múltiples imágenes o una sola
      if (typeof imageOrImages === 'string') {
        // Modo legacy: una sola imagen
        contentParts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageOrImages,
          },
        });
      } else {
        // Modo nuevo: múltiples imágenes
        for (const img of imageOrImages) {
          contentParts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64,
            },
          });
        }

        // Si hay múltiples imágenes, añadir instrucción adicional
        if (imageOrImages.length > 1) {
          contentParts.push(
            `\n\nNOTA: Se proporcionan ${imageOrImages.length} imágenes. Analiza TODAS las imágenes y combina la información extraída en un solo JSON. Si hay información duplicada o contradictoria, prioriza la más detallada o reciente.`
          );
        }
      }

      const result = await model.generateContent(contentParts);

      const response = result.response;
      const text = response.text();

      // Intentar parsear como JSON
      try {
        // Limpiar posibles markdown code blocks (```json ... ```)
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);

        // Validar campos requeridos
        if (!parsed.categoria || !parsed.nombre) {
          throw new Error('Missing required fields in AI response: categoria and nombre are required');
        }

        // Validar que categoria sea valida
        const validCategories = ['transport', 'accommodation', 'food', 'activity', 'other'];
        if (!validCategories.includes(parsed.categoria)) {
          parsed.categoria = 'other';
        }

        // Validar confianza
        const validConfianza = ['alta', 'media', 'baja'];
        if (!validConfianza.includes(parsed.confianza)) {
          parsed.confianza = 'media';
        }

        // Asegurar que metadatos sea un objeto si existe
        if (parsed.metadatos && typeof parsed.metadatos !== 'object') {
          parsed.metadatos = undefined;
        }

        return parsed as ReservaExtractedData;
      } catch (parseError) {
        throw new Error(`Invalid JSON response from AI: ${text}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error extracting reservation: ${error.message}`);
      }
      throw error;
    }
}

/**
 * Servicio de integración con Gemini AI
 */
export const geminiService = {
  /**
   * Extrae datos estructurados de una o múltiples imágenes de reserva usando Gemini Vision
   */
  extractReservaFromImage: extractReservaFromImageImpl,

  /**
   * Mantiene una conversaci�n con el asistente de viaje usando Gemini
   */
  async chatAssistant(
    message: string,
    context?: TripContext,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    try {
      // Usar gemini-2.0-flash-exp para chat assistant
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Construir contexto adicional si existe informaci�n del viaje
      let contextPrompt = ASSISTANT_PROMPT;
      if (context) {
        const { tripName, destination, startDate, endDate } = context;
        contextPrompt += `\n\nContexto del viaje actual:`;
        if (tripName) contextPrompt += `\n- Viaje: ${tripName}`;
        if (destination) contextPrompt += `\n- Destino: ${destination}`;
        if (startDate) contextPrompt += `\n- Fecha inicio: ${startDate}`;
        if (endDate) contextPrompt += `\n- Fecha fin: ${endDate}`;
      }

      // Construir historial de chat en formato Gemini
      const history = conversationHistory?.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })) || [];

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Enviar mensaje con contexto en el primer mensaje
      const prompt = history.length === 0
        ? `${contextPrompt}\n\nUsuario: ${message}`
        : message;

      const result = await chat.sendMessage(prompt);
      const response = result.response;

      return response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error in chat assistant: ${error.message}`);
      }
      throw error;
    }
  },
};
