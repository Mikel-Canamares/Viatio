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
  // Nuevos campos para contexto completo
  reservations?: Array<{
    nombre: string;
    categoria: string;
    fecha: string;
  }>;
  places?: Array<{
    nombre: string;
    categoria: string;
  }>;
  budget?: number;
  currentExpense?: number;
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
const ASSISTANT_PROMPT = `Eres el asistente de viajes de Viatio, una app móvil para organizar viajes.

PERSONALIDAD:
- Amigable y cercano, como un amigo viajero experimentado
- Conciso pero informativo (respuestas de 2-4 párrafos máximo)
- Proactivo con sugerencias útiles
- Usa emojis con moderación (1-2 por mensaje, solo si aportan)

CAPACIDADES:
- Responder preguntas sobre el viaje del usuario
- Sugerir actividades, restaurantes y lugares según destino
- Ayudar a organizar itinerarios diarios
- Dar consejos prácticos de viaje (clima, transporte, cultura local)
- Orientar sobre presupuesto y gastos
- Informar sobre documentos necesarios para viajar

LIMITACIONES (sé honesto sobre ellas):
- No puedes hacer reservas reales ni pagos
- Tu información puede no estar 100% actualizada
- No tienes acceso a precios en tiempo real
- No compartas ni solicites datos personales sensibles

FORMATO:
- Respuestas breves y directas
- Usa listas cuando haya múltiples opciones
- Destaca información clave con **negritas**
- Si no sabes algo, admítelo y sugiere dónde buscar

⚠️ CRÍTICO - USO DEL CONTEXTO DEL VIAJE:
Cuando el usuario te envíe información del viaje actual (fechas, destino, reservas, lugares, presupuesto):

1. **SIEMPRE úsala en tus respuestas** - No preguntes por información que ya tienes
2. **Sé específico**: Si preguntan "planifica mi segundo día", calcula la fecha exacta usando startDate
3. **Relaciona todo**: Conecta reservas con lugares guardados y presupuesto disponible
4. **Menciona horarios**: Si hay reserva a las 15:00, sugiere actividades antes/después
5. **Calcula presupuesto**: Si piden sugerencias, considera cuánto dinero queda disponible
6. **Usa nombres reales**: "En tu reserva del Hotel Ritz..." no "En tu hotel..."

Ejemplo CORRECTO con contexto:
Usuario: "planifica mi segundo día"
Contexto: {destino: Barcelona, fechas: 14-18 marzo, reservas: [Hotel Ritz check-in 15 marzo 15:00], lugares: [Sagrada Familia, Park Güell], presupuesto: 1500€, gastado: 500€}
Tú: "Tu segundo día es el **15 de marzo**. Tienes check-in en Hotel Ritz a las 15:00.

Por la mañana, te recomiendo visitar la **Sagrada Familia** que guardaste (entrada ~26€, reserva con antelación).
Después del check-in, el **Park Güell** está a 20 min en metro.

Total estimado: 50€ (te quedarían **950€** del presupuesto disponible)."

Ejemplo INCORRECTO (❌ NO HACER):
Usuario: "planifica mi segundo día"
Tú: "¿A qué ciudad viajas? ¿Cuándo es tu segundo día?"`;

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
      // Construir system instruction COMPLETA con contexto del viaje
      let systemInstruction = ASSISTANT_PROMPT;

      if (context) {
        systemInstruction += `\n\n═══════════════════════════════════════════════════\n`;
        systemInstruction += `📋 INFORMACIÓN DEL VIAJE DEL USUARIO (USA ESTA INFORMACIÓN EN TUS RESPUESTAS):\n`;
        systemInstruction += `═══════════════════════════════════════════════════\n`;

        // Información básica
        if (context.destination) {
          systemInstruction += `\n🌍 DESTINO: ${context.destination}`;
        }

        if (context.startDate && context.endDate) {
          systemInstruction += `\n📅 FECHAS: ${context.startDate} hasta ${context.endDate}`;
          // Calcular duración
          const start = new Date(context.startDate);
          const end = new Date(context.endDate);
          const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          systemInstruction += ` (${dias} días)`;
        }

        // Presupuesto
        if (context.budget) {
          const disponible = context.currentExpense ? context.budget - context.currentExpense : context.budget;
          systemInstruction += `\n💰 PRESUPUESTO: ${context.budget}€ total`;
          if (context.currentExpense && context.currentExpense > 0) {
            systemInstruction += ` | Gastado: ${context.currentExpense}€ | **Disponible: ${disponible}€**`;
          }
        }

        // Reservas (CRÍTICO: incluir TODOS los detalles)
        if (context.reservations && context.reservations.length > 0) {
          systemInstruction += `\n\n🏨 RESERVAS CONFIRMADAS (${context.reservations.length}):`;
          context.reservations.forEach((r, index) => {
            systemInstruction += `\n  ${index + 1}. ${r.nombre}`;
            systemInstruction += ` [${r.categoria}]`;
            if (r.fecha) systemInstruction += ` - Fecha: ${r.fecha}`;
          });
        } else {
          systemInstruction += `\n\n🏨 RESERVAS: Ninguna reserva confirmada todavía`;
        }

        // Lugares guardados
        if (context.places && context.places.length > 0) {
          systemInstruction += `\n\n📍 LUGARES DE INTERÉS GUARDADOS (${context.places.length}):`;
          context.places.forEach((p, index) => {
            systemInstruction += `\n  ${index + 1}. ${p.nombre} [${p.categoria}]`;
          });
        } else {
          systemInstruction += `\n\n📍 LUGARES: No ha guardado lugares todavía`;
        }

        systemInstruction += `\n\n═══════════════════════════════════════════════════\n`;
        systemInstruction += `⚡ INSTRUCCIÓN: Usa TODA esta información para dar respuestas específicas y útiles.\n`;
        systemInstruction += `NO preguntes por información que YA TIENES arriba.\n`;
        systemInstruction += `═══════════════════════════════════════════════════\n`;
      }

      // Crear modelo CON system instruction (esto hace que Gemini siempre tenga el contexto)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: systemInstruction,
      });

      // Construir historial de chat en formato Gemini
      const history = conversationHistory?.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })) || [];

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 1.0, // Recomendación oficial para Gemini 2.0+
        },
      });

      // Enviar SOLO el mensaje del usuario (el contexto ya está en systemInstruction)
      const result = await chat.sendMessage(message);
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
