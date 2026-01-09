/**
 * SERVICIO: EVENTOS PERSONALIZADOS
 *
 * Gestión CRUD completa de eventos personalizados del usuario.
 * Los eventos personalizados son actividades planificadas manualmente.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import {
  EventoPersonalizado,
  CreateEventoInput,
  UpdateEventoInput,
  CategoriaEvento,
} from '@/types/evento';
import { logError } from '@/utils/errorHandler';
import { syncEventoIfShared, syncDeleteIfShared } from '@/services/sync/syncUpload';

// ============================================
// MAPEO DE BASE DE DATOS
// ============================================

function mapRowToEvento(row: any): EventoPersonalizado {
  return {
    id: row.id,
    viajeId: row.viajeId,
    diaId: row.diaId || undefined,
    nombre: row.nombre,
    descripcion: row.descripcion || undefined,
    categoria: row.categoria as CategoriaEvento,
    horaInicio: row.horaInicio || undefined,
    horaFin: row.horaFin || undefined,
    duracionMinutos: row.duracionMinutos || undefined,
    ubicacion: row.ubicacion || undefined,
    direccion: row.direccion || undefined,
    latitud: row.latitud || undefined,
    longitud: row.longitud || undefined,
    lugarId: row.lugarId || undefined,
    notas: row.notas || undefined,
    completado: row.completado === 1,
    prioridad: row.prioridad || 'media',
    firestoreId: row.firestoreId || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Crear un nuevo evento personalizado
 */
export async function createEvento(
  input: CreateEventoInput
): Promise<EventoPersonalizado> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const now = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO eventos_personalizados (
        id, viajeId, diaId, nombre, descripcion, categoria,
        horaInicio, horaFin, duracionMinutos,
        ubicacion, direccion, latitud, longitud, lugarId,
        notas, completado, prioridad, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.viajeId,
        input.diaId || null,
        input.nombre,
        input.descripcion || null,
        input.categoria,
        input.horaInicio || null,
        input.horaFin || null,
        input.duracionMinutos || null,
        input.ubicacion || null,
        input.direccion || null,
        input.latitud || null,
        input.longitud || null,
        null, // lugarId - se vinculará después si hay place matching
        input.notas || null,
        0, // completado
        input.prioridad || 'media',
        now,
        now,
      ]
    );

    const evento = await getEventoById(id);
    if (!evento) {
      throw new Error('Error al crear evento');
    }

    // Sincronizar con Firestore si el viaje es compartido
    await syncEventoIfShared(evento);

    return evento;
  } catch (error) {
    logError(error, 'eventosService.createEvento');
    throw error;
  }
}

/**
 * Obtener evento por ID
 */
export async function getEventoById(
  id: string
): Promise<EventoPersonalizado | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      'SELECT * FROM eventos_personalizados WHERE id = ?',
      [id]
    );

    return row ? mapRowToEvento(row) : null;
  } catch (error) {
    logError(error, 'eventosService.getEventoById');
    throw error;
  }
}

/**
 * Obtener todos los eventos de un viaje
 */
export async function getEventosByViajeId(
  viajeId: string
): Promise<EventoPersonalizado[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM eventos_personalizados
       WHERE viajeId = ?
       ORDER BY horaInicio ASC, nombre ASC`,
      [viajeId]
    );

    return rows.map(mapRowToEvento);
  } catch (error) {
    logError(error, 'eventosService.getEventosByViajeId');
    throw error;
  }
}

/**
 * Obtener eventos de un día específico
 */
export async function getEventosByDiaId(
  diaId: string
): Promise<EventoPersonalizado[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM eventos_personalizados
       WHERE diaId = ?
       ORDER BY horaInicio ASC, nombre ASC`,
      [diaId]
    );

    return rows.map(mapRowToEvento);
  } catch (error) {
    logError(error, 'eventosService.getEventosByDiaId');
    throw error;
  }
}

/**
 * Obtener eventos sin día asignado
 */
export async function getEventosSinAsignar(
  viajeId: string
): Promise<EventoPersonalizado[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM eventos_personalizados
       WHERE viajeId = ? AND diaId IS NULL
       ORDER BY nombre ASC`,
      [viajeId]
    );

    return rows.map(mapRowToEvento);
  } catch (error) {
    logError(error, 'eventosService.getEventosSinAsignar');
    throw error;
  }
}

/**
 * Obtener eventos por categoría
 */
export async function getEventosByCategoria(
  viajeId: string,
  categoria: CategoriaEvento
): Promise<EventoPersonalizado[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM eventos_personalizados
       WHERE viajeId = ? AND categoria = ?
       ORDER BY horaInicio ASC`,
      [viajeId, categoria]
    );

    return rows.map(mapRowToEvento);
  } catch (error) {
    logError(error, 'eventosService.getEventosByCategoria');
    throw error;
  }
}

/**
 * Actualizar evento
 */
export async function updateEvento(
  id: string,
  input: UpdateEventoInput
): Promise<EventoPersonalizado | null> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    // Construir query dinámicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (input.nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(input.nombre);
    }
    if (input.descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(input.descripcion);
    }
    if (input.categoria !== undefined) {
      updates.push('categoria = ?');
      values.push(input.categoria);
    }
    if (input.diaId !== undefined) {
      updates.push('diaId = ?');
      values.push(input.diaId);
    }
    if (input.horaInicio !== undefined) {
      updates.push('horaInicio = ?');
      values.push(input.horaInicio);
    }
    if (input.horaFin !== undefined) {
      updates.push('horaFin = ?');
      values.push(input.horaFin);
    }
    if (input.duracionMinutos !== undefined) {
      updates.push('duracionMinutos = ?');
      values.push(input.duracionMinutos);
    }
    if (input.ubicacion !== undefined) {
      updates.push('ubicacion = ?');
      values.push(input.ubicacion);
    }
    if (input.direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(input.direccion);
    }
    if (input.latitud !== undefined) {
      updates.push('latitud = ?');
      values.push(input.latitud);
    }
    if (input.longitud !== undefined) {
      updates.push('longitud = ?');
      values.push(input.longitud);
    }
    if (input.lugarId !== undefined) {
      updates.push('lugarId = ?');
      values.push(input.lugarId);
    }
    if (input.notas !== undefined) {
      updates.push('notas = ?');
      values.push(input.notas);
    }
    if (input.completado !== undefined) {
      updates.push('completado = ?');
      values.push(input.completado ? 1 : 0);
    }
    if (input.prioridad !== undefined) {
      updates.push('prioridad = ?');
      values.push(input.prioridad);
    }

    if (updates.length === 0) {
      return await getEventoById(id);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE eventos_personalizados SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await getEventoById(id);

    // Sincronizar con Firestore si el viaje es compartido
    if (updated) {
      await syncEventoIfShared(updated);
    }

    return updated;
  } catch (error) {
    logError(error, 'eventosService.updateEvento');
    throw error;
  }
}

/**
 * Eliminar evento
 */
export async function deleteEvento(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Obtener el evento antes de eliminarlo para la sincronización
    const evento = await getEventoById(id);

    await db.runAsync('DELETE FROM eventos_personalizados WHERE id = ?', [id]);

    // Sincronizar eliminación con Firestore si el viaje es compartido
    if (evento?.firestoreId) {
      await syncDeleteIfShared(evento.viajeId, 'events', evento.firestoreId);
    }

    return true;
  } catch (error) {
    logError(error, 'eventosService.deleteEvento');
    throw error;
  }
}

/**
 * Eliminar todos los eventos de un viaje
 */
export async function deleteEventosByViajeId(viajeId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM eventos_personalizados WHERE viajeId = ?', [
      viajeId,
    ]);
    return true;
  } catch (error) {
    logError(error, 'eventosService.deleteEventosByViajeId');
    throw error;
  }
}

/**
 * Toggle completado
 */
export async function toggleEventoCompletado(
  id: string
): Promise<EventoPersonalizado | null> {
  try {
    const evento = await getEventoById(id);
    if (!evento) return null;

    return await updateEvento(id, { completado: !evento.completado });
  } catch (error) {
    logError(error, 'eventosService.toggleEventoCompletado');
    throw error;
  }
}

/**
 * Asignar evento a un día
 */
export async function asignarEventoADia(
  eventoId: string,
  diaId: string | null
): Promise<EventoPersonalizado | null> {
  return await updateEvento(eventoId, { diaId });
}

/**
 * Duplicar evento (para otro día)
 */
export async function duplicarEvento(
  eventoId: string,
  nuevoDiaId?: string
): Promise<EventoPersonalizado | null> {
  try {
    const original = await getEventoById(eventoId);
    if (!original) return null;

    return await createEvento({
      viajeId: original.viajeId,
      diaId: nuevoDiaId || original.diaId,
      nombre: original.nombre,
      descripcion: original.descripcion,
      categoria: original.categoria,
      horaInicio: original.horaInicio,
      horaFin: original.horaFin,
      duracionMinutos: original.duracionMinutos,
      ubicacion: original.ubicacion,
      direccion: original.direccion,
      latitud: original.latitud,
      longitud: original.longitud,
      notas: original.notas,
      prioridad: original.prioridad,
    });
  } catch (error) {
    logError(error, 'eventosService.duplicarEvento');
    throw error;
  }
}

/**
 * Contar eventos por viaje
 */
export async function countEventosByViajeId(viajeId: string): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM eventos_personalizados WHERE viajeId = ?',
      [viajeId]
    );
    return result?.count || 0;
  } catch (error) {
    logError(error, 'eventosService.countEventosByViajeId');
    return 0;
  }
}

/**
 * Vincular evento con un lugar
 */
export async function linkEventoToLugar(
  eventoId: string,
  lugarId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE eventos_personalizados SET lugarId = ?, updatedAt = ? WHERE id = ?',
      [lugarId, now, eventoId]
    );

    console.log('[EventosService] Evento vinculado a lugar:', { eventoId, lugarId });
    return true;
  } catch (error) {
    logError(error, 'eventosService.linkEventoToLugar');
    return false;
  }
}

/**
 * Desvincular evento de un lugar
 */
export async function unlinkEventoFromLugar(eventoId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE eventos_personalizados SET lugarId = NULL, updatedAt = ? WHERE id = ?',
      [now, eventoId]
    );

    console.log('[EventosService] Evento desvinculado de lugar:', eventoId);
    return true;
  } catch (error) {
    logError(error, 'eventosService.unlinkEventoFromLugar');
    return false;
  }
}
