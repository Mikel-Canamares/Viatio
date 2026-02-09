/**
 * SERVICIO: CHECKLIST ITEMS
 *
 * Gestión CRUD completa de items de checklist para viajes.
 * Los items pueden ser personales (solo locales) o grupales (sincronizados con Firestore).
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import {
  ChecklistItem,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  SeccionChecklist,
} from '@/types/checklist';
import { logError } from '@/utils/errorHandler';
import { syncChecklistItemIfShared, syncDeleteIfShared } from '@/services/sync/syncUpload';

// ============================================
// MAPEO DE BASE DE DATOS
// ============================================

function mapRowToChecklistItem(row: any): ChecklistItem {
  return {
    id: row.id,
    viajeId: row.viajeId,
    usuarioId: row.usuarioId,
    texto: row.texto,
    completado: row.completado === 1,
    orden: row.orden || 0,
    seccion: row.seccion as SeccionChecklist,
    firestoreId: row.firestoreId || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Crear un nuevo item de checklist
 */
export async function createChecklistItem(
  input: CreateChecklistItemInput,
  usuarioId: string
): Promise<ChecklistItem> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const now = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO checklist_items (
        id, viajeId, usuarioId, texto, completado, orden, seccion, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.viajeId,
        usuarioId,
        input.texto,
        0, // completado
        input.orden || 0,
        input.seccion,
        now,
        now,
      ]
    );

    const item = await getChecklistItemById(id);
    if (!item) {
      throw new Error('Error al crear item de checklist');
    }

    // Sincronizar con Firestore si es grupal y el viaje es compartido
    if (input.seccion === 'grupal') {
      await syncChecklistItemIfShared(item).catch((error) => {
        console.warn('[ChecklistService] Error al sincronizar item:', error);
      });
    }

    return item;
  } catch (error) {
    logError(error, 'createChecklistItem');
    throw error;
  }
}

/**
 * Obtener un item de checklist por ID
 */
export async function getChecklistItemById(
  id: string
): Promise<ChecklistItem | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM checklist_items WHERE id = ?',
      [id]
    );

    return row ? mapRowToChecklistItem(row) : null;
  } catch (error) {
    logError(error, 'getChecklistItemById');
    throw error;
  }
}

/**
 * Obtener todos los items de checklist de un viaje
 */
export async function getChecklistItemsByViajeId(
  viajeId: string
): Promise<ChecklistItem[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM checklist_items WHERE viajeId = ? ORDER BY orden ASC, createdAt DESC',
      [viajeId]
    );

    return rows.map(mapRowToChecklistItem);
  } catch (error) {
    logError(error, 'getChecklistItemsByViajeId');
    throw error;
  }
}

/**
 * Obtener items de checklist por sección (personal/grupal)
 */
export async function getItemsBySeccion(
  viajeId: string,
  seccion: SeccionChecklist
): Promise<ChecklistItem[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM checklist_items WHERE viajeId = ? AND seccion = ? ORDER BY orden ASC, createdAt DESC',
      [viajeId, seccion]
    );

    return rows.map(mapRowToChecklistItem);
  } catch (error) {
    logError(error, 'getItemsBySeccion');
    throw error;
  }
}

/**
 * Actualizar un item de checklist
 */
export async function updateChecklistItem(
  id: string,
  input: UpdateChecklistItemInput
): Promise<ChecklistItem | null> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    // Construir query dinámicamente según los campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];

    if (input.texto !== undefined) {
      updates.push('texto = ?');
      values.push(input.texto);
    }

    if (input.completado !== undefined) {
      updates.push('completado = ?');
      values.push(input.completado ? 1 : 0);
    }

    if (input.orden !== undefined) {
      updates.push('orden = ?');
      values.push(input.orden);
    }

    if (updates.length === 0) {
      return await getChecklistItemById(id);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE checklist_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const item = await getChecklistItemById(id);
    if (!item) {
      return null;
    }

    // Sincronizar con Firestore si es grupal y el viaje es compartido
    if (item.seccion === 'grupal') {
      await syncChecklistItemIfShared(item).catch((error) => {
        console.warn('[ChecklistService] Error al sincronizar item:', error);
      });
    }

    return item;
  } catch (error) {
    logError(error, 'updateChecklistItem');
    throw error;
  }
}

/**
 * Toggle el estado completado de un item
 */
export async function toggleItemCompletado(
  id: string
): Promise<ChecklistItem | null> {
  try {
    const db = await getDatabase();
    const item = await getChecklistItemById(id);
    if (!item) {
      return null;
    }

    const newCompletado = !item.completado;
    return await updateChecklistItem(id, { completado: newCompletado });
  } catch (error) {
    logError(error, 'toggleItemCompletado');
    throw error;
  }
}

/**
 * Eliminar un item de checklist
 */
export async function deleteChecklistItem(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Obtener el item antes de eliminar para sincronizar
    const item = await getChecklistItemById(id);
    if (!item) {
      return false;
    }

    // Eliminar de SQLite
    await db.runAsync('DELETE FROM checklist_items WHERE id = ?', [id]);

    // Sincronizar eliminación con Firestore si es grupal
    if (item.seccion === 'grupal' && item.firestoreId) {
      await syncDeleteIfShared(item.viajeId, 'checklist', item.firestoreId).catch((error) => {
        console.warn('[ChecklistService] Error al sincronizar eliminación:', error);
      });
    }

    return true;
  } catch (error) {
    logError(error, 'deleteChecklistItem');
    throw error;
  }
}

/**
 * Reordenar múltiples items de checklist
 */
export async function reorderItems(
  items: Array<{ id: string; orden: number }>
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    await db.withTransactionAsync(async () => {
      for (const item of items) {
        await db.runAsync(
          'UPDATE checklist_items SET orden = ?, updatedAt = ? WHERE id = ?',
          [item.orden, now, item.id]
        );
      }
    });

    // Sincronizar items reordenados si son grupales
    for (const itemData of items) {
      const item = await getChecklistItemById(itemData.id);
      if (item && item.seccion === 'grupal') {
        await syncChecklistItemIfShared(item).catch((error) => {
          console.warn('[ChecklistService] Error al sincronizar reorden:', error);
        });
      }
    }
  } catch (error) {
    logError(error, 'reorderItems');
    throw error;
  }
}

/**
 * Obtener item de checklist por firestoreId
 * Útil para sincronización desde Firestore
 */
export async function getChecklistItemByFirestoreId(
  firestoreId: string,
  viajeId: string
): Promise<ChecklistItem | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM checklist_items WHERE firestoreId = ? AND viajeId = ?',
      [firestoreId, viajeId]
    );

    return row ? mapRowToChecklistItem(row) : null;
  } catch (error) {
    logError(error, 'getChecklistItemByFirestoreId');
    throw error;
  }
}
