/**
 * ARCHIVE SERVICE
 *
 * Servicio para gestionar archivado y eliminación de viajes.
 * Incluye archivado, desarchivado, auto-archivo y eliminación de archivos físicos.
 */

import * as FileSystem from 'expo-file-system';
import { getDatabase, getCurrentTimestamp } from '@/database';
import { logError } from '@/utils';
import type { Viaje } from '@/types/viaje';
import { getDocumentosByViajeId } from './documentosService';
import { deleteDiasByViajeId } from './diasViajeService';

// ============================================
// ARCHIVADO
// ============================================

/**
 * Archiva un viaje (ocultarlo de la lista principal sin eliminarlo)
 */
export async function archiveViaje(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    const result = await db.runAsync(
      'UPDATE viajes SET archived = 1, updatedAt = ? WHERE id = ?',
      [now, id]
    );

    console.log('[ArchiveService] Viaje archivado:', id);
    return result.changes > 0;
  } catch (error) {
    logError(error, 'archiveViaje');
    throw new Error('Error al archivar el viaje');
  }
}

/**
 * Desarchiva un viaje (hacerlo visible de nuevo en la lista principal)
 */
export async function unarchiveViaje(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    const result = await db.runAsync(
      'UPDATE viajes SET archived = 0, updatedAt = ? WHERE id = ?',
      [now, id]
    );

    console.log('[ArchiveService] Viaje desarchivado:', id);
    return result.changes > 0;
  } catch (error) {
    logError(error, 'unarchiveViaje');
    throw new Error('Error al desarchivar el viaje');
  }
}

// ============================================
// AUTO-ARCHIVO
// ============================================

/**
 * Auto-archiva viajes finalizados (al día siguiente de su fecha de fin)
 * Esta función debe ejecutarse al abrir la app o al cargar la lista de viajes
 */
export async function autoArchiveFinishedTrips(
  usuarioId: string
): Promise<number> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    // Fecha de ayer (para comparar con fechaFin)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    // Archivar viajes cuya fecha de fin fue antes de ayer o ayer mismo
    const result = await db.runAsync(
      `UPDATE viajes
       SET archived = 1, updatedAt = ?
       WHERE usuarioId = ?
       AND archived = 0
       AND fechaFin < ?`,
      [now, usuarioId, yesterdayStr]
    );

    if (result.changes > 0) {
      console.log(
        `[ArchiveService] Auto-archivados ${result.changes} viaje(s) finalizados`
      );
    }

    return result.changes;
  } catch (error) {
    logError(error, 'autoArchiveFinishedTrips');
    // No lanzar error, solo loguear para no bloquear la carga de viajes
    console.warn('[ArchiveService] Error en auto-archivo:', error);
    return 0;
  }
}

// ============================================
// ELIMINACIÓN DE ARCHIVOS FÍSICOS
// ============================================

/**
 * Elimina todos los archivos físicos (documentos) asociados a un viaje
 * Esta función debe ejecutarse ANTES de eliminar el viaje de la BD
 */
export async function deleteViajeFiles(viajeId: string): Promise<void> {
  try {
    // Obtener todos los documentos del viaje
    const documentos = await getDocumentosByViajeId(viajeId);

    if (documentos.length === 0) {
      console.log('[ArchiveService] No hay archivos físicos que eliminar');
      return;
    }

    // Eliminar cada archivo físico
    let deletedCount = 0;
    for (const doc of documentos) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(doc.rutaArchivo);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(doc.rutaArchivo, { idempotent: true });
          deletedCount++;
          console.log('[ArchiveService] Archivo eliminado:', doc.nombre);
        }
      } catch (fileError) {
        // Continuar con los siguientes archivos aunque uno falle
        console.warn(
          `[ArchiveService] Error al eliminar archivo ${doc.nombre}:`,
          fileError
        );
      }
    }

    console.log(
      `[ArchiveService] ${deletedCount} archivo(s) físico(s) eliminado(s) para viaje ${viajeId}`
    );
  } catch (error) {
    logError(error, 'deleteViajeFiles');
    // No lanzar error para permitir continuar con la eliminación en BD
    console.warn('[ArchiveService] Error al eliminar archivos físicos:', error);
  }
}

// ============================================
// ELIMINACIÓN COMPLETA (CON CASCADA)
// ============================================

/**
 * Elimina un viaje de forma permanente, incluyendo:
 * 1. Archivos físicos (documentos)
 * 2. Días del viaje
 * 3. Todas las entidades relacionadas vía CASCADE (reservas, lugares, gastos, documentos)
 */
export async function deleteViajeCompletely(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Verificar que el viaje existe
    const existing = await db.getFirstAsync<Viaje>(
      'SELECT * FROM viajes WHERE id = ?',
      [id]
    );

    if (!existing) {
      console.warn('[ArchiveService] Viaje no encontrado:', id);
      return false;
    }

    // PASO 1: Eliminar archivos físicos ANTES de eliminar registros en BD
    await deleteViajeFiles(id);

    // PASO 2: Eliminar días del viaje (esto desvincula reservas, lugares y gastos)
    await deleteDiasByViajeId(id);
    console.log('[ArchiveService] Días eliminados para viaje:', id);

    // PASO 3: Eliminar viaje (CASCADE eliminará automáticamente: reservas, lugares, documentos, gastos)
    const result = await db.runAsync('DELETE FROM viajes WHERE id = ?', [id]);

    console.log('[ArchiveService] Viaje eliminado completamente:', id);
    return result.changes > 0;
  } catch (error) {
    logError(error, 'deleteViajeCompletely');
    throw new Error('Error al eliminar el viaje completamente');
  }
}

// ============================================
// ESTADÍSTICAS DE ARCHIVO
// ============================================

/**
 * Obtiene el conteo de elementos asociados a un viaje (para mostrar en confirmación de borrado)
 */
export async function getViajeRelatedCounts(viajeId: string): Promise<{
  reservas: number;
  lugares: number;
  documentos: number;
  gastos: number;
}> {
  try {
    const db = await getDatabase();

    const reservasResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reservas WHERE viajeId = ?',
      [viajeId]
    );

    const lugaresResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM lugares WHERE viajeId = ?',
      [viajeId]
    );

    const documentosResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documentos WHERE viajeId = ?',
      [viajeId]
    );

    const gastosResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM gastos WHERE viajeId = ?',
      [viajeId]
    );

    return {
      reservas: reservasResult?.count || 0,
      lugares: lugaresResult?.count || 0,
      documentos: documentosResult?.count || 0,
      gastos: gastosResult?.count || 0,
    };
  } catch (error) {
    logError(error, 'getViajeRelatedCounts');
    return { reservas: 0, lugares: 0, documentos: 0, gastos: 0 };
  }
}
