import { create } from 'zustand';
import {
  SharedTrip,
  TripMember,
  TripInvitation,
  PendingInvite,
} from '@/types/shared';
import {
  createSharedTrip,
  getSharedTrip,
  getUserTrips,
  updateSharedTrip,
  deleteSharedTrip,
  getTripMembers,
  updateMemberRole,
  removeMemberFromTrip,
  leaveTrip,
  subscribeToTrip,
  subscribeToUserTrips,
} from '@/services/firestore/tripsService';
import {
  inviteUserToTrip,
  getTripInvitations,
  getMyPendingInvites,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
} from '@/services/firestore/invitesService';

interface SharedTripsState {
  // Estado
  trips: SharedTrip[];
  currentTrip: SharedTrip | null;
  members: TripMember[];
  invitations: TripInvitation[];
  pendingInvites: PendingInvite[];
  loading: boolean;
  error: string | null;

  // Unsubscribe functions
  _unsubscribeTrips: (() => void) | null;
  _unsubscribeCurrentTrip: (() => void) | null;

  // Acciones de viajes
  fetchTrips: () => Promise<void>;
  subscribeTrips: () => void;
  unsubscribeTrips: () => void;
  createTrip: (input: Parameters<typeof createSharedTrip>[0]) => Promise<SharedTrip | null>;
  selectTrip: (tripId: string) => Promise<void>;
  subscribeCurrentTrip: (tripId: string) => void;
  unsubscribeCurrentTrip: () => void;
  updateTrip: (tripId: string, updates: Parameters<typeof updateSharedTrip>[1]) => Promise<boolean>;
  deleteTrip: (tripId: string) => Promise<boolean>;
  clearCurrentTrip: () => void;

  // Acciones de miembros
  fetchMembers: (tripId: string) => Promise<void>;
  changeMemberRole: (tripId: string, memberUid: string, role: TripMember['role']) => Promise<boolean>;
  removeMember: (tripId: string, memberUid: string) => Promise<boolean>;
  leaveCurrentTrip: () => Promise<boolean>;

  // Acciones de invitaciones
  fetchInvitations: (tripId: string) => Promise<void>;
  inviteMember: (tripId: string, email: string, role?: TripMember['role']) => Promise<TripInvitation | null>;
  cancelInvite: (tripId: string, inviteId: string) => Promise<boolean>;

  // Invitaciones pendientes del usuario
  fetchPendingInvites: () => Promise<void>;
  acceptPendingInvite: (tripId: string, inviteId: string) => Promise<boolean>;
  rejectPendingInvite: (tripId: string, inviteId: string) => Promise<boolean>;

  // Reset
  reset: () => void;
}

export const useSharedTripsStore = create<SharedTripsState>((set, get) => ({
  // Estado inicial
  trips: [],
  currentTrip: null,
  members: [],
  invitations: [],
  pendingInvites: [],
  loading: false,
  error: null,
  _unsubscribeTrips: null,
  _unsubscribeCurrentTrip: null,

  // ============================================
  // ACCIONES DE VIAJES
  // ============================================

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const trips = await getUserTrips();
      set({ trips, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  subscribeTrips: () => {
    const { _unsubscribeTrips } = get();
    if (_unsubscribeTrips) return; // Ya suscrito

    const unsubscribe = subscribeToUserTrips(
      (trips) => set({ trips }),
      (error) => set({ error: error.message })
    );

    set({ _unsubscribeTrips: unsubscribe });
  },

  unsubscribeTrips: () => {
    const { _unsubscribeTrips } = get();
    if (_unsubscribeTrips) {
      _unsubscribeTrips();
      set({ _unsubscribeTrips: null });
    }
  },

  createTrip: async (input) => {
    set({ loading: true, error: null });
    try {
      const trip = await createSharedTrip(input);
      if (trip) {
        set((state) => ({
          trips: [trip, ...state.trips],
          loading: false,
        }));
      }
      return trip;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  selectTrip: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const trip = await getSharedTrip(tripId);
      const members = await getTripMembers(tripId);
      set({
        currentTrip: trip,
        members,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  subscribeCurrentTrip: (tripId) => {
    const { _unsubscribeCurrentTrip } = get();
    if (_unsubscribeCurrentTrip) {
      _unsubscribeCurrentTrip();
    }

    const unsubscribe = subscribeToTrip(
      tripId,
      async (trip) => {
        if (trip) {
          set({ currentTrip: trip, members: trip.members || [] });
        } else {
          set({ currentTrip: null, members: [] });
        }
      },
      (error) => set({ error: error.message })
    );

    set({ _unsubscribeCurrentTrip: unsubscribe });
  },

  unsubscribeCurrentTrip: () => {
    const { _unsubscribeCurrentTrip } = get();
    if (_unsubscribeCurrentTrip) {
      _unsubscribeCurrentTrip();
      set({ _unsubscribeCurrentTrip: null });
    }
  },

  updateTrip: async (tripId, updates) => {
    try {
      const updated = await updateSharedTrip(tripId, updates);
      if (updated) {
        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? updated : t)),
          currentTrip: state.currentTrip?.id === tripId ? updated : state.currentTrip,
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  deleteTrip: async (tripId) => {
    try {
      const success = await deleteSharedTrip(tripId);
      if (success) {
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== tripId),
          currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  clearCurrentTrip: () => {
    const { unsubscribeCurrentTrip } = get();
    unsubscribeCurrentTrip();
    set({ currentTrip: null, members: [], invitations: [] });
  },

  // ============================================
  // ACCIONES DE MIEMBROS
  // ============================================

  fetchMembers: async (tripId) => {
    try {
      const members = await getTripMembers(tripId);
      set({ members });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  changeMemberRole: async (tripId, memberUid, role) => {
    try {
      const success = await updateMemberRole(tripId, memberUid, role);
      if (success) {
        set((state) => ({
          members: state.members.map((m) =>
            m.uid === memberUid ? { ...m, role } : m
          ),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  removeMember: async (tripId, memberUid) => {
    try {
      const success = await removeMemberFromTrip(tripId, memberUid);
      if (success) {
        set((state) => ({
          members: state.members.filter((m) => m.uid !== memberUid),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  leaveCurrentTrip: async () => {
    const { currentTrip } = get();
    if (!currentTrip) return false;

    try {
      const success = await leaveTrip(currentTrip.id);
      if (success) {
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== currentTrip.id),
          currentTrip: null,
          members: [],
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // ============================================
  // ACCIONES DE INVITACIONES
  // ============================================

  fetchInvitations: async (tripId) => {
    try {
      const invitations = await getTripInvitations(tripId);
      set({ invitations });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  inviteMember: async (tripId, email, role = 'member') => {
    try {
      const invitation = await inviteUserToTrip(tripId, email, role);
      if (invitation) {
        set((state) => ({
          invitations: [...state.invitations, invitation],
        }));
      }
      return invitation;
    } catch (error: any) {
      set({ error: error.message });
      throw error; // Re-throw para manejar en UI
    }
  },

  cancelInvite: async (tripId, inviteId) => {
    try {
      const success = await cancelInvitation(tripId, inviteId);
      if (success) {
        set((state) => ({
          invitations: state.invitations.filter((i) => i.id !== inviteId),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // ============================================
  // INVITACIONES PENDIENTES DEL USUARIO
  // ============================================

  fetchPendingInvites: async () => {
    try {
      const pendingInvites = await getMyPendingInvites();
      set({ pendingInvites });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  acceptPendingInvite: async (tripId, inviteId) => {
    try {
      const success = await acceptInvitation(tripId, inviteId);
      if (success) {
        // Refrescar viajes y limpiar invitación
        await get().fetchTrips();
        set((state) => ({
          pendingInvites: state.pendingInvites.filter(
            (i) => !(i.tripId === tripId && i.inviteId === inviteId)
          ),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  rejectPendingInvite: async (tripId, inviteId) => {
    try {
      const success = await rejectInvitation(tripId, inviteId);
      if (success) {
        set((state) => ({
          pendingInvites: state.pendingInvites.filter(
            (i) => !(i.tripId === tripId && i.inviteId === inviteId)
          ),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // ============================================
  // RESET
  // ============================================

  reset: () => {
    const { unsubscribeTrips, unsubscribeCurrentTrip } = get();
    unsubscribeTrips();
    unsubscribeCurrentTrip();
    set({
      trips: [],
      currentTrip: null,
      members: [],
      invitations: [],
      pendingInvites: [],
      loading: false,
      error: null,
    });
  },
}));
