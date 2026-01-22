/**
 * RESERVAS SERVICE
 *
 * Servicio para gestión de reservas de viaje.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { Reserva, CreateReservaInput, CategoriaReserva } from '@/types/reserva';
import { createGasto, getGastoByReservaId, updateGasto, deleteGastoByReservaId } from './gastosService';
import { mapReservaToCategoriaGasto } from '@/types/gasto';
import { findOrCreateLugarFromReserva, linkReservaToLugar } from './placeMatchingService';
import type { PlaceMatchResult } from '@/types/placeMatching';
import { getViajeById } from './viajesService';
import {
  scheduleReservaNotification,
  cancelReservaNotifications,
} from './notificationsService';
import { deleteLugar } from './lugaresService';
import { deleteDocumento, getDocumentosByReservaId } from './documentosService';
import { syncReservaIfShared, syncDeleteIfShared } from './sync/syncUpload';
import { createExpense, calculateShares } from './firestore/expensesService';
import { getTripMembers } from './firestore/tripsService';
import type { CreateExpenseInput } from '@/types/shared';

/**
 * Crea una nueva reserva y opcionalmente busca/crea lugar asociado
 */
export async function createReserva(
  input: CreateReservaInput
): Promise<{ reserva: Reserva; placeMatch?: PlaceMatchResult }> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const reserva: Reserva = {
    id: generateId(),
    viajeId: input.viajeId,
    diaId: input.diaId,
    categoria: input.categoria,
    nombre: input.nombre,
    proveedor: input.proveedor,
    numeroConfirmacion: input.numeroConfirmacion,
    fechaInicio: input.fechaInicio,
    horaInicio: input.horaInicio,
    fechaFin: input.fechaFin,
    horaFin: input.horaFin,
    ubicacion: input.ubicacion,
    direccion: input.direccion,
    latitud: input.latitud,
    longitud: input.longitud,
    precio: input.precio,
    moneda: input.moneda || 'EUR',
    estadoPago: input.estadoPago || 'pending',
    paidByUserId: input.paidByUserId,
    splitMethod: input.splitMethod,
    participantUids: input.participantUids,
    shares: input.shares as any, // Se convertirá a JSON al insertar
    notas: input.notas,
    metadatos: input.metadatos,
    lugarId: input.lugarId,
    createdAt: now,
    updatedAt: now,
  };

  // DEBUG: Verificar metadatos antes de stringify
  console.log('[ReservasService] reserva.metadatos antes de guardar:', reserva.metadatos);
  console.log('[ReservasService] Tipo de metadatos:', typeof reserva.metadatos);
  console.log('[ReservasService] Constructor:', reserva.metadatos?.constructor?.name);
  const metadatosStringified = reserva.metadatos ? JSON.stringify(reserva.metadatos) : null;
  console.log('[ReservasService] metadatos después de JSON.stringify:', metadatosStringified);

  await db.runAsync(
    `INSERT INTO reservas (
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, paidByUserId,
      splitMethod, participantUids, shares, notas, metadatos,
      documentoId, lugarId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reserva.id,
      reserva.viajeId,
      reserva.diaId || null,
      reserva.categoria,
      reserva.nombre,
      reserva.proveedor || null,
      reserva.numeroConfirmacion || null,
      reserva.fechaInicio || null,
      reserva.horaInicio || null,
      reserva.fechaFin || null,
      reserva.horaFin || null,
      reserva.ubicacion || null,
      reserva.direccion || null,
      reserva.latitud || null,
      reserva.longitud || null,
      reserva.precio || null,
      reserva.moneda,
      reserva.estadoPago,
      reserva.paidByUserId || null,
      reserva.splitMethod || null,
      reserva.participantUids ? JSON.stringify(reserva.participantUids) : null,
      reserva.shares ? JSON.stringify(reserva.shares) : null,
      reserva.notas || null,
      metadatosStringified,
      input.documentoId || null,
      reserva.lugarId || null,
      reserva.createdAt,
      reserva.updatedAt,
    ]
  );

  console.log('[ReservasService] Reserva creada:', reserva.id);

  // Auto-crear gasto si la reserva tiene precio y está pagada (total o parcial)
  if (
    reserva.precio &&
    reserva.precio > 0 &&
    (reserva.estadoPago === 'paid' || reserva.estadoPago === 'partial')
  ) {
    try {
      const viaje = await getViajeById(reserva.viajeId);
      const categoriaGasto = mapReservaToCategoriaGasto(reserva.categoria);
      const montoGasto = reserva.estadoPago === 'partial' ? reserva.precio / 2 : reserva.precio;

      // Si el viaje es compartido Y tiene datos de reparto, crear gasto compartido en Firestore
      if (viaje?.isShared && viaje.firestoreId && reserva.paidByUserId && reserva.shares && reserva.shares.length > 0) {
        const members = await getTripMembers(viaje.firestoreId);

        // Calcular shares con los montos calculados
        const sharesWithCalculated = calculateShares(
          Math.round(montoGasto * 100), // Convertir a céntimos
          reserva.splitMethod || 'equal',
          reserva.shares
        );

        const expenseInput: CreateExpenseInput = {
          description: reserva.nombre,
          amount: Math.round(montoGasto * 100), // Convertir a céntimos
          currency: reserva.moneda,
          category: categoriaGasto,
          date: reserva.fechaInicio || new Date().toISOString(),
          paidByUid: reserva.paidByUserId,
          splitMethod: reserva.splitMethod || 'equal',
          participantUids: reserva.participantUids || [],
          shares: reserva.shares,
          notes: reserva.notas,
        };

        const tripCurrency = viaje.moneda || 'EUR';
        await createExpense(viaje.firestoreId, expenseInput, members, tripCurrency);
        console.log('[ReservasService] Gasto compartido auto-creado para reserva:', reserva.id);
      } else {
        // Viaje no compartido o sin datos de reparto: crear gasto local normal
        await createGasto({
          viajeId: reserva.viajeId,
          diaId: reserva.diaId,
          reservaId: reserva.id,
          categoria: categoriaGasto,
          descripcion: reserva.nombre,
          monto: montoGasto,
          moneda: reserva.moneda,
          fecha: reserva.fechaInicio || new Date().toISOString(),
        });
        console.log('[ReservasService] Gasto local auto-creado para reserva:', reserva.id);
      }
    } catch (error) {
      console.error('[ReservasService] Error al auto-crear gasto:', error);
    }
  }

  // Auto-buscar/crear lugar si autoCreateLugar no es false y hay información de ubicación
  let placeMatch: PlaceMatchResult | undefined;

  // Para accommodation y food: requiere nombre + dirección
  // Para otras categorías: requiere ubicacion o dirección o coordenadas
  const hasRequiredLocationData =
    (reserva.categoria === 'accommodation' || reserva.categoria === 'food')
      ? reserva.nombre && reserva.direccion
      : input.ubicacion || input.direccion || (input.latitud && input.longitud);

  const shouldAutoCreatePlace =
    input.autoCreateLugar !== false &&
    !input.lugarId && // No buscar si ya tiene lugar asignado manualmente
    hasRequiredLocationData;

  if (shouldAutoCreatePlace) {
    try {
      console.log('[ReservasService] Iniciando búsqueda automática de lugar...');
      placeMatch = await findOrCreateLugarFromReserva(reserva, {
        showConfirmation: false,
        notifyUser: true,
        threshold: 80,
        maxDistanceMeters: 100,
      });

      // Si se encontró/creó lugar con alta confianza, vincular automáticamente
      if (placeMatch.type === 'exact' && placeMatch.lugar) {
        await linkReservaToLugar(reserva.id, placeMatch.lugar.id);
        reserva.lugarId = placeMatch.lugar.id;
        console.log('[ReservasService] Reserva vinculada automáticamente a lugar:', placeMatch.lugar.nombre);
      }
    } catch (error) {
      console.error('[ReservasService] Error en auto-creación de lugar:', error);
      // No fallar la creación de reserva por esto
      placeMatch = undefined;
    }
  }

  // Programar notificación de la reserva (no bloqueante)
  try {
    const viaje = await getViajeById(reserva.viajeId);
    scheduleReservaNotification(reserva, viaje?.destino).catch((error) => {
      console.warn('[ReservasService] Error al programar notificación:', error);
    });
  } catch (error) {
    console.warn('[ReservasService] Error al obtener viaje para notificación:', error);
  }

  // Sincronizar con Firestore si es viaje compartido (no bloqueante)
  syncReservaIfShared(reserva).catch((error) => {
    console.warn('[ReservasService] Error al sincronizar reserva:', error);
  });

  return { reserva, placeMatch };
}

/**
 * Parsea metadatos de forma segura, manejando casos edge
 */
function parseMetadatos(metadatos: any): any {
  if (!metadatos) return undefined;

  // Si ya es un objeto, retornarlo directamente
  if (typeof metadatos === 'object') return metadatos;

  // Si es string, intentar parsearlo
  if (typeof metadatos === 'string') {
    // Ignorar strings literales "null" o "undefined"
    if (metadatos === 'null' || metadatos === 'undefined' || metadatos.trim() === '') {
      return undefined;
    }

    try {
      return JSON.parse(metadatos);
    } catch (error) {
      console.warn('[ReservasService] Error parseando metadatos:', metadatos, error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Parsea campos JSON de forma segura (participantUids, shares)
 */
function parseJSONField(field: any): any {
  if (!field) return undefined;
  if (typeof field === 'object') return field;
  if (typeof field === 'string') {
    if (field === 'null' || field === 'undefined' || field.trim() === '') {
      return undefined;
    }
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn('[ReservasService] Error parseando campo JSON:', field, error);
      return undefined;
    }
  }
  return undefined;
}

/**
 * Obtiene todas las reservas de un viaje
 */
export async function getReservasByViajeId(viajeId: string): Promise<Reserva[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Reserva>(
    `SELECT
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, paidByUserId,
      splitMethod,
      CAST(participantUids AS TEXT) as participantUids,
      CAST(shares AS TEXT) as shares,
      notas,
      CAST(metadatos AS TEXT) as metadatos,
      documentoId, lugarId, createdAt, updatedAt
    FROM reservas
    WHERE viajeId = ?
    ORDER BY fechaInicio ASC, horaInicio ASC`,
    [viajeId]
  );

  return rows.map((row) => ({
    ...row,
    metadatos: parseMetadatos(row.metadatos),
    participantUids: parseJSONField(row.participantUids),
    shares: parseJSONField(row.shares),
  }));
}

/**
 * Obtiene reservas de un viaje filtradas por categoría
 */
export async function getReservasByCategoria(
  viajeId: string,
  categoria: CategoriaReserva
): Promise<Reserva[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Reserva>(
    `SELECT
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, paidByUserId,
      splitMethod,
      CAST(participantUids AS TEXT) as participantUids,
      CAST(shares AS TEXT) as shares,
      notas,
      CAST(metadatos AS TEXT) as metadatos,
      documentoId, lugarId, createdAt, updatedAt
    FROM reservas
    WHERE viajeId = ? AND categoria = ?
    ORDER BY fechaInicio ASC, horaInicio ASC`,
    [viajeId, categoria]
  );

  return rows.map((row) => ({
    ...row,
    metadatos: parseMetadatos(row.metadatos),
    participantUids: parseJSONField(row.participantUids),
    shares: parseJSONField(row.shares),
  }));
}

/**
 * Obtiene una reserva por ID
 */
export async function getReservaById(id: string): Promise<Reserva | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Reserva>(
    `SELECT
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, paidByUserId,
      splitMethod,
      CAST(participantUids AS TEXT) as participantUids,
      CAST(shares AS TEXT) as shares,
      notas,
      CAST(metadatos AS TEXT) as metadatos,
      documentoId, lugarId, createdAt, updatedAt
    FROM reservas WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return {
    ...row,
    metadatos: parseMetadatos(row.metadatos),
    participantUids: parseJSONField(row.participantUids),
    shares: parseJSONField(row.shares),
  };
}

/**
 * Actualiza una reserva
 */
export async function updateReserva(
  id: string,
  input: Partial<CreateReservaInput>
): Promise<Reserva | null> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const fields: string[] = [];
  const values: any[] = [];

  if (input.categoria !== undefined) {
    fields.push('categoria = ?');
    values.push(input.categoria);
  }
  if (input.nombre !== undefined) {
    fields.push('nombre = ?');
    values.push(input.nombre);
  }
  if (input.proveedor !== undefined) {
    fields.push('proveedor = ?');
    values.push(input.proveedor);
  }
  if (input.numeroConfirmacion !== undefined) {
    fields.push('numeroConfirmacion = ?');
    values.push(input.numeroConfirmacion);
  }
  if (input.fechaInicio !== undefined) {
    fields.push('fechaInicio = ?');
    values.push(input.fechaInicio);
  }
  if (input.horaInicio !== undefined) {
    fields.push('horaInicio = ?');
    values.push(input.horaInicio);
  }
  if (input.fechaFin !== undefined) {
    fields.push('fechaFin = ?');
    values.push(input.fechaFin);
  }
  if (input.horaFin !== undefined) {
    fields.push('horaFin = ?');
    values.push(input.horaFin);
  }
  if (input.ubicacion !== undefined) {
    fields.push('ubicacion = ?');
    values.push(input.ubicacion);
  }
  if (input.direccion !== undefined) {
    fields.push('direccion = ?');
    values.push(input.direccion);
  }
  if (input.latitud !== undefined) {
    fields.push('latitud = ?');
    values.push(input.latitud);
  }
  if (input.longitud !== undefined) {
    fields.push('longitud = ?');
    values.push(input.longitud);
  }
  if (input.precio !== undefined) {
    fields.push('precio = ?');
    values.push(input.precio);
  }
  if (input.moneda !== undefined) {
    fields.push('moneda = ?');
    values.push(input.moneda);
  }
  if (input.estadoPago !== undefined) {
    fields.push('estadoPago = ?');
    values.push(input.estadoPago);
  }
  if (input.paidByUserId !== undefined) {
    fields.push('paidByUserId = ?');
    values.push(input.paidByUserId);
  }
  if (input.splitMethod !== undefined) {
    fields.push('splitMethod = ?');
    values.push(input.splitMethod);
  }
  if (input.participantUids !== undefined) {
    fields.push('participantUids = ?');
    values.push(JSON.stringify(input.participantUids));
  }
  if (input.shares !== undefined) {
    fields.push('shares = ?');
    values.push(JSON.stringify(input.shares));
  }
  if (input.notas !== undefined) {
    fields.push('notas = ?');
    values.push(input.notas);
  }
  if (input.metadatos !== undefined) {
    fields.push('metadatos = ?');
    values.push(JSON.stringify(input.metadatos));
  }
  if (input.diaId !== undefined) {
    fields.push('diaId = ?');
    values.push(input.diaId);
  }
  if (input.documentoId !== undefined) {
    fields.push('documentoId = ?');
    values.push(input.documentoId);
  }
  if (input.lugarId !== undefined) {
    fields.push('lugarId = ?');
    values.push(input.lugarId);
  }

  fields.push('updatedAt = ?');
  values.push(now);

  values.push(id);

  await db.runAsync(
    `UPDATE reservas SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  console.log('[ReservasService] Reserva actualizada:', id);

  // Sincronizar gasto asociado si cambió precio o estadoPago
  if (input.precio !== undefined || input.estadoPago !== undefined || input.moneda !== undefined || input.nombre !== undefined) {
    try {
      const reservaActualizada = await getReservaById(id);
      if (!reservaActualizada) return null;

      const gastoExistente = await getGastoByReservaId(id);

      // Si la reserva tiene precio y está pagada
      if (
        reservaActualizada.precio &&
        reservaActualizada.precio > 0 &&
        (reservaActualizada.estadoPago === 'paid' || reservaActualizada.estadoPago === 'partial')
      ) {
        const categoriaGasto = mapReservaToCategoriaGasto(reservaActualizada.categoria);
        const montoGasto = reservaActualizada.estadoPago === 'partial'
          ? reservaActualizada.precio / 2
          : reservaActualizada.precio;

        if (gastoExistente) {
          // Actualizar gasto existente
          await updateGasto(gastoExistente.id, {
            categoria: categoriaGasto,
            descripcion: reservaActualizada.nombre,
            monto: montoGasto,
            moneda: reservaActualizada.moneda,
            fecha: reservaActualizada.fechaInicio || gastoExistente.fecha,
          });
          console.log('[ReservasService] Gasto sincronizado para reserva:', id);
        } else {
          // Crear gasto si no existía
          await createGasto({
            viajeId: reservaActualizada.viajeId,
            diaId: reservaActualizada.diaId,
            reservaId: reservaActualizada.id,
            categoria: categoriaGasto,
            descripcion: reservaActualizada.nombre,
            monto: montoGasto,
            moneda: reservaActualizada.moneda,
            fecha: reservaActualizada.fechaInicio || new Date().toISOString(),
          });
          console.log('[ReservasService] Gasto auto-creado para reserva actualizada:', id);
        }
      } else if (gastoExistente && reservaActualizada.estadoPago === 'pending') {
        // Si cambió a pending, eliminar el gasto
        await deleteGastoByReservaId(id);
        console.log('[ReservasService] Gasto eliminado (reserva pendiente):', id);
      }
    } catch (error) {
      console.error('[ReservasService] Error al sincronizar gasto:', error);
      // No lanzamos error para no bloquear la actualización
    }
  }

  // Reprogramar notificación si cambió la fecha/hora
  if (input.fechaInicio !== undefined || input.horaInicio !== undefined) {
    try {
      const reservaActualizada = await getReservaById(id);
      if (reservaActualizada) {
        const viaje = await getViajeById(reservaActualizada.viajeId);
        scheduleReservaNotification(reservaActualizada, viaje?.destino).catch((error) => {
          console.warn('[ReservasService] Error al reprogramar notificación:', error);
        });
      }
    } catch (error) {
      console.warn('[ReservasService] Error al reprogramar notificación:', error);
    }
  }

  // Sincronizar con Firestore si es viaje compartido (no bloqueante)
  const reservaActualizadaParaSync = await getReservaById(id);
  if (reservaActualizadaParaSync) {
    syncReservaIfShared(reservaActualizadaParaSync).catch((error) => {
      console.warn('[ReservasService] Error al sincronizar reserva actualizada:', error);
    });
  }

  return reservaActualizadaParaSync;
}

/**
 * Elimina una reserva y sus recursos asociados en cascada:
 * - Documentos asociados (desde tabla intermedia)
 * - Lugar asociado (si existe y es exclusivo)
 * - Gasto asociado (si existe)
 * - Notificaciones programadas
 */
export async function deleteReserva(id: string): Promise<boolean> {
  const db = await getDatabase();

  // 1. Obtener la reserva completa antes de eliminarla
  const reserva = await getReservaById(id);
  if (!reserva) {
    console.warn('[ReservasService] Reserva no encontrada:', id);
    return false;
  }

  // 2. Cancelar notificaciones de la reserva
  await cancelReservaNotifications(id).catch((error) => {
    console.warn('[ReservasService] Error al cancelar notificaciones:', error);
  });

  // 3. Eliminar documentos asociados desde tabla intermedia
  try {
    const documentos = await getDocumentosByReservaId(id);

    for (const documento of documentos) {
      // Verificar si el documento está siendo usado por otras reservas
      const otrasReservasConDocumento = await db.getAllAsync<{ id: string }>(
        `SELECT DISTINCT r.id
         FROM reservas r
         INNER JOIN reservas_documentos rd ON r.id = rd.reservaId
         WHERE rd.documentoId = ? AND r.id != ?`,
        [documento.id, id]
      );

      // Solo eliminar si es exclusivo de esta reserva
      if (otrasReservasConDocumento.length === 0) {
        await deleteDocumento(documento.id);
        console.log('[ReservasService] Documento eliminado en cascada:', documento.id);
      } else {
        console.log('[ReservasService] Documento compartido con otras reservas, no se elimina:', documento.id);
      }
    }
  } catch (error) {
    console.error('[ReservasService] Error al eliminar documentos asociados:', error);
  }

  // 4. Eliminar lugar asociado si existe
  if (reserva.lugarId) {
    try {
      // Verificar si el lugar está siendo usado por otras reservas o eventos
      const [otrasReservas, eventosConLugar] = await Promise.all([
        db.getAllAsync<{ id: string }>(
          'SELECT id FROM reservas WHERE lugarId = ? AND id != ?',
          [reserva.lugarId, id]
        ),
        db.getAllAsync<{ id: string }>(
          'SELECT id FROM eventos_personalizados WHERE lugarId = ?',
          [reserva.lugarId]
        ),
      ]);

      // Solo eliminar si es exclusivo de esta reserva
      if (otrasReservas.length === 0 && eventosConLugar.length === 0) {
        await deleteLugar(reserva.lugarId);
        console.log('[ReservasService] Lugar eliminado en cascada:', reserva.lugarId);
      } else {
        console.log('[ReservasService] Lugar compartido, no se elimina:', reserva.lugarId);
      }
    } catch (error) {
      console.error('[ReservasService] Error al eliminar lugar asociado:', error);
    }
  }

  // 5. Eliminar gasto asociado (si existe)
  // La foreign key con CASCADE lo hará automáticamente, pero lo hacemos explícito por claridad
  try {
    await deleteGastoByReservaId(id);
  } catch (error) {
    console.error('[ReservasService] Error al eliminar gasto asociado:', error);
  }

  // 6. Sincronizar eliminación con Firestore si es viaje compartido (antes de eliminar)
  if (reserva.firestoreId) {
    syncDeleteIfShared(reserva.viajeId, 'reservations', reserva.firestoreId).catch((error) => {
      console.warn('[ReservasService] Error al sincronizar eliminación:', error);
    });
  }

  // 7. Finalmente, eliminar la reserva
  await db.runAsync('DELETE FROM reservas WHERE id = ?', [id]);

  console.log('[ReservasService] Reserva eliminada con cascada completa:', id);
  return true;
}

/**
 * Obtiene el número de reservas confirmadas (pagadas) de un viaje
 */
export async function getReservasConfirmadas(viajeId: string): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM reservas
     WHERE viajeId = ? AND estadoPago = 'paid'`,
    [viajeId]
  );

  return result?.count || 0;
}

/**
 * Obtiene el documento asociado a una reserva (si existe)
 */
export async function getDocumentoByReservaId(reservaId: string) {
  const db = await getDatabase();

  const reserva = await getReservaById(reservaId);
  if (!reserva?.documentoId) {
    return null;
  }

  const result = await db.getFirstAsync(
    'SELECT * FROM documentos WHERE id = ?',
    [reserva.documentoId]
  );

  return result || null;
}

/**
 * Elimina la asociación de documento de una reserva
 */
export async function removeDocumentoFromReserva(reservaId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE reservas SET documentoId = NULL, updatedAt = ? WHERE id = ?',
      [timestamp, reservaId]
    );

    return true;
  } catch (error) {
    console.error('[reservasService] Error al eliminar documento de reserva:', error);
    return false;
  }
}

/**
 * Encuentra todas las reservas asociadas a un documento
 */
export async function getReservasByDocumentoId(documentoId: string): Promise<string[]> {
  try {
    const db = await getDatabase();
    const results = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM reservas WHERE documentoId = ?',
      [documentoId]
    );

    return results.map(r => r.id);
  } catch (error) {
    console.error('[reservasService] Error al obtener reservas por documento:', error);
    return [];
  }
}
