/**
 * CHAT STORE - ZUSTAND
 *
 * Maneja el estado de la conversación con el asistente.
 * Patrón: State + Actions en un solo store.
 */

import { create } from 'zustand';
import type { MensajeChat, ContextoViaje, ConversacionGuardada } from '@/types/asistente';
import * as assistantService from '@/services/ai/assistantService';
import * as conversacionesService from '@/services/conversacionesService';

// ============================================
// TIPOS DEL STORE
// ============================================

interface ChatState {
  // Estado
  mensajes: MensajeChat[];
  loading: boolean;
  error: string | null;
  contexto: ContextoViaje | null;
  conversacionId: string | null; // ID de la conversación actual (si está guardada)
  historial: ConversacionGuardada[]; // Historial de conversaciones
}

interface ChatActions {
  // Acciones
  setContexto: (contexto: ContextoViaje | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
  startNewConversation: () => void;

  // Historial
  saveConversacion: () => Promise<void>;
  loadConversacion: (conversacionId: string) => Promise<void>;
  deleteConversacion: (conversacionId: string) => Promise<void>;
  renameConversacion: (conversacionId: string, nuevoTitulo: string) => Promise<void>;
  loadHistorial: () => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

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
   * Envía un mensaje y recibe respuesta del asistente
   */
  sendMessage: async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Crear mensaje del usuario
    const userMessage = assistantService.createUserMessage(trimmedContent);

    // Añadir mensaje del usuario inmediatamente
    set((state) => ({
      mensajes: [...state.mensajes, userMessage],
      loading: true,
      error: null,
    }));

    // Obtener estado actual
    const { mensajes, contexto } = get();

    // Enviar al backend
    const response = await assistantService.sendMessage(
      trimmedContent,
      mensajes, // Incluye el mensaje del usuario recién añadido
      contexto || undefined
    );

    if (response.success && response.message) {
      // Añadir respuesta del asistente
      set((state) => ({
        mensajes: [...state.mensajes, response.message!],
        loading: false,
      }));
    } else {
      // Mostrar error
      set({
        loading: false,
        error: response.error || 'Error al enviar mensaje',
      });
    }
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
   * Inicia una nueva conversación (limpia chat y vuelve al historial)
   */
  startNewConversation: () => {
    set({
      mensajes: [],
      error: null,
      conversacionId: null,
      contexto: null,
    });
  },

  /**
   * Guarda la conversación actual en el historial
   */
  saveConversacion: async () => {
    const { mensajes, contexto, conversacionId } = get();

    if (mensajes.length === 0) {
      console.log('[ChatStore] No hay mensajes para guardar');
      return;
    }

    try {
      if (conversacionId) {
        // Actualizar conversación existente
        await conversacionesService.updateConversacion(conversacionId, mensajes, contexto || undefined);
        console.log('[ChatStore] Conversación actualizada');
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
      set({ error: 'No se pudo guardar la conversación' });
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
        mensajes,
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

      // Recargar historial para reflejar el cambio
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
