/**
 * SERVICIO DE CONVERSACIONES DEL ASISTENTE
 *
 * CRUD para gestionar el historial de conversaciones del asistente IA.
 * Permite guardar, cargar, reanudar y borrar conversaciones.
 */

import { getDatabase } from '@/database/database';
import type { ConversacionGuardada, MensajeChat, ContextoViaje } from '@/types/asistente';

// ============================================
// CREAR CONVERSACIÓN
// ============================================

export async function saveConversacion(
  mensajes: MensajeChat[],
  contexto?: ContextoViaje
): Promise<string> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    // Generar título a partir del primer mensaje del usuario
    const primerMensajeUsuario = mensajes.find(m => m.role === 'user');
    const titulo = primerMensajeUsuario
      ? primerMensajeUsuario.content.substring(0, 50) + (primerMensajeUsuario.content.length > 50 ? '...' : '')
      : 'Nueva conversación';

    const mensajesJson = JSON.stringify(mensajes);
    const contextoJson = contexto ? JSON.stringify(contexto) : null;
    const viajeId = contexto?.viajeId || null;

    await db.runAsync(
      `INSERT INTO conversaciones (id, viajeId, titulo, mensajesJson, contextoJson, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, viajeId, titulo, mensajesJson, contextoJson, now, now]
    );

    console.log('[ConversacionesService] Conversación guardada:', id);
    return id;
  } catch (error) {
    console.error('[ConversacionesService] Error guardando conversación:', error);
    throw error;
  }
}

// ============================================
// ACTUALIZAR CONVERSACIÓN
// ============================================

export async function updateConversacion(
  id: string,
  mensajes: MensajeChat[],
  contexto?: ContextoViaje
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const mensajesJson = JSON.stringify(mensajes);
    const contextoJson = contexto ? JSON.stringify(contexto) : null;

    await db.runAsync(
      `UPDATE conversaciones
       SET mensajesJson = ?, contextoJson = ?, updatedAt = ?
       WHERE id = ?`,
      [mensajesJson, contextoJson, now, id]
    );

    console.log('[ConversacionesService] Conversación actualizada:', id);
  } catch (error) {
    console.error('[ConversacionesService] Error actualizando conversación:', error);
    throw error;
  }
}

// ============================================
// OBTENER CONVERSACIONES
// ============================================

/**
 * Obtiene todas las conversaciones, ordenadas por fecha de actualización
 */
export async function getAllConversaciones(): Promise<ConversacionGuardada[]> {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync<ConversacionGuardada>(
      `SELECT * FROM conversaciones
       ORDER BY updatedAt DESC`
    );

    return rows || [];
  } catch (error) {
    console.error('[ConversacionesService] Error obteniendo conversaciones:', error);
    return [];
  }
}

/**
 * Obtiene conversaciones de un viaje específico
 */
export async function getConversacionesByViajeId(viajeId: string): Promise<ConversacionGuardada[]> {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync<ConversacionGuardada>(
      `SELECT * FROM conversaciones
       WHERE viajeId = ?
       ORDER BY updatedAt DESC`,
      [viajeId]
    );

    return rows || [];
  } catch (error) {
    console.error('[ConversacionesService] Error obteniendo conversaciones del viaje:', error);
    return [];
  }
}

/**
 * Obtiene conversaciones generales (sin viaje asociado)
 */
export async function getConversacionesGenerales(): Promise<ConversacionGuardada[]> {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync<ConversacionGuardada>(
      `SELECT * FROM conversaciones
       WHERE viajeId IS NULL
       ORDER BY updatedAt DESC`
    );

    return rows || [];
  } catch (error) {
    console.error('[ConversacionesService] Error obteniendo conversaciones generales:', error);
    return [];
  }
}

/**
 * Obtiene una conversación por ID
 */
export async function getConversacionById(id: string): Promise<ConversacionGuardada | null> {
  try {
    const db = await getDatabase();

    const row = await db.getFirstAsync<ConversacionGuardada>(
      'SELECT * FROM conversaciones WHERE id = ?',
      [id]
    );

    return row || null;
  } catch (error) {
    console.error('[ConversacionesService] Error obteniendo conversación:', error);
    return null;
  }
}

// ============================================
// ELIMINAR CONVERSACIÓN
// ============================================

export async function deleteConversacion(id: string): Promise<void> {
  try {
    const db = await getDatabase();

    await db.runAsync('DELETE FROM conversaciones WHERE id = ?', [id]);

    console.log('[ConversacionesService] Conversación eliminada:', id);
  } catch (error) {
    console.error('[ConversacionesService] Error eliminando conversación:', error);
    throw error;
  }
}

/**
 * Elimina todas las conversaciones de un viaje
 */
export async function deleteConversacionesByViajeId(viajeId: string): Promise<void> {
  try {
    const db = await getDatabase();

    await db.runAsync('DELETE FROM conversaciones WHERE viajeId = ?', [viajeId]);

    console.log('[ConversacionesService] Conversaciones del viaje eliminadas:', viajeId);
  } catch (error) {
    console.error('[ConversacionesService] Error eliminando conversaciones del viaje:', error);
    throw error;
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Parsea los mensajes de una conversación guardada
 */
export function parseMensajes(conversacion: ConversacionGuardada): MensajeChat[] {
  try {
    return JSON.parse(conversacion.mensajesJson);
  } catch (error) {
    console.error('[ConversacionesService] Error parseando mensajes:', error);
    return [];
  }
}

/**
 * Parsea el contexto de una conversación guardada
 */
export function parseContexto(conversacion: ConversacionGuardada): ContextoViaje | undefined {
  if (!conversacion.contextoJson) return undefined;

  try {
    return JSON.parse(conversacion.contextoJson);
  } catch (error) {
    console.error('[ConversacionesService] Error parseando contexto:', error);
    return undefined;
  }
}

/**
 * Genera un ID único para la conversación
 */
function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
