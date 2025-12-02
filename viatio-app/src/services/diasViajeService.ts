/**
 * SERVICIO: DÍAS DE VIAJE
 *
 * Servicio para gestionar los días individuales de un viaje.
 * Incluye funciones para crear, leer, actualizar y eliminar días.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { DiaViaje } from '@/types/diaViaje';
import { eachDayOfInterval, parseISO } from 'date-fns';

/**
 * Crea un DiaViaje para cada día del rango de fechas del viaje
 */
export async function createDiasParaViaje(
  viajeId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<DiaViaje[]> {
  const db = await getDatabase();
  const dias: DiaViaje[] = [];

  try {
    // Generar array de fechas usando date-fns
    const inicio = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    const fechas = eachDayOfInterval({ start: inicio, end: fin });

    // Crear un día para cada fecha
    for (const fecha of fechas) {
      const id = generateId();
      const fechaISO = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      const now = getCurrentTimestamp();

      const dia: DiaViaje = {
        id,
        viajeId,
        fecha: fechaISO,
        createdAt: now,
        updatedAt: now,
      };

      // Insertar en la base de datos
      await db.runAsync(
        `INSERT INTO dias_viaje (id, viajeId, fecha, notas, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [dia.id, dia.viajeId, dia.fecha, null, dia.createdAt, dia.updatedAt]
      );

      dias.push(dia);
    }

    return dias;
  } catch (error) {
    console.error('Error creating dias para viaje:', error);
    throw error;
  }
}

/**
 * Obtiene todos los días de un viaje ordenados por fecha
 */
export async function getDiasByViajeId(viajeId: string): Promise<DiaViaje[]> {
  const db = await getDatabase();

  try {
    const rows = await db.getAllAsync<DiaViaje>(
      'SELECT * FROM dias_viaje WHERE viajeId = ? ORDER BY fecha ASC',
      [viajeId]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching dias by viajeId:', error);
    throw error;
  }
}

/**
 * Obtiene un día específico por su ID
 */
export async function getDiaById(id: string): Promise<DiaViaje | null> {
  const db = await getDatabase();

  try {
    const row = await db.getFirstAsync<DiaViaje>(
      'SELECT * FROM dias_viaje WHERE id = ?',
      [id]
    );

    return row || null;
  } catch (error) {
    console.error('Error fetching dia by id:', error);
    throw error;
  }
}

/**
 * Actualiza las notas de un día
 */
export async function updateDiaNotas(
  id: string,
  notas: string
): Promise<DiaViaje | null> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  try {
    await db.runAsync(
      'UPDATE dias_viaje SET notas = ?, updatedAt = ? WHERE id = ?',
      [notas || null, now, id]
    );

    // Retornar el día actualizado
    return await getDiaById(id);
  } catch (error) {
    console.error('Error updating dia notas:', error);
    throw error;
  }
}

/**
 * Elimina todos los días asociados a un viaje
 * Se usa cuando se elimina un viaje
 */
export async function deleteDiasByViajeId(viajeId: string): Promise<void> {
  const db = await getDatabase();

  try {
    await db.runAsync('DELETE FROM dias_viaje WHERE viajeId = ?', [viajeId]);
  } catch (error) {
    console.error('Error deleting dias by viajeId:', error);
    throw error;
  }
}
