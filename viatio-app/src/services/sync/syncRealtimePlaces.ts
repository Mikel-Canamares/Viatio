/**
 * SYNC REALTIME PLACES SERVICE
 *
 * Servicio para sincronización bidireccional en tiempo real de lugares.
 * Escucha cambios en Firestore y actualiza SQLite local automáticamente.
 *
 * Características:
 * - Listener de Firestore con onSnapshot
 * - Inserción, actualización y eliminación automática en SQLite
 * - Mapeo de IDs (Firestore ↔ SQLite)
 * - Preserva orden y estado de visitado
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db as firestoreDb } from '@/config/firebase';
import { getDatabase, getCurrentTimestamp } from '@/database';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { logError } from '@/utils/errorHandler';
import { updateReservationPlaceReferences } from './syncRealtimeReservations';

// ============================================
// TIPOS
// ============================================

interface FirestorePlace {
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  googlePlaceId: string | null;
  orden: number;
  visitado: boolean;
  localId: string;
  diaId: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt: Timestamp | null;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Suscribirse a cambios en lugares de un viaje compartido
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param viajeId - ID del viaje en SQLite local
 * @param onUpdate - Callback llamado cuando hay cambios (opcional)
 * @returns Función para desuscribirse
 */
export function subscribeToPlaces(
  firestoreId: string,
  viajeId: string,
  onUpdate?: () => void
): () => void {
  console.log('[Sync⬇️ Places] Iniciando subscripción:', firestoreId);

  const placesRef = collection(firestoreDb, 'trips', firestoreId, 'places');
  const q = query(placesRef, where('deletedAt', '==', null));

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const db = await getDatabase();

        // Mapeo de fechas a diaId
        const diasMap = await buildDiasMap(viajeId);

        // En el primer snapshot, procesar TODOS los documentos existentes
        if (isFirstSnapshot) {
          console.log('[Sync⬇️ Places] Snapshot inicial, procesando todos los documentos:', snapshot.docs.length);

          for (const doc of snapshot.docs) {
            const placeData = doc.data() as FirestorePlace;
            const firestorePlaceId = doc.id;

            // Verificar si ya existe en SQLite
            const existing = await db.getFirstAsync<{ id: string }>(
              'SELECT id FROM lugares WHERE firestoreId = ?',
              [firestorePlaceId]
            );

            let localPlaceId: string;

            if (!existing) {
              // Insertar nuevo lugar
              await createLocalPlace(placeData, viajeId, firestorePlaceId, diasMap);
              localPlaceId = placeData.localId || firestorePlaceId;
              console.log('[Sync⬇️ Places] ✓ Lugar creado (inicial):', placeData.nombre);
            } else {
              // Actualizar lugar existente
              await updateLocalPlace(existing.id, placeData, viajeId, diasMap);
              localPlaceId = existing.id;
              console.log('[Sync⬇️ Places] ✓ Lugar actualizado (inicial):', placeData.nombre);
            }

            // Después de crear/actualizar el lugar, actualizar las reservas que lo referencian
            await updateReservationPlaceReferences(viajeId, firestorePlaceId, localPlaceId);
          }

          isFirstSnapshot = false;
        } else {
          // En snapshots posteriores, solo procesar cambios
          console.log('[Sync⬇️ Places] Cambios detectados:', snapshot.docChanges().length);

          for (const change of snapshot.docChanges()) {
            const placeData = change.doc.data() as FirestorePlace;
            const firestorePlaceId = change.doc.id;

            if (change.type === 'added' || change.type === 'modified') {
              // Verificar si ya existe en SQLite
              const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM lugares WHERE firestoreId = ?',
                [firestorePlaceId]
              );

              let localPlaceId: string;

              if (!existing) {
                // Insertar nuevo lugar
                await createLocalPlace(placeData, viajeId, firestorePlaceId, diasMap);
                localPlaceId = placeData.localId || firestorePlaceId;
                console.log('[Sync⬇️ Places] ✓ Lugar creado:', placeData.nombre);
              } else {
                // Actualizar lugar existente
                await updateLocalPlace(existing.id, placeData, viajeId, diasMap);
                localPlaceId = existing.id;
                console.log('[Sync⬇️ Places] ✓ Lugar actualizado:', placeData.nombre);
              }

              // Después de crear/actualizar el lugar, actualizar las reservas que lo referencian
              await updateReservationPlaceReferences(viajeId, firestorePlaceId, localPlaceId);
            } else if (change.type === 'removed') {
              // Eliminar de SQLite
              await db.runAsync(
                'DELETE FROM lugares WHERE firestoreId = ?',
                [firestorePlaceId]
              );
              console.log('[Sync⬇️ Places] ✓ Lugar eliminado');
            }
          }
        }

        // Notificar cambios
        if (onUpdate) {
          onUpdate();
        }

        console.log('[Sync✅ Places] Sincronización completada');
      } catch (error) {
        logError(error, 'subscribeToPlaces.onSnapshot');
      }
    },
    (error) => {
      console.error('[Sync❌ Places] Error en listener:', error);
      logError(error, 'subscribeToPlaces');
    }
  );
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Construye un mapa de fecha -> diaId para asignar correctamente los lugares
 */
async function buildDiasMap(viajeId: string): Promise<Map<string, string>> {
  try {
    const dias = await getDiasByViajeId(viajeId);
    const map = new Map<string, string>();

    for (const dia of dias) {
      map.set(dia.fecha, dia.id);
    }

    return map;
  } catch (error) {
    logError(error, 'buildDiasMap');
    return new Map();
  }
}

/**
 * Crea un lugar en SQLite a partir de datos de Firestore
 */
async function createLocalPlace(
  placeData: FirestorePlace,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Generar nuevo ID local (usamos el localId de Firestore si existe)
  const id = placeData.localId || firestoreId;

  // Determinar el diaId basado en diaId de Firestore
  let diaId: string | null = null;
  if (placeData.diaId) {
    // El diaId en Firestore puede ser una fecha o un ID
    diaId = diasMap.get(placeData.diaId) || null;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO lugares (
      id, viajeId, diaId, nombre, descripcion, categoria, direccion,
      latitud, longitud, googlePlaceId, orden, visitado, firestoreId,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      diaId,
      placeData.nombre,
      placeData.descripcion,
      placeData.categoria,
      placeData.direccion,
      placeData.latitud,
      placeData.longitud,
      placeData.googlePlaceId,
      placeData.orden || 0,
      placeData.visitado ? 1 : 0,
      firestoreId,
      now,
      now,
    ]
  );
}

/**
 * Actualiza un lugar existente en SQLite
 */
async function updateLocalPlace(
  localId: string,
  placeData: FirestorePlace,
  viajeId: string,
  diasMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Determinar el diaId
  let diaId: string | null = null;
  if (placeData.diaId) {
    diaId = diasMap.get(placeData.diaId) || null;
  }

  await db.runAsync(
    `UPDATE lugares SET
      viajeId = ?,
      diaId = ?,
      nombre = ?,
      descripcion = ?,
      categoria = ?,
      direccion = ?,
      latitud = ?,
      longitud = ?,
      googlePlaceId = ?,
      orden = ?,
      visitado = ?,
      updatedAt = ?
    WHERE id = ?`,
    [
      viajeId,
      diaId,
      placeData.nombre,
      placeData.descripcion,
      placeData.categoria,
      placeData.direccion,
      placeData.latitud,
      placeData.longitud,
      placeData.googlePlaceId,
      placeData.orden || 0,
      placeData.visitado ? 1 : 0,
      now,
      localId,
    ]
  );
}
