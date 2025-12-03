/**
 * VIAJES SERVICE
 *
 * Servicio para gestionar operaciones CRUD de viajes.
 * Incluye creación, lectura, actualización, eliminación y estadísticas.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import type {
  Viaje,
  CreateViajeInput,
  UpdateViajeInput,
  ViajeStats,
} from '@/types/viaje';
import { logError } from '@/utils';
import { createDiasParaViaje, deleteDiasByViajeId } from './diasViajeService';

// ============================================
// CREAR
// ============================================

/**
 * Crea un nuevo viaje
 */
export async function createViaje(
  input: CreateViajeInput,
  usuarioId: string
): Promise<Viaje> {
  try {
    const db = await getDatabase();

    const id = generateId();
    const now = getCurrentTimestamp();

    const viaje: Viaje = {
      id,
      usuarioId,
      destino: input.destino,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      descripcion: input.descripcion,
      imagenUrl: input.imagenUrl,
      presupuesto: input.presupuesto,
      moneda: input.moneda || 'EUR',
      numViajeros: input.numViajeros || 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO viajes (
        id, usuarioId, destino, fechaInicio, fechaFin, descripcion,
        imagenUrl, presupuesto, moneda, numViajeros, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        viaje.id,
        viaje.usuarioId,
        viaje.destino,
        viaje.fechaInicio,
        viaje.fechaFin,
        viaje.descripcion ?? null,
        viaje.imagenUrl ?? null,
        viaje.presupuesto ?? null,
        viaje.moneda,
        viaje.numViajeros,
        viaje.createdAt,
        viaje.updatedAt,
      ]
    );

    console.log('[ViajesService] Viaje creado:', viaje.id);

    // Crear días del viaje automáticamente
    await createDiasParaViaje(viaje.id, viaje.fechaInicio, viaje.fechaFin);
    console.log('[ViajesService] Días creados para viaje:', viaje.id);

    return viaje;
  } catch (error) {
    logError(error, 'createViaje');
    throw new Error('Error al crear el viaje');
  }
}

// ============================================
// LEER
// ============================================

/**
 * Obtiene todos los viajes de un usuario
 */
export async function getViajesByUsuario(usuarioId: string): Promise<Viaje[]> {
  try {
    const db = await getDatabase();

    const viajes = await db.getAllAsync<Viaje>(
      'SELECT * FROM viajes WHERE usuarioId = ? ORDER BY fechaInicio DESC',
      [usuarioId]
    );

    return viajes;
  } catch (error) {
    logError(error, 'getViajesByUsuario');
    throw new Error('Error al obtener los viajes');
  }
}

/**
 * Obtiene un viaje por ID
 */
export async function getViajeById(id: string): Promise<Viaje | null> {
  try {
    const db = await getDatabase();

    const viaje = await db.getFirstAsync<Viaje>(
      'SELECT * FROM viajes WHERE id = ?',
      [id]
    );

    return viaje || null;
  } catch (error) {
    logError(error, 'getViajeById');
    throw new Error('Error al obtener el viaje');
  }
}

// ============================================
// ACTUALIZAR
// ============================================

/**
 * Actualiza un viaje existente
 */
export async function updateViaje(
  id: string,
  input: UpdateViajeInput
): Promise<Viaje | null> {
  try {
    const db = await getDatabase();

    // Verificar que el viaje existe
    const existing = await getViajeById(id);
    if (!existing) {
      return null;
    }

    const now = getCurrentTimestamp();

    // Construir query dinámico solo con campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];

    if (input.destino !== undefined) {
      updates.push('destino = ?');
      values.push(input.destino);
    }
    if (input.fechaInicio !== undefined) {
      updates.push('fechaInicio = ?');
      values.push(input.fechaInicio);
    }
    if (input.fechaFin !== undefined) {
      updates.push('fechaFin = ?');
      values.push(input.fechaFin);
    }
    if (input.descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(input.descripcion);
    }
    if (input.imagenUrl !== undefined) {
      updates.push('imagenUrl = ?');
      values.push(input.imagenUrl);
    }
    if (input.presupuesto !== undefined) {
      updates.push('presupuesto = ?');
      values.push(input.presupuesto);
    }
    if (input.moneda !== undefined) {
      updates.push('moneda = ?');
      values.push(input.moneda);
    }
    if (input.numViajeros !== undefined) {
      updates.push('numViajeros = ?');
      values.push(input.numViajeros);
    }

    // Siempre actualizar updatedAt
    updates.push('updatedAt = ?');
    values.push(now);

    // Añadir ID al final
    values.push(id);

    await db.runAsync(
      `UPDATE viajes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[ViajesService] Viaje actualizado:', id);

    // Retornar viaje actualizado
    return await getViajeById(id);
  } catch (error) {
    logError(error, 'updateViaje');
    throw new Error('Error al actualizar el viaje');
  }
}

// ============================================
// ELIMINAR
// ============================================

/**
 * Elimina un viaje y todos sus registros relacionados
 */
export async function deleteViaje(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Verificar que el viaje existe
    const existing = await getViajeById(id);
    if (!existing) {
      return false;
    }

    // Eliminar días del viaje en cascada
    await deleteDiasByViajeId(id);
    console.log('[ViajesService] Días eliminados para viaje:', id);

    // DELETE CASCADE eliminará automáticamente registros relacionados
    // (reservas, lugares, documentos, gastos)
    const result = await db.runAsync('DELETE FROM viajes WHERE id = ?', [id]);

    console.log('[ViajesService] Viaje eliminado:', id);
    return result.changes > 0;
  } catch (error) {
    logError(error, 'deleteViaje');
    throw new Error('Error al eliminar el viaje');
  }
}

// ============================================
// REPARACIÓN Y MANTENIMIENTO
// ============================================

/**
 * Repara viajes que no tienen días creados
 * Útil para viajes creados antes de la implementación de creación automática de días
 */
export async function repairViajesSinDias(usuarioId: string): Promise<number> {
  try {
    const db = await getDatabase();

    // Obtener todos los viajes del usuario
    const viajes = await getViajesByUsuario(usuarioId);
    let viajesReparados = 0;

    for (const viaje of viajes) {
      // Verificar si el viaje tiene días
      const dias = await db.getAllAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM dias_viaje WHERE viajeId = ?',
        [viaje.id]
      );

      const tieneDias = (dias[0]?.count || 0) > 0;

      if (!tieneDias) {
        console.log('[ViajesService] Reparando viaje sin días:', viaje.id, viaje.destino);
        await createDiasParaViaje(viaje.id, viaje.fechaInicio, viaje.fechaFin);
        viajesReparados++;
      }
    }

    console.log('[ViajesService] Reparación completada:', viajesReparados, 'viajes reparados');
    return viajesReparados;
  } catch (error) {
    logError(error, 'repairViajesSinDias');
    throw new Error('Error al reparar viajes sin días');
  }
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Calcula estadísticas de un viaje
 */
export async function getViajeStats(viajeId: string): Promise<ViajeStats> {
  try {
    const db = await getDatabase();

    // Obtener el viaje
    const viaje = await getViajeById(viajeId);
    if (!viaje) {
      throw new Error('Viaje no encontrado');
    }

    // Calcular días totales
    const fechaInicio = new Date(viaje.fechaInicio);
    const fechaFin = new Date(viaje.fechaFin);
    const diasTotales =
      Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calcular días restantes (desde hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (fechaInicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Contar reservas
    const reservasResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reservas WHERE viajeId = ?',
      [viajeId]
    );
    const reservasCount = reservasResult?.count || 0;

    // Contar lugares
    const lugaresResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM lugares WHERE viajeId = ?',
      [viajeId]
    );
    const lugaresCount = lugaresResult?.count || 0;

    // Contar documentos
    const documentosResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documentos WHERE viajeId = ?',
      [viajeId]
    );
    const documentosCount = documentosResult?.count || 0;

    // Sumar gastos
    const gastosResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE viajeId = ?',
      [viajeId]
    );
    const gastoTotal = gastosResult?.total || 0;

    return {
      diasTotales,
      diasRestantes,
      reservasCount,
      lugaresCount,
      documentosCount,
      gastoTotal,
    };
  } catch (error) {
    logError(error, 'getViajeStats');
    throw new Error('Error al obtener estadísticas del viaje');
  }
}
