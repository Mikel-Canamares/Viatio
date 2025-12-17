/**
 * RESERVAS STORE
 *
 * Store Zustand para gestión de estado de reservas.
 */

import { create } from 'zustand';
import { Reserva, CreateReservaInput, CategoriaReserva } from '@/types/reserva';
import type { PlaceMatchResult } from '@/types/placeMatching';
import * as reservasService from '@/services/reservasService';

interface ReservasState {
  reservas: Reserva[];
  selectedReserva: Reserva | null;
  loading: boolean;
  error: string | null;
}

interface ReservasActions {
  fetchReservas: (viajeId: string) => Promise<void>;
  fetchReservasByCategoria: (viajeId: string, categoria: CategoriaReserva) => Promise<void>;
  addReserva: (input: CreateReservaInput) => Promise<{ reserva: Reserva; placeMatch?: PlaceMatchResult } | null>;
  updateReserva: (id: string, input: Partial<CreateReservaInput>) => Promise<void>;
  removeReserva: (id: string) => Promise<void>;
  selectReserva: (reserva: Reserva | null) => void;
  clearReservas: () => void;
  clearError: () => void;
}

export const useReservasStore = create<ReservasState & ReservasActions>((set) => ({
  reservas: [],
  selectedReserva: null,
  loading: false,
  error: null,

  fetchReservas: async (viajeId) => {
    set({ loading: true, error: null });
    try {
      const reservas = await reservasService.getReservasByViajeId(viajeId);
      console.log('[ReservasStore] Reservas cargadas:', reservas.length, 'para viaje:', viajeId);
      set({ reservas, loading: false });
    } catch (error) {
      console.error('[ReservasStore] Error al cargar reservas:', error);
      set({ error: 'Error al cargar reservas', loading: false });
    }
  },

  fetchReservasByCategoria: async (viajeId, categoria) => {
    set({ loading: true, error: null });
    try {
      const reservas = await reservasService.getReservasByCategoria(viajeId, categoria);
      set({ reservas, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar reservas', loading: false });
    }
  },

  addReserva: async (input) => {
    set({ loading: true, error: null });
    try {
      const result = await reservasService.createReserva(input);
      set((state) => ({
        reservas: [...state.reservas, result.reserva].sort((a, b) =>
          (a.fechaInicio || '').localeCompare(b.fechaInicio || '')
        ),
        loading: false,
      }));
      return result;
    } catch (error) {
      set({ error: 'Error al crear reserva', loading: false });
      return null;
    }
  },

  updateReserva: async (id, input) => {
    try {
      const updated = await reservasService.updateReserva(id, input);
      if (updated) {
        set((state) => ({
          reservas: state.reservas.map((r) => (r.id === id ? updated : r)),
          selectedReserva: state.selectedReserva?.id === id ? updated : state.selectedReserva,
        }));
      }
    } catch (error) {
      set({ error: 'Error al actualizar reserva' });
    }
  },

  removeReserva: async (id) => {
    try {
      await reservasService.deleteReserva(id);
      set((state) => ({
        reservas: state.reservas.filter((r) => r.id !== id),
        selectedReserva: state.selectedReserva?.id === id ? null : state.selectedReserva,
      }));
    } catch (error) {
      set({ error: 'Error al eliminar reserva' });
    }
  },

  selectReserva: (reserva) => set({ selectedReserva: reserva }),

  clearReservas: () => set({ reservas: [], selectedReserva: null }),

  clearError: () => set({ error: null }),
}));
