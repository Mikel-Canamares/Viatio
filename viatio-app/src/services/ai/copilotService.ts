/**
 * COPILOT SERVICE
 *
 * Servicio para comunicarse con el endpoint /api/copilot del backend.
 * Maneja el envío de ContextPack y recepción de respuestas con acciones.
 */

import { buildContextPack, type BuildContextPackOptions } from './contextPackBuilder';
import type {
  ContextPack,
  MensajeChatAPI,
  AgentResponse,
  CopilotAPIResponse,
} from '@/types/asistente';
import { logError } from '@/utils/errorHandler';

// ============================================
// CONFIGURACIÓN
// ============================================

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const COPILOT_ENDPOINT = `${BACKEND_URL}/api/copilot`;
const COPILOT_STREAM_ENDPOINT = `${BACKEND_URL}/api/copilot/stream`;
const REQUEST_TIMEOUT = 30000; // 30 segundos

// ============================================
// TIPOS
// ============================================

export interface CopilotServiceOptions extends BuildContextPackOptions {
  conversationHistory?: MensajeChatAPI[];
}

// ============================================
// FUNCIONES
// ============================================

/**
 * Envía un mensaje al Copilot y recibe una respuesta con posibles acciones
 */
export async function sendMessageToCopilot(
  message: string,
  options: CopilotServiceOptions
): Promise<AgentResponse> {
  try {
    console.log('[CopilotService] Enviando mensaje al Copilot');

    // Construir ContextPack
    const contextPack = await buildContextPack(options);

    // Preparar body
    const body = {
      message,
      contextPack,
      conversationHistory: options.conversationHistory || [],
    };

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(COPILOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data: CopilotAPIResponse = await response.json();

      if (!data.success || !data.response) {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }

      console.log('[CopilotService] Respuesta recibida:', {
        messageLength: data.response.message.length,
        actionsCount: data.response.actions.length,
        processingTime: data.response.metadata?.processingTimeMs,
      });

      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    logError(error, 'copilotService.sendMessageToCopilot');

    // Devolver respuesta de error amigable
    return {
      message: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
      actions: [],
      metadata: {
        confidence: 0,
        sourcesUsed: [],
        processingTimeMs: 0,
      },
    };
  }
}

/**
 * Versión simplificada que usa el endpoint legacy /api/assistant
 * Útil como fallback si el nuevo endpoint falla
 */
export async function sendMessageToAssistantLegacy(
  message: string,
  context?: {
    tripId?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
  },
  conversationHistory?: MensajeChatAPI[]
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    return data.message || 'Sin respuesta';
  } catch (error) {
    logError(error, 'copilotService.sendMessageToAssistantLegacy');
    return 'Lo siento, no pude procesar tu mensaje. Por favor, inténtalo de nuevo.';
  }
}

/**
 * Verifica si el backend del Copilot está disponible
 */
export async function checkCopilotAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Convierte un AgentResponse a formato para mostrar en UI
 */
export function formatAgentResponseForDisplay(response: AgentResponse): {
  text: string;
  hasActions: boolean;
  actionCount: number;
  confidence: number;
} {
  return {
    text: response.message,
    hasActions: response.actions.length > 0,
    actionCount: response.actions.length,
    confidence: response.metadata?.confidence || 0,
  };
}

// ============================================
// STREAMING (SSE)
// ============================================

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (response: AgentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Envía un mensaje al Copilot con streaming de respuestas (SSE)
 *
 * NOTA: React Native no soporta nativamente EventSource/SSE.
 * Esta implementación usa fetch con lectura de chunks del response.body.
 */
export async function sendMessageToCopilotStream(
  message: string,
  options: CopilotServiceOptions,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    console.log('[CopilotService] Iniciando streaming con Copilot');

    // Construir ContextPack
    const contextPack = await buildContextPack(options);

    // Preparar body
    const body = {
      message,
      contextPack,
      conversationHistory: options.conversationHistory || [],
    };

    // Hacer request
    const response = await fetch(COPILOT_STREAM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body no disponible');
    }

    // Leer el stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    callbacks.onStart?.();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decodificar chunk
      buffer += decoder.decode(value, { stream: true });

      // Procesar líneas completas
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Guardar línea incompleta

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const event = line.substring(6).trim();
          const nextLine = lines[lines.indexOf(line) + 1];

          if (nextLine && nextLine.startsWith('data:')) {
            const dataStr = nextLine.substring(5).trim();

            try {
              const data = JSON.parse(dataStr);

              if (event === 'start') {
                console.log('[CopilotService] Stream iniciado');
              } else if (event === 'token') {
                callbacks.onToken?.(data.text);
              } else if (event === 'complete') {
                const agentResponse: AgentResponse = {
                  message: data.message,
                  actions: data.actions || [],
                  metadata: data.metadata,
                };
                callbacks.onComplete?.(agentResponse);
              } else if (event === 'error') {
                throw new Error(data.error || 'Error en streaming');
              }
            } catch (parseError) {
              console.error('[CopilotService] Error parseando SSE data:', parseError);
            }
          }
        }
      }
    }

    console.log('[CopilotService] Stream finalizado');
  } catch (error) {
    logError(error, 'copilotService.sendMessageToCopilotStream');
    callbacks.onError?.(error instanceof Error ? error : new Error('Error desconocido'));
  }
}
