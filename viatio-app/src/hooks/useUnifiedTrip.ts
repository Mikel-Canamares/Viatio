/**
 * USE UNIFIED TRIP HOOK
 *
 * Hook que unifica el acceso a datos de viajes, tanto locales (SQLite)
 * como compartidos (Firestore). Detecta automáticamente el tipo de viaje
 * y carga los datos de la fuente correcta.
 *
 * Uso:
 * const { viaje, members, isShared, loading, refresh } = useUnifiedTrip(viajeId);
 */

import { useState, useEffect, useCallback } from 'react';
import { getViajeById } from '@/services/viajesService';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import type { Viaje } from '@/types/viaje';
import type { TripMember, SharedTrip } from '@/types/shared';

// ============================================
// TIPOS
// ============================================

export interface UnifiedTripData {
  /** Viaje local (SQLite) */
  viaje: Viaje | null;
  /** Viaje compartido (Firestore) - solo si isShared */
  sharedTrip: SharedTrip | null;
  /** Miembros del viaje (solo si compartido) */
  members: TripMember[];
  /** ¿Es un viaje compartido? */
  isShared: boolean;
  /** ID de Firestore (si compartido) */
  firestoreId: string | null;
  /** Estado de carga */
  loading: boolean;
  /** Error si lo hay */
  error: Error | null;
  /** Función para refrescar datos */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useUnifiedTrip(viajeId: string): UnifiedTripData {
  // Estado local
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Store de viajes compartidos
  const {
    currentTrip: sharedTrip,
    members,
    subscribeCurrentTrip,
    fetchMembers,
  } = useSharedTripsStore();

  // Derivar si es compartido
  const isShared = viaje?.isShared === 1;
  const firestoreId = viaje?.firestoreId || null;

  // Cargar viaje local
  const loadViaje = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const viajeData = await getViajeById(viajeId);
      setViaje(viajeData);
    } catch (err) {
      console.error('[useUnifiedTrip] Error loading viaje:', err);
      setError(err instanceof Error ? err : new Error('Error cargando viaje'));
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  // Cargar viaje al montar
  useEffect(() => {
    loadViaje();
  }, [loadViaje]);

  // Si es compartido, suscribirse a Firestore
  useEffect(() => {
    if (!isShared || !firestoreId) return;

    // Suscribirse al viaje compartido
    const unsubscribe = subscribeCurrentTrip(firestoreId);

    // Cargar miembros
    fetchMembers(firestoreId);

    return unsubscribe;
  }, [isShared, firestoreId, subscribeCurrentTrip, fetchMembers]);

  // Función para refrescar
  const refresh = useCallback(async () => {
    await loadViaje();
    if (isShared && firestoreId) {
      await fetchMembers(firestoreId);
    }
  }, [loadViaje, isShared, firestoreId, fetchMembers]);

  return {
    viaje,
    sharedTrip: isShared ? sharedTrip : null,
    members: isShared ? members : [],
    isShared,
    firestoreId,
    loading,
    error,
    refresh,
  };
}

export default useUnifiedTrip;
