/**
 * RESERVAS SERVICE
 *
 * Servicio para gestión de reservas de viaje.
 */

import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { Reserva, CreateReservaInput, CategoriaReserva } from '@/types/reserva';

/**
 * Crea una nueva reserva
 */
export async function createReserva(input: CreateReservaInput): Promise<Reserva> {
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
    notas: input.notas,
    metadatos: input.metadatos,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO reservas (
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, notas, metadatos,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      reserva.notas || null,
      reserva.metadatos ? JSON.stringify(reserva.metadatos) : null,
      reserva.createdAt,
      reserva.updatedAt,
    ]
  );

  console.log('[ReservasService] Reserva creada:', reserva.id);
  return reserva;
}

/**
 * Obtiene todas las reservas de un viaje
 */
export async function getReservasByViajeId(viajeId: string): Promise<Reserva[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Reserva>(
    `SELECT * FROM reservas
     WHERE viajeId = ?
     ORDER BY fechaInicio ASC, horaInicio ASC`,
    [viajeId]
  );

  return rows.map((row) => ({
    ...row,
    metadatos: row.metadatos ? JSON.parse(row.metadatos as unknown as string) : undefined,
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
    `SELECT * FROM reservas
     WHERE viajeId = ? AND categoria = ?
     ORDER BY fechaInicio ASC, horaInicio ASC`,
    [viajeId, categoria]
  );

  return rows.map((row) => ({
    ...row,
    metadatos: row.metadatos ? JSON.parse(row.metadatos as unknown as string) : undefined,
  }));
}

/**
 * Obtiene una reserva por ID
 */
export async function getReservaById(id: string): Promise<Reserva | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Reserva>(
    'SELECT * FROM reservas WHERE id = ?',
    [id]
  );

  if (!row) return null;

  return {
    ...row,
    metadatos: row.metadatos ? JSON.parse(row.metadatos as unknown as string) : undefined,
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

  fields.push('updatedAt = ?');
  values.push(now);

  values.push(id);

  await db.runAsync(
    `UPDATE reservas SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  console.log('[ReservasService] Reserva actualizada:', id);
  return getReservaById(id);
}

/**
 * Elimina una reserva
 */
export async function deleteReserva(id: string): Promise<boolean> {
  const db = await getDatabase();

  await db.runAsync('DELETE FROM reservas WHERE id = ?', [id]);

  console.log('[ReservasService] Reserva eliminada:', id);
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
