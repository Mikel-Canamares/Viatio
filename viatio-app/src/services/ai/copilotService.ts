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
