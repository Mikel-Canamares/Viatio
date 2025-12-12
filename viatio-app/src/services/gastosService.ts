/**
 * GASTOS SERVICE
 *
 * Servicio para gestionar operaciones CRUD de gastos de viaje.
 * Incluye creación, lectura, actualización, eliminación y resúmenes/estadísticas.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import type {
  Gasto,
  CreateGastoInput,
  CategoriaGasto,
  ResumenGastos,
} from '@/types/gasto';
import { logError } from '@/utils';
import { getViajeById } from './viajesService';

// ============================================
// CREAR
// ============================================

/**
 * Crea un nuevo gasto
 */
export async function createGasto(input: CreateGastoInput): Promise<Gasto> {
  try {
    const db = await getDatabase();

    const id = generateId();
    const now = getCurrentTimestamp();

    const gasto: Gasto = {
      id,
      viajeId: input.viajeId,
      diaId: input.diaId,
      reservaId: input.reservaId,
      categoria: input.categoria,
      descripcion: input.descripcion,
      monto: input.monto,
      moneda: input.moneda || 'EUR',
      fecha: input.fecha,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO gastos (
        id, viajeId, diaId, reservaId, categoria, descripcion, monto, moneda, fecha, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gasto.id,
        gasto.viajeId,
        gasto.diaId ?? null,
        gasto.reservaId ?? null,
        gasto.categoria,
        gasto.descripcion,
        gasto.monto,
        gasto.moneda,
        gasto.fecha,
        gasto.createdAt,
        gasto.updatedAt,
      ]
    );

    console.log('[GastosService] Gasto creado:', gasto.id);
    return gasto;
  } catch (error) {
    logError(error, 'createGasto');
    throw new Error('Error al crear el gasto');
  }
}

// ============================================
// LEER
// ============================================

/**
 * Obtiene todos los gastos de un viaje
 */
export async function getGastosByViajeId(viajeId: string): Promise<Gasto[]> {
  try {
    const db = await getDatabase();

    const gastos = await db.getAllAsync<Gasto>(
      'SELECT * FROM gastos WHERE viajeId = ? ORDER BY fecha DESC',
      [viajeId]
    );

    return gastos;
  } catch (error) {
    logError(error, 'getGastosByViajeId');
    throw new Error('Error al obtener los gastos');
  }
}

/**
 * Obtiene un gasto por ID
 */
export async function getGastoById(id: string): Promise<Gasto | null> {
  try {
    const db = await getDatabase();

    const gasto = await db.getFirstAsync<Gasto>(
      'SELECT * FROM gastos WHERE id = ?',
      [id]
    );

    return gasto || null;
  } catch (error) {
    logError(error, 'getGastoById');
    throw new Error('Error al obtener el gasto');
  }
}

/**
 * Obtiene gastos filtrados por categoría
 */
export async function getGastosByCategoria(
  viajeId: string,
  categoria: CategoriaGasto
): Promise<Gasto[]> {
  try {
    const db = await getDatabase();

    const gastos = await db.getAllAsync<Gasto>(
      'SELECT * FROM gastos WHERE viajeId = ? AND categoria = ? ORDER BY fecha DESC',
      [viajeId, categoria]
    );

    return gastos;
  } catch (error) {
    logError(error, 'getGastosByCategoria');
    throw new Error('Error al obtener gastos por categoría');
  }
}

// ============================================
// ACTUALIZAR
// ============================================

/**
 * Actualiza un gasto existente
 */
export async function updateGasto(
  id: string,
  input: Partial<CreateGastoInput>
): Promise<Gasto | null> {
  try {
    const db = await getDatabase();

    // Verificar que el gasto existe
    const existing = await getGastoById(id);
    if (!existing) {
      return null;
    }

    const now = getCurrentTimestamp();

    // Construir query dinámico solo con campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];

    if (input.categoria !== undefined) {
      updates.push('categoria = ?');
      values.push(input.categoria);
    }
    if (input.descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(input.descripcion);
    }
    if (input.monto !== undefined) {
      updates.push('monto = ?');
      values.push(input.monto);
    }
    if (input.moneda !== undefined) {
      updates.push('moneda = ?');
      values.push(input.moneda);
    }
    if (input.fecha !== undefined) {
      updates.push('fecha = ?');
      values.push(input.fecha);
    }
    if (input.diaId !== undefined) {
      updates.push('diaId = ?');
      values.push(input.diaId);
    }

    // Siempre actualizar updatedAt
    updates.push('updatedAt = ?');
    values.push(now);

    // Añadir ID al final
    values.push(id);

    await db.runAsync(
      `UPDATE gastos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[GastosService] Gasto actualizado:', id);

    // Retornar gasto actualizado
    return await getGastoById(id);
  } catch (error) {
    logError(error, 'updateGasto');
    throw new Error('Error al actualizar el gasto');
  }
}

// ============================================
// ELIMINAR
// ============================================

/**
 * Elimina un gasto
 */
export async function deleteGasto(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Verificar que el gasto existe
    const existing = await getGastoById(id);
    if (!existing) {
      return false;
    }

    const result = await db.runAsync('DELETE FROM gastos WHERE id = ?', [id]);

    console.log('[GastosService] Gasto eliminado:', id);
    return result.changes > 0;
  } catch (error) {
    logError(error, 'deleteGasto');
    throw new Error('Error al eliminar el gasto');
  }
}

/**
 * Obtiene el gasto asociado a una reserva (si existe)
 */
export async function getGastoByReservaId(reservaId: string): Promise<Gasto | null> {
  try {
    const db = await getDatabase();

    const gasto = await db.getFirstAsync<Gasto>(
      'SELECT * FROM gastos WHERE reservaId = ?',
      [reservaId]
    );

    return gasto || null;
  } catch (error) {
    logError(error, 'getGastoByReservaId');
    throw new Error('Error al obtener el gasto de la reserva');
  }
}

/**
 * Elimina el gasto asociado a una reserva (si existe)
 */
export async function deleteGastoByReservaId(reservaId: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.runAsync(
      'DELETE FROM gastos WHERE reservaId = ?',
      [reservaId]
    );

    if (result.changes > 0) {
      console.log('[GastosService] Gasto de reserva eliminado:', reservaId);
    }

    return result.changes > 0;
  } catch (error) {
    logError(error, 'deleteGastoByReservaId');
    throw new Error('Error al eliminar el gasto de la reserva');
  }
}

// ============================================
// ESTADÍSTICAS Y RESÚMENES
// ============================================

/**
 * Calcula el resumen de gastos de un viaje
 */
export async function getResumenGastos(viajeId: string): Promise<ResumenGastos> {
  try {
    const db = await getDatabase();

    // Obtener el viaje para presupuesto y moneda
    const viaje = await getViajeById(viajeId);
    if (!viaje) {
      throw new Error('Viaje no encontrado');
    }

    // Calcular total general
    const totalResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE viajeId = ?',
      [viajeId]
    );
    const total = totalResult?.total || 0;

    // Agrupar por categoría
    const categoriaRows = await db.getAllAsync<{
      categoria: CategoriaGasto;
      total: number;
    }>(
      'SELECT categoria, SUM(monto) as total FROM gastos WHERE viajeId = ? GROUP BY categoria',
      [viajeId]
    );

    const porCategoria: Record<CategoriaGasto, number> = {
      transporte: 0,
      alojamiento: 0,
      comida: 0,
      actividades: 0,
      compras: 0,
      otros: 0,
    };

    categoriaRows.forEach((row) => {
      porCategoria[row.categoria] = row.total;
    });

    // Agrupar por día
    const diaRows = await db.getAllAsync<{ fecha: string; total: number }>(
      'SELECT fecha, SUM(monto) as total FROM gastos WHERE viajeId = ? GROUP BY fecha ORDER BY fecha',
      [viajeId]
    );

    const porDia = diaRows.map((row) => ({
      fecha: row.fecha,
      total: row.total,
    }));

    // Calcular restante si hay presupuesto
    let restante: number | undefined;
    if (viaje.presupuesto !== undefined && viaje.presupuesto !== null) {
      restante = viaje.presupuesto - total;
    }

    return {
      total,
      porCategoria,
      porDia,
      presupuesto: viaje.presupuesto ?? undefined,
      restante,
      moneda: viaje.moneda,
    };
  } catch (error) {
    logError(error, 'getResumenGastos');
    throw new Error('Error al calcular resumen de gastos');
  }
}
