/**
 * MIGRATE TRIP TO FIRESTORE
 *
 * Servicio completo para migrar un viaje de SQLite a Firestore
 * cuando el usuario decide compartirlo.
 */

import { auth, db as firestoreDb } from '@/config/firebase';
import { collection, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getViajeById, markViajeAsShared } from '@/services/viajesService';
import { getReservasByViajeId } from '@/services/reservasService';
import { getLugaresByViajeId } from '@/services/lugaresService';
import { getGastosByViajeId } from '@/services/gastosService';
import { getEventosByViajeId } from '@/services/eventosService';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { createSharedTrip, getSharedTrip, addMemberToTrip } from '@/services/firestore/tripsService';
import { generateId } from '@/database';
import { logError } from '@/utils/errorHandler';
import type { Viaje } from '@/types/viaje';
import type { Reserva } from '@/types/reserva';
import type { Lugar } from '@/types/lugar';
import type { Gasto } from '@/types/gasto';
import type { EventoPersonalizado } from '@/types/evento';
import type { SharedTrip, TripMember, CreateExpenseInput, displayToCents } from '@/types/shared';

// ============================================
// TIPOS
// ============================================

export interface MigrationProgress {
  phase: 'preparing' | 'trip' | 'reservations' | 'places' | 'events' | 'expenses' | 'finalizing' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface MigrationResult {
  success: boolean;
  firestoreId: string | null;
  stats: {
    reservations: { migrated: number; total: number };
    places: { migrated: number; total: number };
    events: { migrated: number; total: number };
    expenses: { migrated: number; total: number };
  };
  errors: string[];
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Migra un viaje completo de SQLite a Firestore
 * Incluye: viaje, reservas, lugares y gastos
 */
export async function migrateTripToFirestore(
  viajeId: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    firestoreId: null,
    stats: {
      reservations: { migrated: 0, total: 0 },
      places: { migrated: 0, total: 0 },
      events: { migrated: 0, total: 0 },
      expenses: { migrated: 0, total: 0 },
    },
    errors: [],
  };

  try {
    // 1. Verificar usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      result.errors.push('Usuario no autenticado');
      onProgress?.({ phase: 'error', current: 0, total: 0, message: 'Usuario no autenticado' });
      return result;
    }

    onProgress?.({ phase: 'preparing', current: 0, total: 5, message: 'Preparando migración...' });

    // 2. Obtener viaje local
    const viaje = await getViajeById(viajeId);
    if (!viaje) {
      result.errors.push('Viaje no encontrado');
      onProgress?.({ phase: 'error', current: 0, total: 0, message: 'Viaje no encontrado' });
      return result;
    }

    // 3. Verificar que no esté ya compartido
    if (viaje.isShared === 1 && viaje.firestoreId) {
      result.firestoreId = viaje.firestoreId;
      result.success = true;
      onProgress?.({ phase: 'completed', current: 4, total: 4, message: 'El viaje ya está compartido' });
      return result;
    }

    // 4. Cargar datos locales
    const [reservas, lugares, eventos, gastos] = await Promise.all([
      getReservasByViajeId(viajeId),
      getLugaresByViajeId(viajeId),
      getEventosByViajeId(viajeId),
      getGastosByViajeId(viajeId),
    ]);

    result.stats.reservations.total = reservas.length;
    result.stats.places.total = lugares.length;
    result.stats.events.total = eventos.length;
    result.stats.expenses.total = gastos.length;

    // 5. Crear viaje en Firestore
    onProgress?.({ phase: 'trip', current: 1, total: 5, message: 'Creando viaje compartido...' });

    const sharedTrip = await createSharedTrip({
      name: viaje.destino,
      description: viaje.descripcion || '',
      destination: viaje.destino,
      startDate: viaje.fechaInicio,
      endDate: viaje.fechaFin,
      currency: viaje.moneda || 'EUR',
    });

    if (!sharedTrip) {
      result.errors.push('Error al crear viaje en Firestore');
      onProgress?.({ phase: 'error', current: 0, total: 0, message: 'Error al crear viaje' });
      return result;
    }

    result.firestoreId = sharedTrip.id;

    // 6. Actualizar imagen del viaje si existe
    if (viaje.imagenUrl) {
      try {
        const tripRef = doc(firestoreDb, 'trips', sharedTrip.id);
        await setDoc(tripRef, { coverImage: viaje.imagenUrl }, { merge: true });
      } catch (e) {
        console.warn('[Migration] No se pudo actualizar la imagen:', e);
      }
    }

    // 7. Migrar reservas
    onProgress?.({ phase: 'reservations', current: 2, total: 5, message: `Migrando reservas (0/${reservas.length})...` });

    for (let i = 0; i < reservas.length; i++) {
      try {
        await migrateReserva(sharedTrip.id, reservas[i]);
        result.stats.reservations.migrated++;
        onProgress?.({
          phase: 'reservations',
          current: 2,
          total: 5,
          message: `Migrando reservas (${i + 1}/${reservas.length})...`,
        });
      } catch (e: any) {
        console.error('[Migration] Error migrando reserva:', reservas[i].nombre, e);
        result.errors.push(`Reserva "${reservas[i].nombre}": ${e.message}`);
      }
    }

    // Cargar días para mapear diaId -> fecha (se usa tanto para lugares como para eventos)
    const dias = await getDiasByViajeId(viajeId);
    const diaIdToFechaMap = new Map<string, string>();
    for (const dia of dias) {
      diaIdToFechaMap.set(dia.id, dia.fecha);
    }

    // 8. Migrar lugares
    onProgress?.({ phase: 'places', current: 3, total: 5, message: `Migrando lugares (0/${lugares.length})...` });

    for (let i = 0; i < lugares.length; i++) {
      try {
        await migrateLugar(sharedTrip.id, lugares[i], diaIdToFechaMap);
        result.stats.places.migrated++;
        onProgress?.({
          phase: 'places',
          current: 3,
          total: 5,
          message: `Migrando lugares (${i + 1}/${lugares.length})...`,
        });
      } catch (e: any) {
        result.errors.push(`Lugar "${lugares[i].nombre}": ${e.message}`);
      }
    }

    // 9. Migrar eventos personalizados
    onProgress?.({ phase: 'events', current: 4, total: 5, message: `Migrando eventos (0/${eventos.length})...` })

    for (let i = 0; i < eventos.length; i++) {
      try {
        await migrateEvento(sharedTrip.id, eventos[i], diaIdToFechaMap);
        result.stats.events.migrated++;
        onProgress?.({
          phase: 'events',
          current: 4,
          total: 5,
          message: `Migrando eventos (${i + 1}/${eventos.length})...`,
        });
      } catch (e: any) {
        result.errors.push(`Evento "${eventos[i].nombre}": ${e.message}`);
      }
    }

    // 10. Migrar gastos
    onProgress?.({ phase: 'expenses', current: 4, total: 5, message: `Migrando gastos (0/${gastos.length})...` });

    const currentMember: TripMember = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      invitedBy: user.uid,
      updatedAt: new Date(),
    };

    for (let i = 0; i < gastos.length; i++) {
      try {
        await migrateGasto(sharedTrip.id, gastos[i], currentMember);
        result.stats.expenses.migrated++;
        onProgress?.({
          phase: 'expenses',
          current: 4,
          total: 5,
          message: `Migrando gastos (${i + 1}/${gastos.length})...`,
        });
      } catch (e: any) {
        result.errors.push(`Gasto "${gastos[i].descripcion}": ${e.message}`);
      }
    }

    // 11. Marcar viaje local como compartido
    onProgress?.({ phase: 'finalizing', current: 5, total: 5, message: 'Finalizando...' });

    await markViajeAsShared(viajeId, sharedTrip.id);

    result.success = true;
    onProgress?.({ phase: 'completed', current: 5, total: 5, message: 'Migración completada' });

    console.log('[Migration] Viaje migrado exitosamente:', {
      localId: viajeId,
      firestoreId: sharedTrip.id,
      stats: result.stats,
      errors: result.errors.length > 0 ? result.errors : 'ninguno',
    });

    return result;
  } catch (error: any) {
    logError(error, 'migrateTripToFirestore');
    result.errors.push(error.message);
    onProgress?.({ phase: 'error', current: 0, total: 0, message: error.message });
    return result;
  }
}

// ============================================
// FUNCIONES DE MIGRACIÓN DE ENTIDADES
// ============================================

/**
 * Migra una reserva a Firestore
 */
async function migrateReserva(tripId: string, reserva: Reserva): Promise<void> {
  const reservaRef = doc(firestoreDb, 'trips', tripId, 'reservations', reserva.id);

  await setDoc(reservaRef, {
    // Datos básicos
    categoria: reserva.categoria,
    nombre: reserva.nombre,
    proveedor: reserva.proveedor || null,
    numeroConfirmacion: reserva.numeroConfirmacion || null,

    // Fechas y horas
    fechaInicio: reserva.fechaInicio || null,
    horaInicio: reserva.horaInicio || null,
    fechaFin: reserva.fechaFin || null,
    horaFin: reserva.horaFin || null,

    // Ubicación
    ubicacion: reserva.ubicacion || null,
    direccion: reserva.direccion || null,
    latitud: reserva.latitud || null,
    longitud: reserva.longitud || null,

    // Precio
    precio: reserva.precio || null,
    moneda: reserva.moneda || 'EUR',
    estadoPago: reserva.estadoPago || 'pending',

    // Otros
    notas: reserva.notas || null,
    metadatos: reserva.metadatos || null,

    // Referencias (se mantienen para mapeo)
    localId: reserva.id,
    lugarId: reserva.lugarId || null,

    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
}

/**
 * Migra un lugar a Firestore
 */
async function migrateLugar(
  tripId: string,
  lugar: Lugar,
  diaIdToFechaMap: Map<string, string>
): Promise<void> {
  const lugarRef = doc(firestoreDb, 'trips', tripId, 'places', lugar.id);

  // Convertir diaId (ID del día) a fecha para que sea compatible entre usuarios
  let diaId: string | null = null;
  if (lugar.diaId) {
    diaId = diaIdToFechaMap.get(lugar.diaId) || null;
  }

  await setDoc(lugarRef, {
    nombre: lugar.nombre,
    descripcion: lugar.descripcion || null,
    categoria: lugar.categoria || null,
    direccion: lugar.direccion || null,
    latitud: lugar.latitud || null,
    longitud: lugar.longitud || null,
    googlePlaceId: lugar.googlePlaceId || null,
    orden: lugar.orden || 0,
    visitado: Boolean(lugar.visitado),

    // Referencias
    localId: lugar.id,
    diaId: diaId,  // Guardamos la FECHA del día, no el ID

    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
}

/**
 * Migra un evento personalizado a Firestore
 */
async function migrateEvento(
  tripId: string,
  evento: EventoPersonalizado,
  diaIdToFechaMap: Map<string, string>
): Promise<void> {
  const eventoRef = doc(firestoreDb, 'trips', tripId, 'events', evento.id);

  // Convertir diaId (ID del día) a fecha para que sea compatible entre usuarios
  let diaId: string | null = null;
  if (evento.diaId) {
    diaId = diaIdToFechaMap.get(evento.diaId) || null;
    console.log('[Migration] Mapeando diaId de evento:', {
      eventoNombre: evento.nombre,
      diaIdOriginal: evento.diaId,
      fechaMapeada: diaId,
    });
  }

  await setDoc(eventoRef, {
    nombre: evento.nombre,
    descripcion: evento.descripcion || null,
    categoria: evento.categoria,
    horaInicio: evento.horaInicio || null,
    horaFin: evento.horaFin || null,
    duracionMinutos: evento.duracionMinutos || null,
    ubicacion: evento.ubicacion || null,
    direccion: evento.direccion || null,
    latitud: evento.latitud || null,
    longitud: evento.longitud || null,
    completado: Boolean(evento.completado),
    prioridad: evento.prioridad || 'media',
    notas: evento.notas || null,

    // Referencias
    localId: evento.id,
    diaId: diaId,  // Guardamos la FECHA del día, no el ID
    lugarId: evento.lugarId || null,

    // Auditoría
    createdBy: auth.currentUser?.uid || '',
    updatedBy: auth.currentUser?.uid || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
}

/**
 * Migra un gasto a Firestore con formato de SharedExpense
 */
async function migrateGasto(
  tripId: string,
  gasto: Gasto,
  member: TripMember
): Promise<void> {
  const gastoRef = doc(firestoreDb, 'trips', tripId, 'expenses', gasto.id);

  // Convertir monto a céntimos
  const amountInCents = Math.round(gasto.monto * 100);

  await setDoc(gastoRef, {
    description: gasto.descripcion,
    amount: amountInCents,
    currency: gasto.moneda || 'EUR',
    category: gasto.categoria,
    date: gasto.fecha,

    // Pagador (el usuario actual, ya que era un gasto individual)
    paidByUid: member.uid,
    paidByName: member.displayName,

    // Reparto igualitario entre 1 persona
    splitMethod: 'equal',
    participantUids: [member.uid],
    shares: [{
      uid: member.uid,
      displayName: member.displayName,
      value: 1,
      calculatedAmount: amountInCents,
    }],

    // Referencias
    localId: gasto.id,
    reservaId: gasto.reservaId || null,
    receiptUrl: null,
    notes: null,

    // Auditoría
    createdBy: member.uid,
    updatedBy: member.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica si un viaje puede ser compartido
 * (usuario autenticado, viaje existe, no está ya compartido)
 */
export async function canShareTrip(viajeId: string): Promise<{
  canShare: boolean;
  reason?: string;
}> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { canShare: false, reason: 'Debes iniciar sesión para compartir viajes' };
    }

    const viaje = await getViajeById(viajeId);
    if (!viaje) {
      return { canShare: false, reason: 'Viaje no encontrado' };
    }

    if (viaje.isShared === 1) {
      return { canShare: false, reason: 'Este viaje ya está compartido' };
    }

    return { canShare: true };
  } catch (error) {
    logError(error, 'canShareTrip');
    return { canShare: false, reason: 'Error al verificar el viaje' };
  }
}

/**
 * Obtiene estadísticas de lo que se va a migrar
 */
export async function getMigrationPreview(viajeId: string): Promise<{
  reservations: number;
  places: number;
  expenses: number;
}> {
  try {
    const [reservas, lugares, gastos] = await Promise.all([
      getReservasByViajeId(viajeId),
      getLugaresByViajeId(viajeId),
      getGastosByViajeId(viajeId),
    ]);

    return {
      reservations: reservas.length,
      places: lugares.length,
      expenses: gastos.length,
    };
  } catch (error) {
    logError(error, 'getMigrationPreview');
    return { reservations: 0, places: 0, expenses: 0 };
  }
}
