/**
 * STORE: CHECKLIST ITEMS
 *
 * Estado global para items de checklist usando Zustand.
 * Gestiona items personales y grupales de viajes.
 */

import { create } from 'zustand';
import {
  ChecklistItem,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  SeccionChecklist,
} from '@/types/checklist';
import * as checklistService from '@/services/checklistService';
import { logError } from '@/utils/errorHandler';

interface ChecklistState {
  items: ChecklistItem[];
  loading: boolean;
  error: string | null;
}

interface ChecklistActions {
  // Fetch
  fetchItems: (viajeId: string) => Promise<void>;
  fetchItemsBySeccion: (viajeId: string, seccion: SeccionChecklist) => Promise<ChecklistItem[]>;

  // CRUD
  addItem: (input: CreateChecklistItemInput, usuarioId: string) => Promise<ChecklistItem | null>;
  updateItem: (id: string, input: UpdateChecklistItemInput) => Promise<ChecklistItem | null>;
  removeItem: (id: string) => Promise<boolean>;

  // Acciones específicas
  toggleCompletado: (id: string) => Promise<void>;
  reorderItems: (items: Array<{ id: string; orden: number }>) => Promise<void>;

  // Limpieza
  clearItems: () => void;
  clearError: () => void;
}

export const useChecklistStore = create<ChecklistState & ChecklistActions>(
  (set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchItems: async (viajeId) => {
      set({ loading: true, error: null });
      try {
        const items = await checklistService.getChecklistItemsByViajeId(viajeId);
        set({ items, loading: false });
      } catch (error) {
        logError(error, 'checklistStore.fetchItems');
        set({ error: 'Error al cargar checklist', loading: false });
      }
    },

    fetchItemsBySeccion: async (viajeId, seccion) => {
      try {
        return await checklistService.getItemsBySeccion(viajeId, seccion);
      } catch (error) {
        logError(error, 'checklistStore.fetchItemsBySeccion');
        return [];
      }
    },

    addItem: async (input, usuarioId) => {
      set({ loading: true, error: null });
      try {
        const item = await checklistService.createChecklistItem(input, usuarioId);
        set((state) => ({
          items: [...state.items, item].sort((a, b) => {
            // Ordenar por orden ASC, luego por fecha DESC
            if (a.orden !== b.orden) {
              return a.orden - b.orden;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }),
          loading: false,
        }));
        return item;
      } catch (error) {
        logError(error, 'checklistStore.addItem');
        set({ error: 'Error al crear item', loading: false });
        return null;
      }
    },

    updateItem: async (id, input) => {
      set({ loading: true, error: null });
      try {
        const updated = await checklistService.updateChecklistItem(id, input);
        if (updated) {
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? updated : item)),
            loading: false,
          }));
        }
        return updated;
      } catch (error) {
        logError(error, 'checklistStore.updateItem');
        set({ error: 'Error al actualizar item', loading: false });
        return null;
      }
    },

    removeItem: async (id) => {
      set({ loading: true, error: null });
      try {
        const success = await checklistService.deleteChecklistItem(id);
        if (success) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            loading: false,
          }));
        }
        return success;
      } catch (error) {
        logError(error, 'checklistStore.removeItem');
        set({ error: 'Error al eliminar item', loading: false });
        return false;
      }
    },

    toggleCompletado: async (id) => {
      try {
        const updated = await checklistService.toggleItemCompletado(id);
        if (updated) {
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? updated : item)),
          }));
        }
      } catch (error) {
        logError(error, 'checklistStore.toggleCompletado');
        set({ error: 'Error al actualizar estado' });
      }
    },

    reorderItems: async (itemsToReorder) => {
      set({ loading: true, error: null });
      try {
        await checklistService.reorderItems(itemsToReorder);

        // Actualizar orden local
        set((state) => {
          const orderMap = new Map(itemsToReorder.map(item => [item.id, item.orden]));
          return {
            items: state.items.map(item => {
              const newOrden = orderMap.get(item.id);
              return newOrden !== undefined ? { ...item, orden: newOrden } : item;
            }).sort((a, b) => {
              if (a.orden !== b.orden) {
                return a.orden - b.orden;
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }),
            loading: false,
          };
        });
      } catch (error) {
        logError(error, 'checklistStore.reorderItems');
        set({ error: 'Error al reordenar items', loading: false });
      }
    },

    clearItems: () => {
      set({ items: [], error: null });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
