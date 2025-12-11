import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import type { ReservaExtractedData } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Extrae datos estructurados de una imagen de reserva usando OCR + LLM
   */
  async extractReservaFromImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
  ): Promise<ReservaExtractedData> {
    const prompt = `Analiza esta imagen de reserva y extrae la siguiente información en formato JSON:

{
  "tipo": "vuelo | hotel | restaurante | actividad | transporte | otro",
  "titulo": "Nombre descriptivo corto de la reserva",
  "fecha": "YYYY-MM-DD o null si no está clara",
  "hora": "HH:MM o null",
  "ubicacion": "Dirección o lugar",
  "numeroReserva": "Código/número de reserva",
  "proveedor": "Nombre de la aerolínea/hotel/empresa",
  "detalles": "Información adicional relevante (pasajeros, servicios incluidos, etc.)",
  "confianza": 0.85
}

REGLAS:
- Si un campo no está claro, usa null
- "confianza" debe ser entre 0 y 1 según qué tan seguro estés de la información
- "detalles" debe ser un resumen natural y legible
- Responde SOLO con el JSON, sin markdown ni explicaciones`;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Limpiar markdown si Gemini lo incluye
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(jsonText) as ReservaExtractedData;

      // Validación básica
      if (!data.tipo || !data.titulo) {
        throw new Error('Respuesta de Gemini incompleta: faltan campos obligatorios');
      }

      return data;
    } catch (error) {
      console.error('Error en extractReservaFromImage:', error);
      throw new Error(
        `Error al procesar la imagen: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    }
  }

  /**
   * Asistente de viaje conversacional
   */
  async chatAssistant(
    userMessage: string,
    context?: {
      tripId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      destination?: string;
    },
    conversationHistory?: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string> {
    let systemPrompt = `Eres un asistente de viaje experto y amigable para la app Viatio.
Tu objetivo es ayudar al usuario con su planificación de viajes, dar recomendaciones, responder dudas logísticas, y ser útil con información sobre destinos.

INSTRUCCIONES:
- Responde de forma concisa pero útil (máximo 3-4 párrafos)
- Si el usuario pregunta sobre un lugar, da información práctica (transporte, horarios, recomendaciones)
- Si te piden crear o modificar datos del viaje, indica que eso lo harán desde la app
- Sé conversacional y cercano, pero profesional`;

    if (context) {
      systemPrompt += `\n\nCONTEXTO DEL VIAJE ACTUAL:`;
      if (context.tripName) systemPrompt += `\n- Nombre: ${context.tripName}`;
      if (context.destination) systemPrompt += `\n- Destino: ${context.destination}`;
      if (context.startDate && context.endDate) {
        systemPrompt += `\n- Fechas: ${context.startDate} a ${context.endDate}`;
      }
    }

    try {
      const chat = this.model.startChat({
        history: conversationHistory?.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })) || [],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(`${systemPrompt}\n\nUsuario: ${userMessage}`);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error en chatAssistant:', error);
      throw new Error(
        `Error al comunicarse con el asistente: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    }
  }
}

export const geminiService = new GeminiService();
