/**
 * USE REALTIME SYNC HOOK
 *
 * Hook que maneja la sincronización bidireccional en tiempo real para viajes compartidos.
 * Escucha cambios en Firestore y actualiza SQLite automáticamente.
 *
 * Uso:
 * const { syncing } = useRealtimeSync(firestoreId, viajeId, isShared);
 *
 * Este hook se encarga de:
 * - Suscribirse a listeners de reservas, lugares y gastos
 * - Actualizar SQLite cuando hay cambios en Firestore
 * - Limpiar suscripciones cuando se desmonta
 */

import { useEffect, useState, useRef } from 'react';
import { subscribeToReservations } from '@/services/sync/syncRealtimeReservations';
import { subscribeToPlaces } from '@/services/sync/syncRealtimePlaces';
import { subscribeToDocuments } from '@/services/sync/syncRealtimeDocuments';
import { subscribeToEvents } from '@/services/sync/syncRealtimeEvents';
import { subscribeToExpenses } from '@/services/firestore/expensesService';
import type { SharedExpense } from '@/types/shared';

// ============================================
// TIPOS
// ============================================

export interface RealtimeSyncOptions {
  /** Si es verdadero, habilita la sincronización */
  enabled?: boolean;
  /** Callback cuando se detectan cambios en reservas */
  onReservationsChange?: () => void;
  /** Callback cuando se detectan cambios en lugares */
  onPlacesChange?: () => void;
  /** Callback cuando se detectan cambios en documentos */
  onDocumentsChange?: () => void;
  /** Callback cuando se detectan cambios en eventos personalizados */
  onEventsChange?: () => void;
  /** Callback cuando se detectan cambios en gastos */
  onExpensesChange?: (expenses: SharedExpense[]) => void;
}

export interface RealtimeSyncState {
  /** Indica si hay sincronización activa */
  syncing: boolean;
  /** Número de listeners activos */
  activeListeners: number;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para sincronización en tiempo real de viajes compartidos
 *
 * @param firestoreId - ID del viaje en Firestore (null si no es compartido)
 * @param viajeId - ID del viaje en SQLite local
 * @param isShared - Si el viaje es compartido
 * @param options - Opciones de configuración
 * @returns Estado de la sincronización
 */
export function useRealtimeSync(
  firestoreId: string | null,
  viajeId: string,
  isShared: boolean,
  options: RealtimeSyncOptions = {}
): RealtimeSyncState {
  const [syncing, setSyncing] = useState(false);
  const [activeListeners, setActiveListeners] = useState(0);

  const {
    enabled = true,
    onReservationsChange,
    onPlacesChange,
    onDocumentsChange,
    onEventsChange,
    onExpensesChange,
  } = options;

  // Usar refs para los callbacks para evitar recrear listeners
  const callbacksRef = useRef({
    onReservationsChange,
    onPlacesChange,
    onDocumentsChange,
    onEventsChange,
    onExpensesChange,
  });

  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    callbacksRef.current = {
      onReservationsChange,
      onPlacesChange,
      onDocumentsChange,
      onEventsChange,
      onExpensesChange,
    };
  }, [onReservationsChange, onPlacesChange, onDocumentsChange, onEventsChange, onExpensesChange]);

  useEffect(() => {
    // Solo activar si el viaje es compartido, hay firestoreId y está enabled
    if (!isShared || !firestoreId || !enabled) {
      setSyncing(false);
      setActiveListeners(0);
      return;
    }

    console.log('[useRealtimeSync] Iniciando sincronización:', firestoreId);
    setSyncing(true);

    // Flag para prevenir race conditions durante cleanup
    let isCleanedUp = false;
    const unsubscribers: Array<() => void> = [];

    // Listener de reservas
    try {
      const unsubReservations = subscribeToReservations(
        firestoreId,
        viajeId,
        () => {
          // Usar el callback del ref (siempre la versión más reciente)
          callbacksRef.current.onReservationsChange?.();
        }
      );
      unsubscribers.push(unsubReservations);
      console.log('[useRealtimeSync] ✓ Listener de reservas activado');
    } catch (error) {
      console.error('[useRealtimeSync] Error en listener de reservas:', error);
    }

    // Listener de lugares
    try {
      const unsubPlaces = subscribeToPlaces(
        firestoreId,
        viajeId,
        () => {
          // Usar el callback del ref (siempre la versión más reciente)
          callbacksRef.current.onPlacesChange?.();
        }
      );
      unsubscribers.push(unsubPlaces);
      console.log('[useRealtimeSync] ✓ Listener de lugares activado');
    } catch (error) {
      console.error('[useRealtimeSync] Error en listener de lugares:', error);
    }

    // Listener de documentos
    try {
      const unsubDocuments = subscribeToDocuments(
        firestoreId,
        viajeId,
        () => {
          // Usar el callback del ref (siempre la versión más reciente)
          callbacksRef.current.onDocumentsChange?.();
        }
      );
      unsubscribers.push(unsubDocuments);
      console.log('[useRealtimeSync] ✓ Listener de documentos activado');
    } catch (error) {
      console.error('[useRealtimeSync] Error en listener de documentos:', error);
    }

    // Listener de eventos personalizados
    try {
      const unsubEvents = subscribeToEvents(
        firestoreId,
        viajeId,
        () => {
          // Usar el callback del ref (siempre la versión más reciente)
          callbacksRef.current.onEventsChange?.();
        }
      );
      unsubscribers.push(unsubEvents);
      console.log('[useRealtimeSync] ✓ Listener de eventos activado');
    } catch (error) {
      console.error('[useRealtimeSync] Error en listener de eventos:', error);
    }

    // Listener de gastos (ya existe en expensesService)
    if (callbacksRef.current.onExpensesChange) {
      try {
        const unsubExpenses = subscribeToExpenses(
          firestoreId,
          (expenses) => {
            // Usar el callback del ref (siempre la versión más reciente)
            callbacksRef.current.onExpensesChange?.(expenses);
          },
          (error) => {
            console.error('[useRealtimeSync] Error en listener de gastos:', error);
          }
        );
        unsubscribers.push(unsubExpenses);
        console.log('[useRealtimeSync] ✓ Listener de gastos activado');
      } catch (error) {
        console.error('[useRealtimeSync] Error en listener de gastos:', error);
      }
    }

    setActiveListeners(unsubscribers.length);

    // Cleanup: desuscribir todos los listeners
    return () => {
      if (isCleanedUp) {
        console.log('[useRealtimeSync] ⚠️ Cleanup ya ejecutado, ignorando...');
        return;
      }
      isCleanedUp = true;

      console.log('[useRealtimeSync] Limpiando suscripciones...');
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.error('[useRealtimeSync] Error al desuscribir:', error);
        }
      });
      setSyncing(false);
      setActiveListeners(0);
    };
  }, [firestoreId, viajeId, isShared, enabled]); // Removidas las dependencias de callbacks

  return {
    syncing,
    activeListeners,
  };
}

export default useRealtimeSync;
