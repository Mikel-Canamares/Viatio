/**
 * STORE: EVENTOS PERSONALIZADOS
 *
 * Estado global para eventos personalizados usando Zustand.
 * Gestiona la lista de eventos, selección y operaciones CRUD.
 */

import { create } from 'zustand';
import {
  EventoPersonalizado,
  CreateEventoInput,
  UpdateEventoInput,
} from '@/types/evento';
import * as eventosService from '@/services/eventosService';
import { logError } from '@/utils/errorHandler';

interface EventosState {
  eventos: EventoPersonalizado[];
  eventoSeleccionado: EventoPersonalizado | null;
  loading: boolean;
  error: string | null;
}

interface EventosActions {
  // Fetch
  fetchEventos: (viajeId: string) => Promise<void>;
  fetchEventosByDia: (diaId: string) => Promise<EventoPersonalizado[]>;

  // CRUD
  addEvento: (input: CreateEventoInput) => Promise<EventoPersonalizado | null>;
  updateEvento: (
    id: string,
    input: UpdateEventoInput
  ) => Promise<EventoPersonalizado | null>;
  removeEvento: (id: string) => Promise<boolean>;

  // Acciones específicas
  toggleCompletado: (id: string) => Promise<void>;
  asignarADia: (eventoId: string, diaId: string | null) => Promise<void>;
  duplicarEvento: (
    eventoId: string,
    nuevoDiaId?: string
  ) => Promise<EventoPersonalizado | null>;

  // Selección
  selectEvento: (evento: EventoPersonalizado | null) => void;

  // Limpieza
  clearEventos: () => void;
  clearError: () => void;
}

export const useEventosStore = create<EventosState & EventosActions>(
  (set, get) => ({
    eventos: [],
    eventoSeleccionado: null,
    loading: false,
    error: null,

    fetchEventos: async (viajeId) => {
      set({ loading: true, error: null });
      try {
        const eventos = await eventosService.getEventosByViajeId(viajeId);
        set({ eventos, loading: false });
      } catch (error) {
        logError(error, 'eventosStore.fetchEventos');
        set({ error: 'Error al cargar eventos', loading: false });
      }
    },

    fetchEventosByDia: async (diaId) => {
      try {
        return await eventosService.getEventosByDiaId(diaId);
      } catch (error) {
        logError(error, 'eventosStore.fetchEventosByDia');
        return [];
      }
    },

    addEvento: async (input) => {
      set({ loading: true, error: null });
      try {
        const evento = await eventosService.createEvento(input);
        set((state) => ({
          eventos: [...state.eventos, evento].sort((a, b) => {
            // Ordenar por hora
            if (a.horaInicio && b.horaInicio) {
              return a.horaInicio.localeCompare(b.horaInicio);
            }
            if (a.horaInicio) return -1;
            if (b.horaInicio) return 1;
            return a.nombre.localeCompare(b.nombre);
          }),
          loading: false,
        }));
        return evento;
      } catch (error) {
        logError(error, 'eventosStore.addEvento');
        set({ error: 'Error al crear evento', loading: false });
        return null;
      }
    },

    updateEvento: async (id, input) => {
      set({ loading: true, error: null });
      try {
        const updated = await eventosService.updateEvento(id, input);
        if (updated) {
          set((state) => ({
            eventos: state.eventos.map((e) => (e.id === id ? updated : e)),
            eventoSeleccionado:
              state.eventoSeleccionado?.id === id
                ? updated
                : state.eventoSeleccionado,
            loading: false,
          }));
        }
        return updated;
      } catch (error) {
        logError(error, 'eventosStore.updateEvento');
        set({ error: 'Error al actualizar evento', loading: false });
        return null;
      }
    },

    removeEvento: async (id) => {
      try {
        await eventosService.deleteEvento(id);
        set((state) => ({
          eventos: state.eventos.filter((e) => e.id !== id),
          eventoSeleccionado:
            state.eventoSeleccionado?.id === id
              ? null
              : state.eventoSeleccionado,
        }));
        return true;
      } catch (error) {
        logError(error, 'eventosStore.removeEvento');
        set({ error: 'Error al eliminar evento' });
        return false;
      }
    },

    toggleCompletado: async (id) => {
      try {
        const updated = await eventosService.toggleEventoCompletado(id);
        if (updated) {
          set((state) => ({
            eventos: state.eventos.map((e) => (e.id === id ? updated : e)),
          }));
        }
      } catch (error) {
        logError(error, 'eventosStore.toggleCompletado');
      }
    },

    asignarADia: async (eventoId, diaId) => {
      try {
        const updated = await eventosService.asignarEventoADia(eventoId, diaId);
        if (updated) {
          set((state) => ({
            eventos: state.eventos.map((e) =>
              e.id === eventoId ? updated : e
            ),
          }));
        }
      } catch (error) {
        logError(error, 'eventosStore.asignarADia');
      }
    },

    duplicarEvento: async (eventoId, nuevoDiaId) => {
      try {
        const duplicado = await eventosService.duplicarEvento(
          eventoId,
          nuevoDiaId
        );
        if (duplicado) {
          set((state) => ({
            eventos: [...state.eventos, duplicado],
          }));
        }
        return duplicado;
      } catch (error) {
        logError(error, 'eventosStore.duplicarEvento');
        return null;
      }
    },

    selectEvento: (evento) => set({ eventoSeleccionado: evento }),

    clearEventos: () => set({ eventos: [], eventoSeleccionado: null }),

    clearError: () => set({ error: null }),
  })
);
