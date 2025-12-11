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

// Prompt del sistema para extracción de reservas
const EXTRACT_RESERVA_PROMPT = `Eres un asistente que extrae información estructurada de imágenes de reservas de viaje.
Analiza la imagen y extrae la siguiente información en formato JSON:

{
  "tipo": "vuelo" | "hotel" | "restaurante" | "actividad" | "transporte" | "otro",
  "titulo": "Nombre descriptivo de la reserva",
  "fecha": "YYYY-MM-DD o null",
  "hora": "HH:MM o null",
  "ubicacion": "Ciudad, País o dirección específica o null",
  "numeroReserva": "Código/número de confirmación o null",
  "proveedor": "Nombre de la aerolínea/hotel/empresa o null",
  "detalles": "Información adicional relevante",
  "confianza": 0.0-1.0 (qué tan seguro estás de la extracción)
}

Si no encuentras cierta información, usa null. Sé preciso y devuelve SOLO el JSON, sin texto adicional.`;

// Prompt del sistema para el asistente de viaje
const ASSISTANT_PROMPT = `Eres un asistente de viaje inteligente para la app Viatio.
Tu función es ayudar al usuario con:
- Recomendaciones de lugares para visitar
- Sugerencias de actividades
- Información sobre destinos
- Organización del itinerario
- Consejos de viaje

Sé conciso, amigable y útil. Usa el contexto del viaje si está disponible.`;

/**
 * Servicio de integración con Gemini AI
 */
export const geminiService = {
  /**
   * Extrae datos estructurados de una imagen de reserva usando Gemini Vision
   */
  async extractReservaFromImage(
    imageBase64: string,
    mimeType: string
  ): Promise<ReservaExtractedData> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent([
        EXTRACT_RESERVA_PROMPT,
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Intentar parsear como JSON
      try {
        // Limpiar posibles markdown code blocks (```json ... ```)
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);

        // Validar campos requeridos
        if (!parsed.tipo || !parsed.titulo) {
          throw new Error('Missing required fields in AI response');
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
  },

  /**
   * Mantiene una conversación con el asistente de viaje usando Gemini
   */
  async chatAssistant(
    message: string,
    context?: TripContext,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Construir contexto adicional si existe información del viaje
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
      const response = await result.response;

      return response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error in chat assistant: ${error.message}`);
      }
      throw error;
    }
  },
};
