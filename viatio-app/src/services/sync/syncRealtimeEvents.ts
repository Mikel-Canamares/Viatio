/**
 * SYNC REALTIME EVENTS SERVICE
 *
 * Servicio para sincronización bidireccional en tiempo real de eventos personalizados.
 * Escucha cambios en Firestore y actualiza SQLite local automáticamente.
 *
 * Características:
 * - Listener de Firestore con onSnapshot
 * - Inserción, actualización y eliminación automática en SQLite
 * - Mapeo de IDs (Firestore ↔ SQLite)
 * - Preserva relaciones con días y lugares
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db as firestoreDb } from '@/config/firebase';
import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { logError } from '@/utils/errorHandler';
import type { CategoriaEvento, PrioridadEvento } from '@/types/evento';

// ============================================
// TIPOS
// ============================================

interface FirestoreEvent {
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaEvento;
  horaInicio: string | null;
  horaFin: string | null;
  duracionMinutos: number | null;
  ubicacion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  completado: boolean;
  prioridad: PrioridadEvento;
  notas: string | null;
  localId: string;
  diaId: string | null;
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
 * Suscribirse a cambios en eventos de un viaje compartido
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param viajeId - ID del viaje en SQLite local
 * @param onUpdate - Callback llamado cuando hay cambios (opcional)
 * @returns Función para desuscribirse
 */
export function subscribeToEvents(
  firestoreId: string,
  viajeId: string,
  onUpdate?: () => void
): () => void {
  console.log('[Sync⬇️ Events] Iniciando subscripción:', firestoreId);

  const eventsRef = collection(firestoreDb, 'trips', firestoreId, 'events');
  const q = query(eventsRef, where('deletedAt', '==', null));

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const db = await getDatabase();

        // Mapeo de IDs para días y lugares
        const diasMap = await buildDiasMap(viajeId);
        const lugaresMap = await buildLugaresMap(viajeId);

        // En el primer snapshot, procesar TODOS los documentos existentes
        if (isFirstSnapshot) {
          console.log('[Sync⬇️ Events] Snapshot inicial, procesando todos los documentos:', snapshot.docs.length);

          for (const doc of snapshot.docs) {
            const eventData = doc.data() as FirestoreEvent;
            const firestoreEventId = doc.id;

            // Verificar si ya existe en SQLite
            const existing = await db.getFirstAsync<{ id: string }>(
              'SELECT id FROM eventos_personalizados WHERE firestoreId = ?',
              [firestoreEventId]
            );

            if (!existing) {
              // Insertar nuevo evento
              await createLocalEvent(eventData, viajeId, firestoreEventId, diasMap, lugaresMap);
              console.log('[Sync⬇️ Events] ✓ Evento creado (inicial):', eventData.nombre);
            } else {
              // Actualizar evento existente
              await updateLocalEvent(existing.id, eventData, viajeId, diasMap, lugaresMap);
              console.log('[Sync⬇️ Events] ✓ Evento actualizado (inicial):', eventData.nombre);
            }
          }

          isFirstSnapshot = false;
        } else {
          // En snapshots posteriores, solo procesar cambios
          console.log('[Sync⬇️ Events] Cambios detectados:', snapshot.docChanges().length);

          for (const change of snapshot.docChanges()) {
            const eventData = change.doc.data() as FirestoreEvent;
            const firestoreEventId = change.doc.id;

            if (change.type === 'added' || change.type === 'modified') {
              // Verificar si ya existe en SQLite
              const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM eventos_personalizados WHERE firestoreId = ?',
                [firestoreEventId]
              );

              if (!existing) {
                // Insertar nuevo evento
                await createLocalEvent(eventData, viajeId, firestoreEventId, diasMap, lugaresMap);
                console.log('[Sync⬇️ Events] ✓ Evento creado:', eventData.nombre);
              } else {
                // Actualizar evento existente
                await updateLocalEvent(existing.id, eventData, viajeId, diasMap, lugaresMap);
                console.log('[Sync⬇️ Events] ✓ Evento actualizado:', eventData.nombre);
              }
            } else if (change.type === 'removed') {
              // Eliminar de SQLite
              await db.runAsync(
                'DELETE FROM eventos_personalizados WHERE firestoreId = ?',
                [firestoreEventId]
              );
              console.log('[Sync⬇️ Events] ✓ Evento eliminado');
            }
          }
        }

        // Notificar cambios
        if (onUpdate) {
          onUpdate();
        }

        console.log('[Sync✅ Events] Sincronización completada');
      } catch (error) {
        logError(error, 'subscribeToEvents.onSnapshot');
      }
    },
    (error) => {
      console.error('[Sync❌ Events] Error en listener:', error);
      logError(error, 'subscribeToEvents');
    }
  );
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Construye un mapa de fecha -> diaId local para asignar correctamente los eventos
 */
async function buildDiasMap(viajeId: string): Promise<Map<string, string>> {
  try {
    const dias = await getDiasByViajeId(viajeId);
    const map = new Map<string, string>();

    // Mapear por fecha (ya que Firestore guarda la fecha del día)
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
 * Construye un mapa de firestoreId -> id local para lugares
 */
async function buildLugaresMap(viajeId: string): Promise<Map<string, string>> {
  try {
    const db = await getDatabase();
    const lugares = await db.getAllAsync<{ id: string; firestoreId: string }>(
      'SELECT id, firestoreId FROM lugares WHERE viajeId = ? AND firestoreId IS NOT NULL',
      [viajeId]
    );

    const map = new Map<string, string>();
    for (const lugar of lugares) {
      map.set(lugar.firestoreId, lugar.id);
    }

    return map;
  } catch (error) {
    logError(error, 'buildLugaresMap');
    return new Map();
  }
}

/**
 * Crea un evento en SQLite a partir de datos de Firestore
 */
async function createLocalEvent(
  eventData: FirestoreEvent,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>,
  lugaresMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Generar nuevo ID local (usamos el localId de Firestore si existe)
  const id = eventData.localId || generateId();

  // Mapear diaId y lugarId
  let diaId: string | null = null;
  if (eventData.diaId) {
    diaId = diasMap.get(eventData.diaId) || null;
    console.log('[Sync⬇️ Events] Mapeo de diaId:', {
      firestoreDiaId: eventData.diaId,
      localDiaId: diaId,
      diasMapSize: diasMap.size,
    });
  }

  let lugarId: string | null = null;
  if (eventData.lugarId) {
    lugarId = lugaresMap.get(eventData.lugarId) || null;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO eventos_personalizados (
      id, viajeId, diaId, nombre, descripcion, categoria,
      horaInicio, horaFin, duracionMinutos, ubicacion, direccion,
      latitud, longitud, lugarId, notas, completado, prioridad,
      firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      diaId,
      eventData.nombre,
      eventData.descripcion,
      eventData.categoria,
      eventData.horaInicio,
      eventData.horaFin,
      eventData.duracionMinutos,
      eventData.ubicacion,
      eventData.direccion,
      eventData.latitud,
      eventData.longitud,
      lugarId,
      eventData.notas,
      eventData.completado ? 1 : 0,
      eventData.prioridad || 'media',
      firestoreId,
      now,
      now,
    ]
  );
}

/**
 * Actualiza un evento existente en SQLite
 */
async function updateLocalEvent(
  localId: string,
  eventData: FirestoreEvent,
  viajeId: string,
  diasMap: Map<string, string>,
  lugaresMap: Map<string, string>
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Mapear diaId y lugarId
  let diaId: string | null = null;
  if (eventData.diaId) {
    diaId = diasMap.get(eventData.diaId) || null;
    console.log('[Sync⬇️ Events] Mapeo de diaId (update):', {
      firestoreDiaId: eventData.diaId,
      localDiaId: diaId,
      diasMapSize: diasMap.size,
      localId,
    });
  }

  let lugarId: string | null = null;
  if (eventData.lugarId) {
    lugarId = lugaresMap.get(eventData.lugarId) || null;
  }

  await db.runAsync(
    `UPDATE eventos_personalizados SET
      viajeId = ?,
      diaId = ?,
      nombre = ?,
      descripcion = ?,
      categoria = ?,
      horaInicio = ?,
      horaFin = ?,
      duracionMinutos = ?,
      ubicacion = ?,
      direccion = ?,
      latitud = ?,
      longitud = ?,
      lugarId = ?,
      notas = ?,
      completado = ?,
      prioridad = ?,
      updatedAt = ?
    WHERE id = ?`,
    [
      viajeId,
      diaId,
      eventData.nombre,
      eventData.descripcion,
      eventData.categoria,
      eventData.horaInicio,
      eventData.horaFin,
      eventData.duracionMinutos,
      eventData.ubicacion,
      eventData.direccion,
      eventData.latitud,
      eventData.longitud,
      lugarId,
      eventData.notas,
      eventData.completado ? 1 : 0,
      eventData.prioridad || 'media',
      now,
      localId,
    ]
  );
}
