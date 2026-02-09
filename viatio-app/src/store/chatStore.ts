/**
 * CHAT STORE - ZUSTAND
 *
 * Maneja el estado de la conversación con el asistente.
 * Usa el endpoint /api/copilot para respuestas con acciones.
 */

import { create } from 'zustand';
import type {
  MensajeChatConAcciones,
  ContextoViaje,
  ConversacionGuardada,
  CopilotScreen,
  MensajeChatAPI,
} from '@/types/asistente';
import * as copilotService from '@/services/ai/copilotService';
import * as conversacionesService from '@/services/conversacionesService';

// ============================================
// TIPOS DEL STORE
// ============================================

interface ChatState {
  // Estado
  mensajes: MensajeChatConAcciones[];
  loading: boolean;
  error: string | null;
  contexto: ContextoViaje | null;
  conversacionId: string | null;
  historial: ConversacionGuardada[];
  currentScreen: CopilotScreen;
  streamingEnabled: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
}

interface ChatActions {
  // Acciones principales
  setContexto: (contexto: ContextoViaje | null) => void;
  setCurrentScreen: (screen: CopilotScreen) => void;
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  setStreamingEnabled: (enabled: boolean) => void;
  clearChat: () => void;
  clearError: () => void;
  startNewConversation: () => void;

  // Historial
  saveConversacion: () => Promise<void>;
  loadConversacion: (conversacionId: string) => Promise<void>;
  deleteConversacion: (conversacionId: string) => Promise<void>;
  renameConversacion: (conversacionId: string, nuevoTitulo: string) => Promise<void>;
  loadHistorial: () => Promise<void>;

  // Acciones del agente
  markActionExecuted: (messageId: string, actionId: string, success: boolean, resultMessage?: string) => void;
}

type ChatStore = ChatState & ChatActions;

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Convertir mensajes al formato de la API
function toAPIFormat(mensajes: MensajeChatConAcciones[]): MensajeChatAPI[] {
  return mensajes.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    content: m.content,
  }));
}

// ============================================
// ESTADO INICIAL
// ============================================

const initialState: ChatState = {
  mensajes: [],
  loading: false,
  error: null,
  contexto: null,
  conversacionId: null,
  historial: [],
  currentScreen: 'standalone_chat',
  streamingEnabled: true, // Activar streaming por defecto
  isStreaming: false,
  streamingMessageId: null,
};

// ============================================
// STORE
// ============================================

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  /**
   * Establece el contexto del viaje actual
   */
  setContexto: (contexto) => {
    set({ contexto });
  },

  /**
   * Establece la pantalla actual (para contexto del copilot)
   */
  setCurrentScreen: (screen) => {
    set({ currentScreen: screen });
  },

  /**
   * Envía un mensaje y recibe respuesta del Copilot con acciones
   */
  sendMessage: async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const { mensajes, contexto, currentScreen, streamingEnabled } = get();

    // Si streaming está habilitado, usar sendMessageStream
    if (streamingEnabled) {
      return get().sendMessageStream(content);
    }

    // Crear mensaje del usuario
    const userMessage: MensajeChatConAcciones = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      timestamp: getCurrentTimestamp(),
    };

    // Añadir mensaje del usuario inmediatamente
    set((state) => ({
      mensajes: [...state.mensajes, userMessage],
      loading: true,
      error: null,
    }));

    try {
      // Preparar historial para la API (sin el mensaje actual del usuario)
      const historyForAPI = toAPIFormat(mensajes);

      // Enviar al Copilot con ContextPack completo
      const response = await copilotService.sendMessageToCopilot(trimmedContent, {
        currentScreen,
        tripId: contexto?.viajeId,
        conversationHistory: historyForAPI,
      });

      // Crear mensaje del asistente con acciones
      const assistantMessage: MensajeChatConAcciones = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: getCurrentTimestamp(),
        actions: response.actions,
      };

      // Añadir respuesta del asistente
      set((state) => ({
        mensajes: [...state.mensajes, assistantMessage],
        loading: false,
      }));

      // Guardar conversación automáticamente después de cada intercambio
      await get().saveConversacion();

    } catch (error) {
      console.error('[ChatStore] Error enviando mensaje:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al enviar mensaje',
      });
    }
  },

  /**
   * Envía un mensaje con streaming de respuestas
   */
  sendMessageStream: async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const { mensajes, contexto, currentScreen } = get();

    // Crear mensaje del usuario
    const userMessage: MensajeChatConAcciones = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      timestamp: getCurrentTimestamp(),
    };

    // Crear mensaje del asistente vacío (se llenará con streaming)
    const assistantMessageId = generateId();
    const assistantMessage: MensajeChatConAcciones = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: getCurrentTimestamp(),
      actions: [],
    };

    // Añadir ambos mensajes
    set((state) => ({
      mensajes: [...state.mensajes, userMessage, assistantMessage],
      loading: false,
      isStreaming: true,
      streamingMessageId: assistantMessageId,
      error: null,
    }));

    try {
      // Preparar historial para la API
      const historyForAPI = toAPIFormat(mensajes);

      // Enviar con streaming
      await copilotService.sendMessageToCopilotStream(
        trimmedContent,
        {
          currentScreen,
          tripId: contexto?.viajeId,
          conversationHistory: historyForAPI,
        },
        {
          onStart: () => {
            console.log('[ChatStore] Streaming iniciado');
          },
          onToken: (token: string) => {
            // Añadir token al mensaje del asistente
            set((state) => ({
              mensajes: state.mensajes.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + token }
                  : msg
              ),
            }));
          },
          onComplete: (response) => {
            // Actualizar con respuesta completa y acciones
            set((state) => ({
              mensajes: state.mensajes.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: response.message,
                      actions: response.actions,
                    }
                  : msg
              ),
              isStreaming: false,
              streamingMessageId: null,
            }));

            // Guardar conversación
            get().saveConversacion();
          },
          onError: (error) => {
            console.error('[ChatStore] Error en streaming:', error);
            set({
              isStreaming: false,
              streamingMessageId: null,
              error: error.message,
            });
          },
        }
      );
    } catch (error) {
      console.error('[ChatStore] Error enviando mensaje con streaming:', error);
      set({
        isStreaming: false,
        streamingMessageId: null,
        error: error instanceof Error ? error.message : 'Error al enviar mensaje',
      });
    }
  },

  /**
   * Activa/desactiva el modo streaming
   */
  setStreamingEnabled: (enabled: boolean) => {
    set({ streamingEnabled: enabled });
  },

  /**
   * Marca una acción como ejecutada
   */
  markActionExecuted: (messageId, actionId, success, resultMessage) => {
    set((state) => ({
      mensajes: state.mensajes.map(msg => {
        if (msg.id !== messageId) return msg;

        const actionResults = msg.actionResults || [];
        return {
          ...msg,
          actionResults: [
            ...actionResults,
            { actionId, success, message: resultMessage },
          ],
        };
      }),
    }));

    // Guardar después de ejecutar acción
    get().saveConversacion();
  },

  /**
   * Limpia la conversación
   */
  clearChat: () => {
    set({
      mensajes: [],
      error: null,
      conversacionId: null,
    });
  },

  /**
   * Limpia solo el error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Inicia una nueva conversación
   */
  startNewConversation: () => {
    // Guardar conversación actual antes de limpiar si tiene mensajes
    const { mensajes } = get();
    if (mensajes.length > 0) {
      get().saveConversacion();
    }

    set({
      mensajes: [],
      error: null,
      conversacionId: null,
      // NO limpiar contexto si venimos de un viaje
    });

    // Recargar historial
    get().loadHistorial();
  },

  /**
   * Guarda la conversación actual en el historial
   */
  saveConversacion: async () => {
    const { mensajes, contexto, conversacionId } = get();

    if (mensajes.length === 0) {
      return;
    }

    try {
      if (conversacionId) {
        // Actualizar conversación existente
        await conversacionesService.updateConversacion(conversacionId, mensajes, contexto || undefined);
        console.log('[ChatStore] Conversación actualizada:', conversacionId);
      } else {
        // Crear nueva conversación
        const newId = await conversacionesService.saveConversacion(mensajes, contexto || undefined);
        set({ conversacionId: newId });
        console.log('[ChatStore] Nueva conversación guardada:', newId);
      }

      // Recargar historial
      await get().loadHistorial();
    } catch (error) {
      console.error('[ChatStore] Error guardando conversación:', error);
    }
  },

  /**
   * Carga una conversación del historial
   */
  loadConversacion: async (conversacionId: string) => {
    try {
      const conversacion = await conversacionesService.getConversacionById(conversacionId);

      if (!conversacion) {
        set({ error: 'Conversación no encontrada' });
        return;
      }

      const mensajes = conversacionesService.parseMensajes(conversacion);
      const contexto = conversacionesService.parseContexto(conversacion);

      set({
        mensajes: mensajes as MensajeChatConAcciones[],
        contexto: contexto || null,
        conversacionId,
        error: null,
      });

      console.log('[ChatStore] Conversación cargada:', conversacionId);
    } catch (error) {
      console.error('[ChatStore] Error cargando conversación:', error);
      set({ error: 'No se pudo cargar la conversación' });
    }
  },

  /**
   * Elimina una conversación del historial
   */
  deleteConversacion: async (conversacionId: string) => {
    try {
      await conversacionesService.deleteConversacion(conversacionId);

      // Si es la conversación actual, limpiar el chat
      const { conversacionId: currentId } = get();
      if (currentId === conversacionId) {
        get().clearChat();
      }

      // Recargar historial
      await get().loadHistorial();

      console.log('[ChatStore] Conversación eliminada:', conversacionId);
    } catch (error) {
      console.error('[ChatStore] Error eliminando conversación:', error);
      set({ error: 'No se pudo eliminar la conversación' });
    }
  },

  /**
   * Renombra una conversación
   */
  renameConversacion: async (conversacionId: string, nuevoTitulo: string) => {
    try {
      await conversacionesService.renameConversacion(conversacionId, nuevoTitulo);
      await get().loadHistorial();
      console.log('[ChatStore] Conversación renombrada:', conversacionId);
    } catch (error) {
      console.error('[ChatStore] Error renombrando conversación:', error);
      set({ error: 'No se pudo renombrar la conversación' });
    }
  },

  /**
   * Carga el historial de conversaciones
   */
  loadHistorial: async () => {
    try {
      const historial = await conversacionesService.getAllConversaciones();
      set({ historial });
      console.log('[ChatStore] Historial cargado:', historial.length, 'conversaciones');
    } catch (error) {
      console.error('[ChatStore] Error cargando historial:', error);
    }
  },
}));

// ============================================
// SELECTORES (para optimizar renders)
// ============================================

export const selectMensajes = (state: ChatStore) => state.mensajes;
export const selectLoading = (state: ChatStore) => state.loading;
export const selectError = (state: ChatStore) => state.error;
export const selectContexto = (state: ChatStore) => state.contexto;
export const selectTieneMensajes = (state: ChatStore) => state.mensajes.length > 0;
export const selectHistorial = (state: ChatStore) => state.historial;
