/**
 * SYNC REALTIME CHECKLIST SERVICE
 *
 * Servicio para sincronización bidireccional en tiempo real de items de checklist grupales.
 * Escucha cambios en Firestore y actualiza SQLite local automáticamente.
 *
 * Características:
 * - Listener de Firestore con onSnapshot
 * - Solo sincroniza items grupales (seccion = 'grupal')
 * - Inserción, actualización y eliminación automática en SQLite
 * - Mapeo de IDs (Firestore ↔ SQLite)
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import * as SQLite from 'expo-sqlite';
import { db as firestoreDb, auth } from '@/config/firebase';
import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { logError } from '@/utils/errorHandler';

// ============================================
// TIPOS
// ============================================

interface FirestoreChecklistItem {
  texto: string;
  completado: boolean;
  orden: number;
  localId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Suscribirse a cambios en items de checklist grupales de un viaje compartido
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param viajeId - ID del viaje en SQLite local
 * @param onUpdate - Callback llamado cuando hay cambios (opcional)
 * @returns Función para desuscribirse
 */
export function subscribeToChecklist(
  firestoreId: string,
  viajeId: string,
  onUpdate?: () => void
): () => void {
  console.log('[Sync⬇️ Checklist] Iniciando subscripción:', firestoreId);

  const checklistRef = collection(firestoreDb, 'trips', firestoreId, 'checklist');
  const q = query(checklistRef, where('deletedAt', '==', null));

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const db = await getDatabase();
        const user = auth.currentUser;
        if (!user) {
          console.warn('[Sync⬇️ Checklist] Usuario no autenticado, omitiendo sync');
          return;
        }

        // En el primer snapshot, procesar TODOS los documentos existentes
        if (isFirstSnapshot) {
          console.log('[Sync⬇️ Checklist] Snapshot inicial, procesando todos los documentos:', snapshot.docs.length);

          for (const doc of snapshot.docs) {
            const itemData = doc.data() as FirestoreChecklistItem;
            const firestoreItemId = doc.id;

            await syncChecklistItem(db, itemData, viajeId, firestoreItemId, user.uid, '(inicial)');
          }

          isFirstSnapshot = false;
        } else {
          // En snapshots posteriores, solo procesar cambios
          console.log('[Sync⬇️ Checklist] Cambios detectados:', snapshot.docChanges().length);

          for (const change of snapshot.docChanges()) {
            const itemData = change.doc.data() as FirestoreChecklistItem;
            const firestoreItemId = change.doc.id;

            if (change.type === 'added' || change.type === 'modified') {
              await syncChecklistItem(db, itemData, viajeId, firestoreItemId, user.uid);
            } else if (change.type === 'removed') {
              // Eliminar de SQLite
              await db.runAsync(
                'DELETE FROM checklist_items WHERE firestoreId = ?',
                [firestoreItemId]
              );
              console.log('[Sync⬇️ Checklist] ✓ Item eliminado');
            }
          }
        }

        // Notificar cambios
        if (onUpdate) {
          onUpdate();
        }

        console.log('[Sync✅ Checklist] Sincronización completada');
      } catch (error) {
        logError(error, 'subscribeToChecklist.onSnapshot');
      }
    },
    (error) => {
      console.error('[Sync❌ Checklist] Error en listener:', error);
      logError(error, 'subscribeToChecklist');
    }
  );
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Sincroniza un item de checklist de Firestore a SQLite con verificación doble
 * para evitar duplicados
 */
async function syncChecklistItem(
  db: SQLite.SQLiteDatabase,
  itemData: FirestoreChecklistItem,
  viajeId: string,
  firestoreItemId: string,
  usuarioId: string,
  logSuffix: string = ''
): Promise<void> {
  const localId = itemData.localId || generateId();
  const now = getCurrentTimestamp();

  // PASO 1: Verificar si ya existe un registro con este ID local
  const existingByLocalId = await db.getFirstAsync<{ id: string; firestoreId: string | null }>(
    'SELECT id, firestoreId FROM checklist_items WHERE id = ?',
    [localId]
  );

  if (existingByLocalId) {
    // Ya existe con este ID local
    console.log(`[Sync⬇️ Checklist] Registro encontrado por localId: ${localId}, firestoreId actual: ${existingByLocalId.firestoreId}`);

    if (!existingByLocalId.firestoreId) {
      // Es un registro local sin firestoreId, vincularlo con Firestore
      await db.runAsync(
        'UPDATE checklist_items SET firestoreId = ?, updatedAt = ? WHERE id = ?',
        [firestoreItemId, now, localId]
      );
      console.log(`[Sync⬇️ Checklist] ✓ Registro vinculado con Firestore: ${itemData.texto}`);
    }

    // Actualizar el resto de campos
    await updateLocalChecklistItem(localId, itemData);
    console.log(`[Sync⬇️ Checklist] ✓ Item actualizado ${logSuffix}:`, itemData.texto);
  } else {
    // PASO 2: No existe por localId, verificar por firestoreId
    const existingByFirestoreId = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM checklist_items WHERE firestoreId = ?',
      [firestoreItemId]
    );

    if (existingByFirestoreId) {
      // Existe con este firestoreId pero con otro ID local (creado por otro usuario)
      await updateLocalChecklistItem(existingByFirestoreId.id, itemData);
      console.log(`[Sync⬇️ Checklist] ✓ Item actualizado ${logSuffix}:`, itemData.texto);
    } else {
      // PASO 3: No existe de ninguna manera, crear nuevo
      await createLocalChecklistItem(itemData, viajeId, firestoreItemId, usuarioId);
      console.log(`[Sync⬇️ Checklist] ✓ Item creado ${logSuffix}:`, itemData.texto);
    }
  }
}

/**
 * Crea un item de checklist en SQLite a partir de datos de Firestore
 */
async function createLocalChecklistItem(
  itemData: FirestoreChecklistItem,
  viajeId: string,
  firestoreId: string,
  usuarioId: string
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  // Generar nuevo ID local (usamos el localId de Firestore si existe)
  const id = itemData.localId || generateId();

  await db.runAsync(
    `INSERT OR REPLACE INTO checklist_items (
      id, viajeId, usuarioId, texto, completado, orden, seccion, firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      usuarioId,
      itemData.texto,
      itemData.completado ? 1 : 0,
      itemData.orden || 0,
      'grupal', // Siempre grupal para items de Firestore
      firestoreId,
      now,
      now,
    ]
  );
}

/**
 * Actualiza un item de checklist existente en SQLite
 */
async function updateLocalChecklistItem(
  localId: string,
  itemData: FirestoreChecklistItem
): Promise<void> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  await db.runAsync(
    `UPDATE checklist_items SET
      texto = ?,
      completado = ?,
      orden = ?,
      updatedAt = ?
    WHERE id = ?`,
    [
      itemData.texto,
      itemData.completado ? 1 : 0,
      itemData.orden || 0,
      now,
      localId,
    ]
  );
}
