/**
 * GASTOS STORE
 *
 * Store de Zustand para gestionar el estado global de gastos.
 * Incluye operaciones CRUD, resúmenes y estado de loading/error.
 */

import { create } from 'zustand';
import { Gasto, CreateGastoInput, ResumenGastos } from '@/types/gasto';
import * as gastosService from '@/services/gastosService';

// ============================================
// TIPOS
// ============================================

interface GastosState {
  /** Lista de gastos del viaje actual */
  gastos: Gasto[];

  /** Resumen de gastos con estadísticas */
  resumen: ResumenGastos | null;

  /** Si está cargando datos */
  loading: boolean;

  /** Mensaje de error si existe */
  error: string | null;
}

interface GastosActions {
  /** Obtiene todos los gastos de un viaje */
  fetchGastos: (viajeId: string) => Promise<void>;

  /** Obtiene el resumen de gastos de un viaje */
  fetchResumen: (viajeId: string) => Promise<void>;

  /** Crea un nuevo gasto */
  addGasto: (input: CreateGastoInput) => Promise<Gasto | null>;

  /** Actualiza un gasto existente */
  updateGasto: (id: string, input: Partial<CreateGastoInput>) => Promise<void>;

  /** Elimina un gasto */
  removeGasto: (id: string, viajeId: string) => Promise<void>;

  /** Limpia la lista de gastos y resumen */
  clearGastos: () => void;

  /** Limpia el error actual */
  clearError: () => void;
}

// ============================================
// STORE
// ============================================

export const useGastosStore = create<GastosState & GastosActions>((set, get) => ({
  gastos: [],
  resumen: null,
  loading: false,
  error: null,

  fetchGastos: async (viajeId) => {
    set({ loading: true, error: null });
    try {
      const gastos = await gastosService.getGastosByViajeId(viajeId);
      set({ gastos, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar gastos', loading: false });
    }
  },

  fetchResumen: async (viajeId) => {
    try {
      // Usar resumen convertido que maneja múltiples divisas automáticamente
      const resumen = await gastosService.getResumenGastosConvertido(viajeId);
      set({ resumen });
    } catch (error) {
      set({ error: 'Error al cargar resumen' });
    }
  },

  addGasto: async (input) => {
    set({ loading: true, error: null });
    try {
      const gasto = await gastosService.createGasto(input);
      set((state) => ({
        gastos: [gasto, ...state.gastos],
        loading: false,
      }));
      // Actualizar resumen
      get().fetchResumen(input.viajeId);
      return gasto;
    } catch (error) {
      set({ error: 'Error al crear gasto', loading: false });
      return null;
    }
  },

  updateGasto: async (id, input) => {
    try {
      const updated = await gastosService.updateGasto(id, input);
      if (updated) {
        set((state) => ({
          gastos: state.gastos.map((g) => (g.id === id ? updated : g)),
        }));
      }
    } catch (error) {
      set({ error: 'Error al actualizar gasto' });
    }
  },

  removeGasto: async (id, viajeId) => {
    try {
      await gastosService.deleteGasto(id);
      set((state) => ({
        gastos: state.gastos.filter((g) => g.id !== id),
      }));
      // Actualizar resumen
      get().fetchResumen(viajeId);
    } catch (error) {
      set({ error: 'Error al eliminar gasto' });
    }
  },

  clearGastos: () => set({ gastos: [], resumen: null }),

  clearError: () => set({ error: null }),
}));
