/**
 * VIAJES STORE
 *
 * Store de Zustand para gestionar el estado global de viajes.
 * Incluye operaciones CRUD y estado de loading/error.
 */

import { create } from 'zustand';
import type { Viaje, CreateViajeInput, UpdateViajeInput } from '@/types/viaje';
import * as viajesService from '@/services/viajesService';
import * as archiveService from '@/services/archiveService';

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

  /** Obtiene solo viajes archivados de un usuario */
  fetchArchivedViajes: (usuarioId: string) => Promise<void>;

  /** Crea un nuevo viaje */
  addViaje: (input: CreateViajeInput, usuarioId: string) => Promise<Viaje | null>;

  /** Actualiza un viaje existente */
  updateViaje: (id: string, input: UpdateViajeInput) => Promise<void>;

  /** Elimina un viaje */
  removeViaje: (id: string) => Promise<void>;

  /** Archiva un viaje (ocultarlo sin eliminarlo) */
  archiveViaje: (id: string) => Promise<void>;

  /** Desarchiva un viaje (hacerlo visible de nuevo) */
  unarchiveViaje: (id: string) => Promise<void>;

  /** Elimina un viaje completamente (archivos + BD) */
  deleteViajeCompletely: (id: string) => Promise<void>;

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

  // Obtener viajes activos del usuario (solo no archivados)
  fetchViajes: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      // Auto-archivar viajes finalizados antes de cargar
      await archiveService.autoArchiveFinishedTrips(usuarioId);

      // Obtener solo viajes no archivados
      const allViajes = await viajesService.getViajesByUsuario(usuarioId);
      const activeViajes = allViajes.filter((v) => v.archived === 0);

      set({ viajes: activeViajes, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar viajes', loading: false });
    }
  },

  // Obtener solo viajes archivados del usuario
  fetchArchivedViajes: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const allViajes = await viajesService.getViajesByUsuario(usuarioId);
      const archivedViajes = allViajes.filter((v) => v.archived === 1);

      set({ viajes: archivedViajes, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar viajes archivados', loading: false });
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

  // Archivar viaje
  archiveViaje: async (id) => {
    try {
      await archiveService.archiveViaje(id);
      set((state) => ({
        viajes: state.viajes.filter((v) => v.id !== id),
        selectedViaje: state.selectedViaje?.id === id ? null : state.selectedViaje,
      }));
    } catch (error) {
      set({ error: 'Error al archivar viaje' });
    }
  },

  // Desarchivar viaje
  unarchiveViaje: async (id) => {
    try {
      await archiveService.unarchiveViaje(id);

      // Recargar el viaje desarchivado desde BD
      const viajeDesarchivado = await viajesService.getViajeById(id);

      if (viajeDesarchivado) {
        set((state) => ({
          // Eliminar de la lista actual (archivados) y añadir a viajes activos si no está
          viajes: state.viajes.filter((v) => v.id !== id),
          selectedViaje: state.selectedViaje?.id === id ? null : state.selectedViaje,
        }));
      } else {
        // Si no se encuentra, solo quitarlo de la lista actual
        set((state) => ({
          viajes: state.viajes.filter((v) => v.id !== id),
          selectedViaje: state.selectedViaje?.id === id ? null : state.selectedViaje,
        }));
      }
    } catch (error) {
      set({ error: 'Error al desarchivar viaje' });
    }
  },

  // Eliminar viaje completamente
  deleteViajeCompletely: async (id) => {
    try {
      await archiveService.deleteViajeCompletely(id);
      set((state) => ({
        viajes: state.viajes.filter((v) => v.id !== id),
        selectedViaje: state.selectedViaje?.id === id ? null : state.selectedViaje,
      }));
    } catch (error) {
      set({ error: 'Error al eliminar viaje' });
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),
}));
