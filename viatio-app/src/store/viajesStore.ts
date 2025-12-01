/**
 * VIAJES STORE
 *
 * Store de Zustand para gestionar el estado global de viajes.
 * Incluye operaciones CRUD y estado de loading/error.
 */

import { create } from 'zustand';
import type { Viaje, CreateViajeInput, UpdateViajeInput } from '@/types/viaje';
import * as viajesService from '@/services/viajesService';

// ============================================
// TIPOS
// ============================================

interface ViajesState {
  /** Lista de viajes del usuario */
  viajes: Viaje[];

  /** Viaje seleccionado actualmente */
  selectedViaje: Viaje | null;

  /** Si está cargando datos */
  loading: boolean;

  /** Mensaje de error si existe */
  error: string | null;
}

interface ViajesActions {
  /** Obtiene todos los viajes de un usuario */
  fetchViajes: (usuarioId: string) => Promise<void>;

  /** Crea un nuevo viaje */
  addViaje: (input: CreateViajeInput, usuarioId: string) => Promise<Viaje | null>;

  /** Actualiza un viaje existente */
  updateViaje: (id: string, input: UpdateViajeInput) => Promise<void>;

  /** Elimina un viaje */
  removeViaje: (id: string) => Promise<void>;

  /** Selecciona un viaje */
  selectViaje: (viaje: Viaje | null) => void;

  /** Limpia el error actual */
  clearError: () => void;
}

// ============================================
// STORE
// ============================================

export const useViajesStore = create<ViajesState & ViajesActions>((set) => ({
  // Estado inicial
  viajes: [],
  selectedViaje: null,
  loading: false,
  error: null,

  // Obtener viajes del usuario
  fetchViajes: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const viajes = await viajesService.getViajesByUsuario(usuarioId);
      set({ viajes, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar viajes', loading: false });
    }
  },

  // Crear nuevo viaje
  addViaje: async (input, usuarioId) => {
    set({ loading: true, error: null });
    try {
      const viaje = await viajesService.createViaje(input, usuarioId);
      set((state) => ({
        viajes: [viaje, ...state.viajes],
        loading: false,
      }));
      return viaje;
    } catch (error) {
      set({ error: 'Error al crear viaje', loading: false });
      return null;
    }
  },

  // Actualizar viaje
  updateViaje: async (id, input) => {
    try {
      const updated = await viajesService.updateViaje(id, input);
      if (updated) {
        set((state) => ({
          viajes: state.viajes.map((v) => (v.id === id ? updated : v)),
          selectedViaje: state.selectedViaje?.id === id ? updated : state.selectedViaje,
        }));
      }
    } catch (error) {
      set({ error: 'Error al actualizar viaje' });
    }
  },

  // Eliminar viaje
  removeViaje: async (id) => {
    try {
      await viajesService.deleteViaje(id);
      set((state) => ({
        viajes: state.viajes.filter((v) => v.id !== id),
        selectedViaje: state.selectedViaje?.id === id ? null : state.selectedViaje,
      }));
    } catch (error) {
      set({ error: 'Error al eliminar viaje' });
    }
  },

  // Seleccionar viaje
  selectViaje: (viaje) => set({ selectedViaje: viaje }),

  // Limpiar error
  clearError: () => set({ error: null }),
}));
