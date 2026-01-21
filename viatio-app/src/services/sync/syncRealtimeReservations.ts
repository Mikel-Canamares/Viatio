/**
 * SYNC REALTIME RESERVATIONS SERVICE
 *
 * Servicio para sincronización bidireccional en tiempo real de reservas.
 * Escucha cambios en Firestore y actualiza SQLite local automáticamente.
 *
 * Características:
 * - Listener de Firestore con onSnapshot
 * - Inserción, actualización y eliminación automática en SQLite
 * - Mapeo de IDs (Firestore ↔ SQLite)
 * - Manejo de lugares asociados
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import * as SQLite from 'expo-sqlite';
import { db as firestoreDb } from '@/config/firebase';
import { getDatabase, getCurrentTimestamp } from '@/database';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { logError } from '@/utils/errorHandler';

// ============================================
// TIPOS
// ============================================

interface FirestoreReservation {
  categoria: string;
  nombre: string;
  proveedor: string | null;
  numeroConfirmacion: string | null;
  fechaInicio: string | null;
  horaInicio: string | null;
  fechaFin: string | null;
  horaFin: string | null;
  ubicacion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  precio: number | null;
  moneda: string;
  estadoPago: string;
  notas: string | null;
  metadatos: string | null;
  localId: string;
  lugarId: string | null;
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
 * Suscribirse a cambios en reservas de un viaje compartido
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param viajeId - ID del viaje en SQLite local
 * @param onUpdate - Callback llamado cuando hay cambios (opcional)
 * @returns Función para desuscribirse
 */
export function subscribeToReservations(
  firestoreId: string,
  viajeId: string,
  onUpdate?: () => void
): () => void {
  console.log('[Sync⬇️ Reservations] Iniciando subscripción:', firestoreId);

  const reservationsRef = collection(firestoreDb, 'trips', firestoreId, 'reservations');
  const q = query(reservationsRef, where('deletedAt', '==', null));

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const db = await getDatabase();

        // Mapeo de fechas a diaId
        const diasMap = await buildDiasMap(viajeId);

        // Mapeo de lugarId (Firestore → SQLite)
        const placeIdMap = await buildPlaceIdMap(viajeId);

        // En el primer snapshot, procesar TODOS los documentos existentes
        if (isFirstSnapshot) {
          console.log('[Sync⬇️ Reservations] Snapshot inicial, procesando todos los documentos:', snapshot.docs.length);

          for (const doc of snapshot.docs) {
            const resData = doc.data() as FirestoreReservation;
            const firestoreReservationId = doc.id;

            // Sincronizar con verificación doble (localId primero, luego firestoreId)
            await syncReserva(db, resData, viajeId, firestoreReservationId, diasMap, placeIdMap, '(inicial)');
          }

          isFirstSnapshot = false;
        } else {
          // En snapshots posteriores, solo procesar cambios
          console.log('[Sync⬇️ Reservations] Cambios detectados:', snapshot.docChanges().length);

          for (const change of snapshot.docChanges()) {
            const resData = change.doc.data() as FirestoreReservation;
            const firestoreReservationId = change.doc.id;

            if (change.type === 'added' || change.type === 'modified') {
              // Sincronizar con verificación doble (localId primero, luego firestoreId)
              await syncReserva(db, resData, viajeId, firestoreReservationId, diasMap, placeIdMap);
            } else if (change.type === 'removed') {
              // Eliminar de SQLite
              await db.runAsync(
                'DELETE FROM reservas WHERE firestoreId = ?',
                [firestoreReservationId]
              );
              console.log('[Sync⬇️ Reservations] ✓ Reserva eliminada');
            }
          }
        }

        // Notificar cambios
        if (onUpdate) {
          onUpdate();
        }

        console.log('[Sync✅ Reservations] Sincronización completada');
      } catch (error) {
        logError(error, 'subscribeToReservations.onSnapshot');
      }
    },
    (error) => {
      console.error('[Sync❌ Reservations] Error en listener:', error);
      logError(error, 'subscribeToReservations');
    }
  );
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Sincroniza una reserva de Firestore a SQLite con verificación doble
 * para evitar duplicados
 */
async function syncReserva(
  db: SQLite.SQLiteDatabase,
  resData: FirestoreReservation,
  viajeId: string,
  firestoreReservationId: string,
  diasMap: Map<string, string>,
  placeIdMap: Map<string, string>,
  logSuffix: string = ''
): Promise<void> {
  const localId = resData.localId || firestoreReservationId;
  const now = getCurrentTimestamp();

  // PASO 1: Verificar si ya existe un registro con este ID local
  const existingByLocalId = await db.getFirstAsync<{ id: string; firestoreId: string | null }>(
    'SELECT id, firestoreId FROM reservas WHERE id = ?',
    [localId]
  );

  if (existingByLocalId) {
    // Ya existe con este ID local
    console.log(`[Sync⬇️ Reservations] Registro encontrado por localId: ${localId}, firestoreId actual: ${existingByLocalId.firestoreId}`);

    if (!existingByLocalId.firestoreId) {
      // Es un registro local sin firestoreId, vincularlo con Firestore
      await db.runAsync(
        'UPDATE reservas SET firestoreId = ?, updatedAt = ? WHERE id = ?',
        [firestoreReservationId, now, localId]
      );
      console.log(`[Sync⬇️ Reservations] ✓ Registro vinculado con Firestore: ${resData.nombre}`);
    }

    // Actualizar el resto de campos
    await updateLocalReserva(localId, resData, viajeId, diasMap, placeIdMap);
    console.log(`[Sync⬇️ Reservations] ✓ Reserva actualizada ${logSuffix}:`, resData.nombre);
  } else {
    // PASO 2: No existe por localId, verificar por firestoreId
    const existingByFirestoreId = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM reservas WHERE firestoreId = ?',
      [firestoreReservationId]
    );

    if (existingByFirestoreId) {
      // Existe con este firestoreId pero con otro ID local (creado por otro usuario)
      await updateLocalReserva(existingByFirestoreId.id, resData, viajeId, diasMap, placeIdMap);
      console.log(`[Sync⬇️ Reservations] ✓ Reserva actualizada ${logSuffix}:`, resData.nombre);
    } else {
      // PASO 3: No existe de ninguna manera, crear nueva
      await createLocalReserva(resData, viajeId, firestoreReservationId, diasMap, placeIdMap);
      console.log(`[Sync⬇️ Reservations] ✓ Reserva creada ${logSuffix}:`, resData.nombre);
    }
  }
}

/**
 * Construye un mapa de fecha -> diaId para asignar correctamente las reservas
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
 * Construye un mapa de lugarId (Firestore) -> lugarId (SQLite)
 */
async function buildPlaceIdMap(viajeId: string): Promise<Map<string, string>> {
  try {
    const db = await getDatabase();
    const lugares = await db.getAllAsync<{ id: string; firestoreId: string | null }>(
      'SELECT id, firestoreId FROM lugares WHERE viajeId = ?',
      [viajeId]
    );

    const map = new Map<string, string>();

    for (const lugar of lugares) {
      if (lugar.firestoreId) {
        map.set(lugar.firestoreId, lugar.id);
      }
    }

    return map;
  } catch (error) {
    logError(error, 'buildPlaceIdMap');
    return new Map();
  }
}

/**
 * Crea una reserva en SQLite a partir de datos de Firestore
 */
async function createLocalReserva(
  resData: FirestoreReservation,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>,
  placeIdMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Generar nuevo ID local (usamos el localId de Firestore si existe)
  const id = resData.localId || firestoreId;

  // Determinar el diaId basado en fechaInicio
  let diaId: string | null = null;
  if (resData.fechaInicio) {
    diaId = diasMap.get(resData.fechaInicio) || null;
  }

  // Mapear lugarId al nuevo ID local
  let lugarId: string | null = null;
  if (resData.lugarId) {
    lugarId = placeIdMap.get(resData.lugarId) || null;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO reservas (
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, notas, metadatos,
      lugarId, firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      diaId,
      resData.categoria,
      resData.nombre,
      resData.proveedor,
      resData.numeroConfirmacion,
      resData.fechaInicio,
      resData.horaInicio,
      resData.fechaFin,
      resData.horaFin,
      resData.ubicacion,
      resData.direccion,
      resData.latitud,
      resData.longitud,
      resData.precio,
      resData.moneda || 'EUR',
      resData.estadoPago || 'pending',
      resData.notas,
      resData.metadatos,
      lugarId,
      firestoreId,
      now,
      now,
    ]
  );
}

/**
 * Actualiza una reserva existente en SQLite
 */
async function updateLocalReserva(
  localId: string,
  resData: FirestoreReservation,
  viajeId: string,
  diasMap: Map<string, string>,
  placeIdMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Determinar el diaId basado en fechaInicio
  let diaId: string | null = null;
  if (resData.fechaInicio) {
    diaId = diasMap.get(resData.fechaInicio) || null;
  }

  // Mapear lugarId al nuevo ID local
  let lugarId: string | null = null;
  if (resData.lugarId) {
    lugarId = placeIdMap.get(resData.lugarId) || null;

    // Si no encontramos el lugar en el mapa, pero Firestore dice que existe,
    // guardar temporalmente el firestoreId del lugar para actualizarlo después
    if (!lugarId) {
      console.warn(`[Sync⚠️ Reservations] Lugar ${resData.lugarId} no encontrado en mapa local, se buscará después de sincronizar lugares`);
      // Buscar si ya existe el lugar con ese firestoreId
      const lugarFromDb = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM lugares WHERE firestoreId = ? AND viajeId = ?',
        [resData.lugarId, viajeId]
      );
      lugarId = lugarFromDb?.id || null;
    }
  }

  await db.runAsync(
    `UPDATE reservas SET
      viajeId = ?,
      diaId = ?,
      categoria = ?,
      nombre = ?,
      proveedor = ?,
      numeroConfirmacion = ?,
      fechaInicio = ?,
      horaInicio = ?,
      fechaFin = ?,
      horaFin = ?,
      ubicacion = ?,
      direccion = ?,
      latitud = ?,
      longitud = ?,
      precio = ?,
      moneda = ?,
      estadoPago = ?,
      notas = ?,
      metadatos = ?,
      lugarId = ?,
      updatedAt = ?
    WHERE id = ?`,
    [
      viajeId,
      diaId,
      resData.categoria,
      resData.nombre,
      resData.proveedor,
      resData.numeroConfirmacion,
      resData.fechaInicio,
      resData.horaInicio,
      resData.fechaFin,
      resData.horaFin,
      resData.ubicacion,
      resData.direccion,
      resData.latitud,
      resData.longitud,
      resData.precio,
      resData.moneda || 'EUR',
      resData.estadoPago || 'pending',
      resData.notas,
      resData.metadatos,
      lugarId,
      now,
      localId,
    ]
  );
}

/**
 * Actualiza las referencias de lugares en reservas cuando se sincroniza un nuevo lugar
 * Esta función se llama desde el listener de lugares para arreglar referencias pendientes
 */
export async function updateReservationPlaceReferences(
  viajeId: string,
  firestorePlaceId: string,
  localPlaceId: string
): Promise<void> {
  try {
    const db = await getDatabase();

    // Buscar reservas que tengan este lugar en Firestore pero aún no tengan el lugarId local
    // Esto puede pasar cuando las reservas llegan antes que los lugares
    const reservationsNeedingUpdate = await db.getAllAsync<{
      id: string;
      firestoreId: string | null;
    }>(
      `SELECT r.id, r.firestoreId
       FROM reservas r
       WHERE r.viajeId = ?
       AND r.lugarId IS NULL
       AND r.firestoreId IS NOT NULL`,
      [viajeId]
    );

    if (reservationsNeedingUpdate.length === 0) {
      return;
    }

    console.log(`[Sync🔄 Reservations] Verificando ${reservationsNeedingUpdate.length} reservas para actualizar referencias de lugares`);

    // Para cada reserva sin lugarId local, verificar si en Firestore tiene este lugar
    const { db: firestoreDb } = require('@/config/firebase');
    const { doc, getDoc } = require('firebase/firestore');

    // Obtener el viaje para saber su firestoreId
    const viaje = await db.getFirstAsync<{ firestoreId: string | null }>(
      'SELECT firestoreId FROM viajes WHERE id = ?',
      [viajeId]
    );

    if (!viaje?.firestoreId) {
      return;
    }

    let updatedCount = 0;

    for (const reservation of reservationsNeedingUpdate) {
      if (!reservation.firestoreId) continue;

      try {
        // Verificar en Firestore si esta reserva tiene el lugar que acabamos de sincronizar
        const reservationDoc = await getDoc(
          doc(firestoreDb, 'trips', viaje.firestoreId, 'reservations', reservation.firestoreId)
        );

        const reservationData = reservationDoc.data();
        if (reservationData?.lugarId === firestorePlaceId) {
          // Actualizar la reserva local con el lugarId correcto
          await db.runAsync(
            'UPDATE reservas SET lugarId = ?, updatedAt = ? WHERE id = ?',
            [localPlaceId, getCurrentTimestamp(), reservation.id]
          );
          updatedCount++;
          console.log(`[Sync✅ Reservations] Actualizada referencia de lugar en reserva ${reservation.id}`);
        }
      } catch (error) {
        console.error(`[Sync❌ Reservations] Error actualizando reserva ${reservation.id}:`, error);
      }
    }

    if (updatedCount > 0) {
      console.log(`[Sync✅ Reservations] ${updatedCount} reserva(s) actualizada(s) con referencias de lugar`);
    }
  } catch (error) {
    logError(error, 'updateReservationPlaceReferences');
  }
}
