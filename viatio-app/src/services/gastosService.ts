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
  ConvertedAmount,
} from '@/types/gasto';
import { logError } from '@/utils';
import { getViajeById } from './viajesService';
import { syncGastoIfShared, syncDeleteIfShared } from './sync/syncUpload';
import { convertBatch } from './currencyService';

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

    // Sincronizar con Firestore si es viaje compartido (no bloqueante)
    syncGastoIfShared(gasto).catch((error) => {
      console.warn('[GastosService] Error al sincronizar gasto:', error);
    });

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
    const gastoActualizado = await getGastoById(id);

    // Sincronizar con Firestore si es viaje compartido (no bloqueante)
    if (gastoActualizado) {
      syncGastoIfShared(gastoActualizado).catch((error) => {
        console.warn('[GastosService] Error al sincronizar gasto:', error);
      });
    }

    return gastoActualizado;
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

    // Sincronizar eliminación con Firestore si es viaje compartido
    if (existing.firestoreId) {
      try {
        await syncDeleteIfShared(existing.viajeId, 'expenses', existing.firestoreId);
        console.log('[GastosService] Eliminación sincronizada con Firestore');
      } catch (error) {
        console.warn('[GastosService] Error al sincronizar eliminación con Firestore:', error);
        // Continuar con la eliminación local aunque falle la sincronización
      }
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

/**
 * Calcula el resumen de gastos con conversión a divisa del viaje
 * Si hay gastos en múltiples divisas, convierte todo a la divisa base
 */
export async function getResumenGastosConvertido(viajeId: string): Promise<ResumenGastos> {
  try {
    const db = await getDatabase();

    // Obtener el viaje para presupuesto y moneda
    const viaje = await getViajeById(viajeId);
    if (!viaje) {
      throw new Error('Viaje no encontrado');
    }

    const baseCurrency = viaje.moneda || 'EUR';

    // Obtener todos los gastos
    const gastos = await getGastosByViajeId(viajeId);

    // Verificar si hay gastos en múltiples divisas
    const divisas = new Set(gastos.map(g => g.moneda));

    if (divisas.size <= 1) {
      // Solo una divisa o sin gastos, retornar resumen normal
      return await getResumenGastos(viajeId);
    }

    // Hay múltiples divisas: convertir todos a divisa base
    console.log(
      `[GastosService] Convirtiendo ${gastos.length} gastos en ${divisas.size} divisas a ${baseCurrency}`
    );

    // Preparar conversiones en batch
    const conversions = gastos.map(gasto => ({
      amount: gasto.monto,
      from: gasto.moneda,
      to: baseCurrency,
    }));

    // Realizar conversiones en batch
    const converted = await convertBatch(conversions);

    // Calcular totales convertidos
    let totalConverted = 0;
    const porCategoriaConverted: Record<CategoriaGasto, number> = {
      transporte: 0,
      alojamiento: 0,
      comida: 0,
      actividades: 0,
      compras: 0,
      otros: 0,
    };
    const porDiaMap = new Map<string, number>();

    gastos.forEach((gasto, index) => {
      const conversion = converted[index];
      if (!conversion) {
        console.warn(
          `[GastosService] No se pudo convertir gasto ${gasto.id}, usando monto original`
        );
        // Si falla conversión, usar monto original (asumiendo misma divisa)
        totalConverted += gasto.monto;
        porCategoriaConverted[gasto.categoria] += gasto.monto;
        porDiaMap.set(gasto.fecha, (porDiaMap.get(gasto.fecha) || 0) + gasto.monto);
      } else {
        const montoConvertido = conversion.converted;
        totalConverted += montoConvertido;
        porCategoriaConverted[gasto.categoria] += montoConvertido;
        porDiaMap.set(gasto.fecha, (porDiaMap.get(gasto.fecha) || 0) + montoConvertido);
      }
    });

    // Convertir mapa de días a array ordenado
    const porDiaConverted = Array.from(porDiaMap.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Calcular restante si hay presupuesto
    let restanteConverted: number | undefined;
    if (viaje.presupuesto !== undefined && viaje.presupuesto !== null) {
      restanteConverted = viaje.presupuesto - totalConverted;
    }

    // Obtener también resumen normal (sin conversión) para comparación
    const resumenNormal = await getResumenGastos(viajeId);

    return {
      ...resumenNormal,
      // Añadir datos convertidos
      totalConverted,
      convertedBreakdown: {
        porCategoria: porCategoriaConverted,
        porDia: porDiaConverted,
      },
      restante: restanteConverted,
    };
  } catch (error) {
    logError(error, 'getResumenGastosConvertido');
    console.warn('[GastosService] Error en conversión, retornando resumen normal');
    // Si falla la conversión, retornar resumen normal
    return await getResumenGastos(viajeId);
  }
}

/**
 * Obtiene un gasto con información de conversión
 * @param gastoId ID del gasto
 * @param targetCurrency Divisa objetivo para conversión (opcional)
 * @returns Gasto con información de conversión si aplica
 */
export async function getGastoConvertido(
  gastoId: string,
  targetCurrency?: string
): Promise<Gasto & { converted?: ConvertedAmount }> {
  try {
    const gasto = await getGastoById(gastoId);

    if (!gasto) {
      throw new Error('Gasto no encontrado');
    }

    // Si no se especifica divisa objetivo, usar divisa del viaje
    if (!targetCurrency) {
      const viaje = await getViajeById(gasto.viajeId);
      targetCurrency = viaje?.moneda || 'EUR';
    }

    // Si es la misma divisa, no hay conversión
    if (gasto.moneda === targetCurrency) {
      return gasto;
    }

    // Convertir
    const conversions = await convertBatch([
      {
        amount: gasto.monto,
        from: gasto.moneda,
        to: targetCurrency,
      },
    ]);

    const converted = conversions[0];

    if (converted) {
      return {
        ...gasto,
        converted,
      };
    } else {
      console.warn(`[GastosService] No se pudo convertir gasto ${gastoId}`);
      return gasto;
    }
  } catch (error) {
    logError(error, 'getGastoConvertido');
    throw new Error('Error al obtener gasto convertido');
  }
}
