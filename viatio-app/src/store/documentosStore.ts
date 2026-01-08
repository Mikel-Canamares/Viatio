/**
 * DOCUMENTOS STORE
 *
 * Store de Zustand para gestión de documentos de viaje.
 * Maneja el estado global de documentos y operaciones CRUD.
 */

import { create } from 'zustand';
import type { Documento, CreateDocumentoInput } from '@/types/documento';
import {
  createDocumento,
  getDocumentosByViajeId,
  deleteDocumento,
  updateDocumentoNombre,
} from '@/services/documentosService';
import { logError } from '@/utils/errorHandler';

// ============================================
// TYPES
// ============================================

interface DocumentosState {
  documentos: Documento[];
  loading: boolean;
  error: string | null;
}

interface DocumentosActions {
  fetchDocumentos: (viajeId: string) => Promise<void>;
  addDocumento: (input: CreateDocumentoInput, sourceUri: string) => Promise<Documento | null>;
  updateDocumento: (id: string, nombre: string) => Promise<boolean>;
  removeDocumento: (id: string) => Promise<void>;
  clearDocumentos: () => void;
  clearError: () => void;
}

type DocumentosStore = DocumentosState & DocumentosActions;

// ============================================
// STORE
// ============================================

export const useDocumentosStore = create<DocumentosStore>((set) => ({
  // ============================================
  // STATE
  // ============================================
  documentos: [],
  loading: false,
  error: null,

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Carga todos los documentos de un viaje
   */
  fetchDocumentos: async (viajeId: string) => {
    set({ loading: true, error: null });
    try {
      const documentos = await getDocumentosByViajeId(viajeId);
      set({ documentos, loading: false });
    } catch (error) {
      logError(error, 'fetchDocumentos');
      set({ error: 'Error al cargar documentos', loading: false });
    }
  },

  /**
   * Añade un nuevo documento
   */
  addDocumento: async (input: CreateDocumentoInput, sourceUri: string) => {
    set({ loading: true, error: null });
    try {
      const documento = await createDocumento(input, sourceUri);
      set((state) => ({
        documentos: [documento, ...state.documentos],
        loading: false,
      }));
      return documento;
    } catch (error) {
      logError(error, 'addDocumento');
      set({ error: 'Error al guardar documento', loading: false });
      return null;
    }
  },

  /**
   * Actualiza el nombre de un documento
   */
  updateDocumento: async (id: string, nombre: string) => {
    try {
      const success = await updateDocumentoNombre(id, nombre);
      if (success) {
        set((state) => ({
          documentos: state.documentos.map((d) =>
            d.id === id ? { ...d, nombre } : d
          ),
        }));
        return true;
      } else {
        set({ error: 'Error al actualizar documento' });
        return false;
      }
    } catch (error) {
      logError(error, 'updateDocumento');
      set({ error: 'Error al actualizar documento' });
      return false;
    }
  },

  /**
   * Elimina un documento (archivo físico y registro)
   */
  removeDocumento: async (id: string) => {
    try {
      const success = await deleteDocumento(id);
      if (success) {
        set((state) => ({
          documentos: state.documentos.filter((d) => d.id !== id),
        }));
      } else {
        set({ error: 'Error al eliminar documento' });
      }
    } catch (error) {
      logError(error, 'removeDocumento');
      set({ error: 'Error al eliminar documento' });
    }
  },

  /**
   * Limpia todos los documentos del store
   */
  clearDocumentos: () => set({ documentos: [], error: null }),

  /**
   * Limpia el error actual
   */
  clearError: () => set({ error: null }),
}));

// ============================================
// SELECTORS
// ============================================

/**
 * Selectors para subscripciones granulares
 * Previene re-renders innecesarios al subscribirse solo a los datos necesarios
 */
export const documentosSelectors = {
  /** Selector para array de documentos */
  documentos: (state: DocumentosStore) => state.documentos,

  /** Selector para estado de carga */
  loading: (state: DocumentosStore) => state.loading,

  /** Selector para estado de error */
  error: (state: DocumentosStore) => state.error,

  /** Selector para acciones (referencias estables) */
  actions: (state: DocumentosStore) => ({
    fetchDocumentos: state.fetchDocumentos,
    addDocumento: state.addDocumento,
    updateDocumento: state.updateDocumento,
    removeDocumento: state.removeDocumento,
    clearDocumentos: state.clearDocumentos,
    clearError: state.clearError,
  }),
};
