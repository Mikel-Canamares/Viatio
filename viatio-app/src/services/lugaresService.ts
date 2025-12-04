/**
 * SERVICE: LUGARES
 *
 * Servicio para gestión de lugares de interés en viajes.
 * Maneja CRUD de lugares (restaurantes, hoteles, atracciones, etc.)
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import type { Lugar, CreateLugarInput } from '@/types/lugar';

// ============================================
// HELPERS
// ============================================

/**
 * Calcula el siguiente número de orden para un lugar en un día o viaje
 */
async function getNextOrden(viajeId: string, diaId?: string): Promise<number> {
  try {
    const db = await getDatabase();

    let query: string;
    let params: string[];

    if (diaId) {
      // Buscar el máximo orden en el día específico
      query = 'SELECT MAX(orden) as maxOrden FROM lugares WHERE diaId = ?';
      params = [diaId];
    } else {
      // Buscar el máximo orden en lugares sin día asignado del viaje
      query = 'SELECT MAX(orden) as maxOrden FROM lugares WHERE viajeId = ? AND diaId IS NULL';
      params = [viajeId];
    }

    const result = await db.getFirstAsync<{ maxOrden: number | null }>(query, params);
    return (result?.maxOrden ?? -1) + 1;
  } catch (error) {
    console.error('[getNextOrden] Error:', error);
    return 0;
  }
}

/**
 * Convierte un row de BD a objeto Lugar
 */
function rowToLugar(row: any): Lugar {
  return {
    id: row.id,
    viajeId: row.viajeId,
    diaId: row.diaId || undefined,
    nombre: row.nombre,
    descripcion: row.descripcion || undefined,
    categoria: row.categoria,
    direccion: row.direccion || undefined,
    latitud: row.latitud !== null ? row.latitud : undefined,
    longitud: row.longitud !== null ? row.longitud : undefined,
    orden: row.orden,
    visitado: row.visitado === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Logger de errores
 */
function logError(error: unknown, context: string) {
  console.error(`[lugaresService.${context}] Error:`, error);
}

// ============================================
// CREATE
// ============================================

/**
 * Crea un nuevo lugar de interés
 */
export async function createLugar(input: CreateLugarInput): Promise<Lugar> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    // Calcular orden si no se proporciona
    const orden = input.orden !== undefined
      ? input.orden
      : await getNextOrden(input.viajeId, input.diaId);

    await db.runAsync(
      `INSERT INTO lugares (
        id, viajeId, diaId, nombre, descripcion, categoria,
        direccion, latitud, longitud, orden, visitado,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.viajeId,
        input.diaId || null,
        input.nombre,
        input.descripcion || null,
        input.categoria,
        input.direccion || null,
        input.latitud !== undefined ? input.latitud : null,
        input.longitud !== undefined ? input.longitud : null,
        orden,
        0, // visitado = false
        timestamp,
        timestamp,
      ]
    );

    console.log('[createLugar] Lugar creado:', { id, nombre: input.nombre });

    // Retornar el lugar creado
    const lugar = await getLugarById(id);
    if (!lugar) {
      throw new Error('No se pudo recuperar el lugar creado');
    }

    return lugar;
  } catch (error) {
    logError(error, 'createLugar');
    throw error;
  }
}

// ============================================
// READ
// ============================================

/**
 * Obtiene todos los lugares de un viaje ordenados por orden ASC
 */
export async function getLugaresByViajeId(viajeId: string): Promise<Lugar[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM lugares WHERE viajeId = ? ORDER BY orden ASC',
      [viajeId]
    );

    return rows.map(rowToLugar);
  } catch (error) {
    logError(error, 'getLugaresByViajeId');
    return [];
  }
}

/**
 * Obtiene todos los lugares de un día específico ordenados por orden ASC
 */
export async function getLugaresByDiaId(diaId: string): Promise<Lugar[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM lugares WHERE diaId = ? ORDER BY orden ASC',
      [diaId]
    );

    return rows.map(rowToLugar);
  } catch (error) {
    logError(error, 'getLugaresByDiaId');
    return [];
  }
}

/**
 * Obtiene un lugar por su ID
 */
export async function getLugarById(id: string): Promise<Lugar | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM lugares WHERE id = ?',
      [id]
    );

    return row ? rowToLugar(row) : null;
  } catch (error) {
    logError(error, 'getLugarById');
    return null;
  }
}

// ============================================
// UPDATE
// ============================================

/**
 * Actualiza un lugar
 */
export async function updateLugar(
  id: string,
  input: Partial<CreateLugarInput>
): Promise<Lugar | null> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    // Construir query dinámicamente según los campos proporcionados
    const fields: string[] = [];
    const values: any[] = [];

    if (input.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(input.nombre);
    }
    if (input.descripcion !== undefined) {
      fields.push('descripcion = ?');
      values.push(input.descripcion || null);
    }
    if (input.categoria !== undefined) {
      fields.push('categoria = ?');
      values.push(input.categoria);
    }
    if (input.direccion !== undefined) {
      fields.push('direccion = ?');
      values.push(input.direccion || null);
    }
    if (input.latitud !== undefined) {
      fields.push('latitud = ?');
      values.push(input.latitud);
    }
    if (input.longitud !== undefined) {
      fields.push('longitud = ?');
      values.push(input.longitud);
    }
    if (input.orden !== undefined) {
      fields.push('orden = ?');
      values.push(input.orden);
    }

    // Siempre actualizar updatedAt
    fields.push('updatedAt = ?');
    values.push(timestamp);

    // Agregar el ID al final
    values.push(id);

    if (fields.length === 1) {
      // Solo updatedAt, no hay nada que actualizar
      console.log('[updateLugar] Sin cambios para actualizar');
      return getLugarById(id);
    }

    await db.runAsync(
      `UPDATE lugares SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[updateLugar] Lugar actualizado:', id);

    return getLugarById(id);
  } catch (error) {
    logError(error, 'updateLugar');
    return null;
  }
}

/**
 * Cambia el estado de visitado de un lugar
 */
export async function toggleVisitado(id: string): Promise<Lugar | null> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    // Obtener estado actual
    const lugar = await getLugarById(id);
    if (!lugar) {
      console.error('[toggleVisitado] Lugar no encontrado:', id);
      return null;
    }

    const nuevoEstado = !lugar.visitado;

    await db.runAsync(
      'UPDATE lugares SET visitado = ?, updatedAt = ? WHERE id = ?',
      [nuevoEstado ? 1 : 0, timestamp, id]
    );

    console.log('[toggleVisitado] Estado cambiado:', { id, visitado: nuevoEstado });

    return getLugarById(id);
  } catch (error) {
    logError(error, 'toggleVisitado');
    return null;
  }
}

/**
 * Asigna o desasigna un lugar a un día específico
 */
export async function assignLugarToDia(
  lugarId: string,
  diaId: string | null
): Promise<Lugar | null> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    // Obtener el lugar actual
    const lugar = await getLugarById(lugarId);
    if (!lugar) {
      console.error('[assignLugarToDia] Lugar no encontrado:', lugarId);
      return null;
    }

    // Calcular nuevo orden
    const nuevoOrden = await getNextOrden(lugar.viajeId, diaId || undefined);

    await db.runAsync(
      'UPDATE lugares SET diaId = ?, orden = ?, updatedAt = ? WHERE id = ?',
      [diaId, nuevoOrden, timestamp, lugarId]
    );

    console.log('[assignLugarToDia] Lugar asignado:', { lugarId, diaId, orden: nuevoOrden });

    return getLugarById(lugarId);
  } catch (error) {
    logError(error, 'assignLugarToDia');
    return null;
  }
}

/**
 * Reordena múltiples lugares según un array de IDs
 * Útil para drag & drop
 */
export async function reorderLugares(lugarIds: string[]): Promise<void> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    // Actualizar el orden de cada lugar según su posición en el array
    for (let i = 0; i < lugarIds.length; i++) {
      await db.runAsync(
        'UPDATE lugares SET orden = ?, updatedAt = ? WHERE id = ?',
        [i, timestamp, lugarIds[i]]
      );
    }

    console.log('[reorderLugares] Lugares reordenados:', lugarIds.length);
  } catch (error) {
    logError(error, 'reorderLugares');
    throw error;
  }
}

// ============================================
// DELETE
// ============================================

/**
 * Elimina un lugar
 */
export async function deleteLugar(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    await db.runAsync('DELETE FROM lugares WHERE id = ?', [id]);

    console.log('[deleteLugar] Lugar eliminado:', id);

    return true;
  } catch (error) {
    logError(error, 'deleteLugar');
    return false;
  }
}
