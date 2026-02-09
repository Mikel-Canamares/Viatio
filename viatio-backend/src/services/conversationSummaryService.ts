/**
 * CONVERSATION SUMMARY SERVICE
 *
 * Gestiona el resumen inteligente de conversaciones largas para:
 * - Mantener el contexto relevante
 * - Reducir costes de tokens con Gemini
 * - Evitar límites de contexto
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// ============================================
// CONSTANTES
// ============================================

/**
 * Límites de tokens para gestionar historial
 */
export const TOKEN_LIMITS = {
  MAX_HISTORY_TOKENS: 4000, // Máximo de tokens en historial antes de resumir
  SUMMARY_TARGET_TOKENS: 1000, // Target de tokens tras resumir
  MAX_MESSAGES_BEFORE_SUMMARY: 20, // Máx mensajes antes de forzar resumen
};

/**
 * Estimación aproximada: 1 token ≈ 4 caracteres en español
 */
const CHARS_PER_TOKEN = 4;

// ============================================
// HELPERS
// ============================================

/**
 * Estima el número de tokens en un texto
 * Nota: Es una aproximación. Para precisión, usar tokenizer real.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Calcula tokens totales en el historial
 */
function calculateHistoryTokens(
  history: Array<{ role: string; content: string }>
): number {
  return history.reduce((total, msg) => total + estimateTokens(msg.content), 0);
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Resume una conversación larga manteniendo contexto relevante
 *
 * Estrategia:
 * 1. Mantener los últimos 3 mensajes completos (contexto inmediato)
 * 2. Resumir mensajes antiguos en 2-3 párrafos
 * 3. Extraer puntos clave (acciones tomadas, decisiones, info importante)
 */
export async function summarizeConversation(
  history: Array<{ role: string; content: string }>
): Promise<Array<{ role: string; content: string }>> {
  if (history.length <= 6) {
    // Si hay menos de 6 mensajes (3 intercambios), no resumir
    return history;
  }

  try {
    console.log('[ConversationSummary] Iniciando resumen de conversación');

    // Separar mensajes antiguos y recientes
    const recentMessages = history.slice(-6); // Últimos 3 intercambios
    const oldMessages = history.slice(0, -6); // Mensajes antiguos a resumir

    // Construir texto de mensajes antiguos
    const oldConversationText = oldMessages
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n\n');

    // Crear prompt para resumir
    const summaryPrompt = `Resume la siguiente conversación de un asistente de viaje.
Enfócate en:
1. Decisiones tomadas por el usuario
2. Lugares buscados o guardados
3. Eventos añadidos a la agenda
4. Información importante del viaje
5. Preferencias manifestadas

Mantén el resumen en 2-3 párrafos concisos. Usa formato claro y bullet points donde aplique.

CONVERSACIÓN A RESUMIR:
${oldConversationText}

RESUMEN CONCISO:`;

    // Usar Gemini Flash para resumir (más económico)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent(summaryPrompt);
    const summary = result.response.text();

    console.log(
      `[ConversationSummary] Resumen generado: ${estimateTokens(summary)} tokens (de ${calculateHistoryTokens(oldMessages)} tokens originales)`
    );

    // Construir nuevo historial: [resumen] + [mensajes recientes]
    const summarizedHistory = [
      {
        role: 'user',
        content: '[RESUMEN DE CONVERSACIÓN ANTERIOR]\n\n' + summary,
      },
      ...recentMessages,
    ];

    return summarizedHistory;
  } catch (error) {
    console.error('[ConversationSummary] Error resumiendo conversación:', error);
    // En caso de error, devolver historial sin cambios
    return history;
  }
}

/**
 * Decide si el historial necesita ser resumido
 */
export function shouldSummarizeHistory(
  history: Array<{ role: string; content: string }>
): boolean {
  // Criterio 1: Número de mensajes
  if (history.length >= TOKEN_LIMITS.MAX_MESSAGES_BEFORE_SUMMARY) {
    return true;
  }

  // Criterio 2: Tokens estimados
  const totalTokens = calculateHistoryTokens(history);
  if (totalTokens >= TOKEN_LIMITS.MAX_HISTORY_TOKENS) {
    return true;
  }

  return false;
}

/**
 * Gestiona el historial automáticamente:
 * - Si es muy largo → resume
 * - Si no → devuelve sin cambios
 */
export async function manageConversationHistory(
  history: Array<{ role: string; content: string }>
): Promise<Array<{ role: string; content: string }>> {
  if (shouldSummarizeHistory(history)) {
    console.log(
      `[ConversationSummary] Historial largo detectado (${history.length} mensajes, ~${calculateHistoryTokens(history)} tokens). Resumiendo...`
    );
    return await summarizeConversation(history);
  }

  return history;
}

/**
 * Obtiene estadísticas del historial
 */
export function getHistoryStats(history: Array<{ role: string; content: string }>): {
  messageCount: number;
  estimatedTokens: number;
  shouldSummarize: boolean;
  percentOfLimit: number;
} {
  const messageCount = history.length;
  const estimatedTokens = calculateHistoryTokens(history);
  const shouldSummarize = shouldSummarizeHistory(history);
  const percentOfLimit = Math.round(
    (estimatedTokens / TOKEN_LIMITS.MAX_HISTORY_TOKENS) * 100
  );

  return {
    messageCount,
    estimatedTokens,
    shouldSummarize,
    percentOfLimit,
  };
}
