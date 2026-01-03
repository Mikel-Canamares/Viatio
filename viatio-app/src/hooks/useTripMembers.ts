/**
 * USE TRIP MEMBERS HOOK
 *
 * Hook para gestionar miembros de un viaje compartido.
 * Proporciona acceso a la lista de miembros, invitaciones pendientes
 * y funciones para invitar/eliminar miembros.
 *
 * Uso:
 * const { members, invitations, invite, remove, canInvite } = useTripMembers(firestoreId);
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useAuth } from '@/context/AuthContext';
import type { TripMember, TripInvitation, TripRole, hasPermission } from '@/types/shared';

// ============================================
// TIPOS
// ============================================

export interface TripMembersData {
  /** Lista de miembros activos */
  members: TripMember[];
  /** Invitaciones pendientes */
  invitations: TripInvitation[];
  /** Usuario actual como miembro */
  currentMember: TripMember | null;
  /** Rol del usuario actual */
  currentRole: TripRole | null;
  /** ¿Puede invitar miembros? */
  canInvite: boolean;
  /** ¿Puede gestionar miembros (cambiar roles, eliminar)? */
  canManageMembers: boolean;
  /** Estado de carga */
  loading: boolean;
  /** Invitar a un nuevo miembro */
  invite: (email: string, role?: TripRole) => Promise<boolean>;
  /** Cancelar invitación */
  cancelInvite: (inviteId: string) => Promise<boolean>;
  /** Cambiar rol de un miembro */
  changeRole: (uid: string, newRole: TripRole) => Promise<boolean>;
  /** Eliminar miembro */
  removeMember: (uid: string) => Promise<boolean>;
  /** Refrescar datos */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useTripMembers(firestoreId: string | null): TripMembersData {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    currentTrip,
    members,
    invitations,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    cancelInvite: cancelInviteStore,
    changeMemberRole,
    removeMember: removeMemberStore,
  } = useSharedTripsStore();

  // Cargar datos al montar o cuando cambie el firestoreId
  useEffect(() => {
    if (!firestoreId) return;

    setLoading(true);
    Promise.all([
      fetchMembers(firestoreId),
      fetchInvitations(firestoreId),
    ]).finally(() => setLoading(false));
  }, [firestoreId, fetchMembers, fetchInvitations]);

  // Encontrar miembro actual
  const currentMember = useMemo(() => {
    if (!user?.uid) return null;
    return members.find(m => m.uid === user.uid) || null;
  }, [members, user?.uid]);

  // Rol actual
  const currentRole = currentMember?.role || currentTrip?.currentUserRole || null;

  // Permisos
  const canInvite = useMemo(() => {
    if (!currentRole) return false;
    return ['owner', 'admin'].includes(currentRole);
  }, [currentRole]);

  const canManageMembers = useMemo(() => {
    if (!currentRole) return false;
    return ['owner', 'admin'].includes(currentRole);
  }, [currentRole]);

  // Función para invitar
  const invite = useCallback(async (email: string, role: TripRole = 'member'): Promise<boolean> => {
    if (!firestoreId) return false;
    try {
      const result = await inviteMember(firestoreId, email, role);
      return !!result;
    } catch (error) {
      console.error('[useTripMembers] Error inviting:', error);
      return false;
    }
  }, [firestoreId, inviteMember]);

  // Cancelar invitación
  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!firestoreId) return false;
    try {
      await cancelInviteStore(firestoreId, inviteId);
      return true;
    } catch (error) {
      console.error('[useTripMembers] Error canceling invite:', error);
      return false;
    }
  }, [firestoreId, cancelInviteStore]);

  // Cambiar rol
  const changeRole = useCallback(async (uid: string, newRole: TripRole): Promise<boolean> => {
    if (!firestoreId) return false;
    try {
      return await changeMemberRole(firestoreId, uid, newRole);
    } catch (error) {
      console.error('[useTripMembers] Error changing role:', error);
      return false;
    }
  }, [firestoreId, changeMemberRole]);

  // Eliminar miembro
  const removeMember = useCallback(async (uid: string): Promise<boolean> => {
    if (!firestoreId) return false;
    try {
      return await removeMemberStore(firestoreId, uid);
    } catch (error) {
      console.error('[useTripMembers] Error removing member:', error);
      return false;
    }
  }, [firestoreId, removeMemberStore]);

  // Refrescar
  const refresh = useCallback(async () => {
    if (!firestoreId) return;
    setLoading(true);
    await Promise.all([
      fetchMembers(firestoreId),
      fetchInvitations(firestoreId),
    ]);
    setLoading(false);
  }, [firestoreId, fetchMembers, fetchInvitations]);

  return {
    members,
    invitations,
    currentMember,
    currentRole,
    canInvite,
    canManageMembers,
    loading,
    invite,
    cancelInvite,
    changeRole,
    removeMember,
    refresh,
  };
}

export default useTripMembers;
