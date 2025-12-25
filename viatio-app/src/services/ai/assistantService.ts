/**
 * SERVICIO DEL ASISTENTE IA
 *
 * Conecta con el endpoint /api/assistant del backend.
 * Maneja timeouts, errores y transformación de datos.
 */

import { buildSystemPrompt } from './assistantPrompt';
import type {
  MensajeChat,
  MensajeChatAPI,
  ContextoViaje,
  ContextoViajeAPI,
  AssistantAPIRequest,
  AssistantAPIResponse,
} from '@/types/asistente';
import { generateId, getCurrentTimestamp } from '@/database';
import { logError } from '@/utils/errorHandler';

// ============================================
// CONFIGURACIÓN
// ============================================

const API_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 2;

// ============================================
// TIPOS INTERNOS
// ============================================

interface SendMessageResult {
  success: boolean;
  message?: MensajeChat;
  error?: string;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

/**
 * Envía un mensaje al asistente y devuelve la respuesta
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: MensajeChat[],
  contexto?: ContextoViaje
): Promise<SendMessageResult> {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      throw new Error('EXPO_PUBLIC_BACKEND_URL no configurado');
    }

    // Transformar historial al formato de la API (role: 'model' en lugar de 'assistant')
    const historyForAPI: MensajeChatAPI[] = conversationHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));

    // Transformar contexto al formato de la API (enviar TODA la información)
    const contextForAPI: ContextoViajeAPI | undefined = contexto ? {
      tripId: contexto.viajeId,
      tripName: contexto.destino,
      destination: contexto.destino,
      startDate: contexto.fechaInicio,
      endDate: contexto.fechaFin,
      // Nuevos campos: enviar contexto completo
      reservations: contexto.reservas,
      places: contexto.lugares,
      budget: contexto.presupuesto,
      currentExpense: contexto.gastoActual,
    } : undefined;

    // Preparar request
    const requestBody: AssistantAPIRequest = {
      message: userMessage,
      context: contextForAPI,
      conversationHistory: historyForAPI,
    };

    // Enviar con timeout y reintentos
    const response = await fetchWithRetry(
      `${backendUrl}/api/assistant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      MAX_RETRIES
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const result: AssistantAPIResponse = await response.json();

    if (!result.success || !result.message) {
      throw new Error(result.error || 'Respuesta vacía del asistente');
    }

    // Crear mensaje del asistente
    const assistantMessage: MensajeChat = {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: getCurrentTimestamp(),
    };

    return {
      success: true,
      message: assistantMessage,
    };

  } catch (error) {
    logError(error, 'assistantService.sendMessage');

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Crea un mensaje de usuario
 */
export function createUserMessage(content: string): MensajeChat {
  return {
    id: generateId(),
    role: 'user',
    content: content.trim(),
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Fetch con timeout y reintentos
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // No reintentar si fue abort manual o error de red permanente
      if (lastError.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
      }

      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Error de conexión');
}

/**
 * Traduce errores técnicos a mensajes amigables
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('tardó')) {
      return 'La respuesta está tardando mucho. Intenta de nuevo.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Sin conexión a internet. Verifica tu conexión.';
    }
    if (message.includes('500') || message.includes('servidor')) {
      return 'El servidor está ocupado. Intenta en unos segundos.';
    }

    return error.message;
  }

  return 'Error desconocido. Intenta de nuevo.';
}
