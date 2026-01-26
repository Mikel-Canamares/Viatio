/**
 * SYNC DOWNLOAD SERVICE
 *
 * Servicio para descargar viajes compartidos de Firestore a SQLite local.
 * Se usa cuando un usuario se une a un viaje compartido.
 */

import { db as firestoreDb, auth } from '@/config/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Directory, File, Paths } from 'expo-file-system/next';
import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { createDiasParaViaje, getDiasByViajeId } from '@/services/diasViajeService';
import { logError } from '@/utils/errorHandler';
import { downloadDocument } from '@/services/firestore/documentsService';
import type { Viaje } from '@/types/viaje';
import type { Reserva } from '@/types/reserva';
import type { Lugar } from '@/types/lugar';
import type { Gasto } from '@/types/gasto';
import type { CategoriaDocumento, TipoArchivo } from '@/types/documento';
import type { CategoriaEvento, PrioridadEvento } from '@/types/evento';

// ============================================
// TIPOS
// ============================================

interface FirestoreTrip {
  name: string;
  description: string;
  destination: string;
  destinationPlaceId?: string | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  currency: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

interface FirestoreReservation {
  categoria: string;
  nombre: string;
  proveedor: string | null;
  numeroConfirmacion: string | null;
  fechaInicio: string | null;
  horaInicio: string | null;
  fechaFin: string | null;
  horaFin: string | null;
  ubicacion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  precio: number | null;
  moneda: string;
  estadoPago: string;
  notas: string | null;
  metadatos: string | null;
  localId: string;
  lugarId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

interface FirestorePlace {
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  googlePlaceId: string | null;
  orden: number;
  visitado: boolean;
  localId: string;
  diaId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

interface FirestoreExpense {
  description: string;
  amount: number; // En céntimos
  currency: string;
  category: string;
  date: string;
  paidByUid: string;
  paidByName: string;
  localId: string;
  reservaId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

interface FirestoreDocument {
  nombre: string;
  categoria: CategoriaDocumento;
  tipoArchivo: TipoArchivo;
  tamano: number;
  storageUrl: string;
  storagePath: string;
  localId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt: Timestamp | null;
}

interface FirestoreEvent {
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaEvento;
  horaInicio: string | null;
  horaFin: string | null;
  duracionMinutos: number | null;
  ubicacion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  completado: boolean;
  prioridad: PrioridadEvento;
  notas: string | null;
  localId: string;
  diaId: string | null;
  lugarId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface DownloadResult {
  success: boolean;
  viaje: Viaje | null;
  stats: {
    reservations: number;
    places: number;
    expenses: number;
    documents: number;
    events: number;
  };
  error?: string;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Descarga un viaje compartido de Firestore y lo guarda en SQLite local.
 * Se usa cuando un usuario acepta una invitación a un viaje.
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param userId - ID del usuario que se está uniendo
 * @returns Resultado de la descarga con el viaje creado localmente
 */
export async function downloadSharedTrip(
  firestoreId: string,
  userId: string
): Promise<DownloadResult> {
  const result: DownloadResult = {
    success: false,
    viaje: null,
    stats: { reservations: 0, places: 0, expenses: 0, documents: 0, events: 0 },
  };

  try {
    console.log('[SyncDownload] Iniciando descarga de viaje:', firestoreId, 'para usuario:', userId);

    // 1. Verificar que no exista ya en local PARA ESTE USUARIO
    // (importante cuando dos usuarios comparten el mismo dispositivo)
    const localDb = await getDatabase();
    const existingViaje = await localDb.getFirstAsync<Viaje>(
      'SELECT * FROM viajes WHERE firestoreId = ? AND usuarioId = ?',
      [firestoreId, userId]
    );

    if (existingViaje) {
      console.log('[SyncDownload] El viaje ya existe en local para este usuario:', existingViaje.id);
      result.success = true;
      result.viaje = existingViaje;
      return result;
    }

    // 2. Obtener viaje de Firestore
    const tripRef = doc(firestoreDb, 'trips', firestoreId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      result.error = 'Viaje no encontrado en Firestore';
      return result;
    }

    const tripData = tripSnap.data() as FirestoreTrip;

    // 3. Crear viaje en SQLite
    const viaje = await createLocalViaje(tripData, firestoreId, userId);
    result.viaje = viaje;
    console.log('[SyncDownload] Viaje creado localmente:', viaje.id);

    // 4. Crear días del viaje
    await createDiasParaViaje(viaje.id, viaje.fechaInicio, viaje.fechaFin);
    console.log('[SyncDownload] Días creados para viaje');

    // 5. Descargar subcolecciones con retry (para dar tiempo a que Firestore propague memberUids)
    await downloadSubcollectionsWithRetry(firestoreId, viaje.id, result);

    result.success = true;
    console.log('[SyncDownload] Descarga completada:', result.stats);

    return result;
  } catch (error: any) {
    logError(error, 'downloadSharedTrip');
    result.error = error.message;
    // Si el viaje base se creó, consideramos éxito parcial
    if (result.viaje) {
      result.success = true;
      console.log('[SyncDownload] Viaje creado pero sin subcolecciones:', result.viaje.id);
    }
    return result;
  }
}

/**
 * Espera a que el miembro se haya propagado correctamente en Firestore
 * antes de intentar leer subcolecciones (evita race condition de permisos)
 */
async function waitForMemberPropagation(
  tripId: string,
  maxWaitMs: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  const user = auth.currentUser;

  if (!user) {
    console.warn('[SyncDownload] No hay usuario autenticado');
    return false;
  }

  const memberRef = doc(firestoreDb, 'trips', tripId, 'members', user.uid);

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        console.log('[SyncDownload] ✓ Miembro propagado correctamente');
        return true;
      }
    } catch (error: any) {
      // Ignorar errores de permisos durante el polling
      if (error.code !== 'permission-denied') {
        console.warn('[SyncDownload] Error inesperado verificando miembro:', error.message);
      }
    }
    // Esperar 500ms antes del siguiente intento
    await delay(500);
  }

  console.warn('[SyncDownload] ⚠ Timeout esperando propagación de miembro');
  return false;
}

/**
 * Descarga subcolecciones con retry para manejar race condition de permisos
 */
async function downloadSubcollectionsWithRetry(
  firestoreId: string,
  viajeId: string,
  result: DownloadResult,
  attempt: number = 1
): Promise<void> {
  const MAX_ATTEMPTS = 5; // Aumentado de 3 a 5
  const RETRY_DELAY_MS = 2500; // Aumentado de 1.5s a 2.5s

  try {
    // Esperar activamente a que el miembro se propague
    if (attempt === 1) {
      console.log('[SyncDownload] Verificando propagación de permisos...');
      const propagated = await waitForMemberPropagation(firestoreId);

      if (!propagated) {
        console.warn('[SyncDownload] Continuando sin confirmación de propagación...');
        // Delay adicional de seguridad si no se confirmó
        await delay(2000);
      }
    }

    // Obtener mapeo de días para asignar reservas/lugares al día correcto
    const diasMap = await buildDiasMap(viajeId);

    // Mapeo de IDs originales a nuevos IDs locales (para lugares referenciados)
    const placeIdMap = new Map<string, string>();

    // Descargar lugares primero (las reservas pueden referenciarlos)
    const placesRef = collection(firestoreDb, 'trips', firestoreId, 'places');
    const placesQuery = query(placesRef, where('deletedAt', '==', null));
    const placesSnap = await getDocs(placesQuery);

    for (const placeDoc of placesSnap.docs) {
      const placeData = placeDoc.data() as FirestorePlace;
      const newLocalId = await createLocalLugar(placeData, viajeId, placeDoc.id, diasMap);
      placeIdMap.set(placeData.localId, newLocalId);
      placeIdMap.set(placeDoc.id, newLocalId); // También mapear por firestoreId
      result.stats.places++;
    }
    console.log('[SyncDownload] Lugares descargados:', result.stats.places);

    // Descargar reservas
    const reservationsRef = collection(firestoreDb, 'trips', firestoreId, 'reservations');
    const reservationsQuery = query(reservationsRef, where('deletedAt', '==', null));
    const reservationsSnap = await getDocs(reservationsQuery);

    for (const resDoc of reservationsSnap.docs) {
      const resData = resDoc.data() as FirestoreReservation;
      await createLocalReserva(resData, viajeId, resDoc.id, diasMap, placeIdMap);
      result.stats.reservations++;
    }
    console.log('[SyncDownload] Reservas descargadas:', result.stats.reservations);

    // Descargar gastos
    const expensesRef = collection(firestoreDb, 'trips', firestoreId, 'expenses');
    const expensesQuery = query(expensesRef, where('deletedAt', '==', null));
    const expensesSnap = await getDocs(expensesQuery);

    for (const expDoc of expensesSnap.docs) {
      const expData = expDoc.data() as FirestoreExpense;
      await createLocalGasto(expData, viajeId, expDoc.id, diasMap);
      result.stats.expenses++;
    }
    console.log('[SyncDownload] Gastos descargados:', result.stats.expenses);

    // Descargar documentos
    const documentsRef = collection(firestoreDb, 'trips', firestoreId, 'documents');
    const documentsQuery = query(documentsRef, where('deletedAt', '==', null));
    const documentsSnap = await getDocs(documentsQuery);

    for (const docDoc of documentsSnap.docs) {
      const docData = docDoc.data() as FirestoreDocument;
      await createLocalDocumento(docData, viajeId, docDoc.id);
      result.stats.documents++;
    }
    console.log('[SyncDownload] Documentos descargados:', result.stats.documents);

    // Descargar eventos personalizados
    const eventsRef = collection(firestoreDb, 'trips', firestoreId, 'events');
    const eventsQuery = query(eventsRef, where('deletedAt', '==', null));
    const eventsSnap = await getDocs(eventsQuery);

    for (const eventDoc of eventsSnap.docs) {
      const eventData = eventDoc.data() as FirestoreEvent;
      await createLocalEvento(eventData, viajeId, eventDoc.id, diasMap, placeIdMap);
      result.stats.events++;
    }
    console.log('[SyncDownload] Eventos descargados:', result.stats.events);

  } catch (error: any) {
    const isPermissionError = error.message?.includes('permission') ||
                              error.code === 'permission-denied';

    if (isPermissionError && attempt < MAX_ATTEMPTS) {
      console.log(`[SyncDownload] Error de permisos, reintentando (${attempt}/${MAX_ATTEMPTS})...`);
      await delay(RETRY_DELAY_MS);
      return downloadSubcollectionsWithRetry(firestoreId, viajeId, result, attempt + 1);
    }

    // Si agotamos reintentos o es otro error, lo propagamos pero no fatal
    console.warn('[SyncDownload] No se pudieron descargar subcolecciones:', error.message);
    // No lanzamos el error - el viaje base ya está creado
  }
}

/**
 * Helper para delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Crea un viaje en SQLite a partir de datos de Firestore
 */
async function createLocalViaje(
  tripData: FirestoreTrip,
  firestoreId: string,
  userId: string
): Promise<Viaje> {
  const db = await getDatabase();
  const id = generateId();
  const now = getCurrentTimestamp();

  const viaje: Viaje = {
    id,
    usuarioId: userId,
    destino: tripData.destination,
    destinoPlaceId: tripData.destinationPlaceId || undefined,
    fechaInicio: tripData.startDate,
    fechaFin: tripData.endDate,
    descripcion: tripData.description || undefined,
    imagenUrl: tripData.coverImage || undefined,
    presupuesto: undefined,
    moneda: tripData.currency || 'EUR',
    numViajeros: tripData.memberUids?.length || 1,
    archived: 0,
    isShared: 1,
    firestoreId,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO viajes (
      id, usuarioId, destino, destinoPlaceId, fechaInicio, fechaFin, descripcion,
      imagenUrl, presupuesto, moneda, numViajeros, archived, isShared, firestoreId,
      syncedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      viaje.id,
      viaje.usuarioId,
      viaje.destino,
      viaje.destinoPlaceId ?? null,
      viaje.fechaInicio,
      viaje.fechaFin,
      viaje.descripcion ?? null,
      viaje.imagenUrl ?? null,
      viaje.presupuesto ?? null,
      viaje.moneda,
      viaje.numViajeros,
      viaje.archived,
      viaje.isShared,
      viaje.firestoreId ?? null,
      viaje.syncedAt ?? null,
      viaje.createdAt,
      viaje.updatedAt,
    ]
  );

  return viaje;
}

/**
 * Construye un mapa de fecha -> diaId para asignar correctamente las entidades
 */
async function buildDiasMap(viajeId: string): Promise<Map<string, string>> {
  const dias = await getDiasByViajeId(viajeId);
  const map = new Map<string, string>();

  for (const dia of dias) {
    map.set(dia.fecha, dia.id);
  }

  return map;
}

/**
 * Crea un lugar en SQLite a partir de datos de Firestore
 * Usa el localId si existe para evitar duplicados
 */
async function createLocalLugar(
  placeData: FirestorePlace,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>
): Promise<string> {
  const db = await getDatabase();
  // Usar el localId de Firestore si existe, si no generar uno nuevo
  const id = placeData.localId || generateId();
  const now = getCurrentTimestamp();

  // Verificar si ya existe un registro con este localId
  const existing = await db.getFirstAsync<{ id: string; firestoreId: string | null }>(
    'SELECT id, firestoreId FROM lugares WHERE id = ?',
    [id]
  );

  if (existing) {
    console.log(`[SyncDownload] Lugar ya existe con localId: ${id}, actualizando en lugar de insertar`);

    // Si existe pero no tiene firestoreId, vincularlo
    if (!existing.firestoreId) {
      await db.runAsync(
        'UPDATE lugares SET firestoreId = ?, updatedAt = ? WHERE id = ?',
        [firestoreId, now, id]
      );
    }

    // Actualizar campos
    await db.runAsync(
      `UPDATE lugares SET
        viajeId = ?, diaId = ?, nombre = ?, descripcion = ?, categoria = ?,
        direccion = ?, latitud = ?, longitud = ?, googlePlaceId = ?,
        orden = ?, visitado = ?, updatedAt = ?
      WHERE id = ?`,
      [
        viajeId,
        placeData.diaId ? diasMap.get(placeData.diaId) || null : null,
        placeData.nombre,
        placeData.descripcion,
        placeData.categoria,
        placeData.direccion,
        placeData.latitud,
        placeData.longitud,
        placeData.googlePlaceId,
        placeData.orden || 0,
        placeData.visitado ? 1 : 0,
        now,
        id,
      ]
    );

    return id;
  }

  // No existe, insertar nuevo
  await db.runAsync(
    `INSERT INTO lugares (
      id, viajeId, diaId, nombre, descripcion, categoria, direccion,
      latitud, longitud, googlePlaceId, orden, visitado, firestoreId,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      placeData.diaId ? diasMap.get(placeData.diaId) || null : null,
      placeData.nombre,
      placeData.descripcion,
      placeData.categoria,
      placeData.direccion,
      placeData.latitud,
      placeData.longitud,
      placeData.googlePlaceId,
      placeData.orden || 0,
      placeData.visitado ? 1 : 0,
      firestoreId,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Crea una reserva en SQLite a partir de datos de Firestore
 * Usa el localId si existe para evitar duplicados
 */
async function createLocalReserva(
  resData: FirestoreReservation,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>,
  placeIdMap: Map<string, string>
): Promise<string> {
  const db = await getDatabase();
  // Usar el localId de Firestore si existe, si no generar uno nuevo
  const id = resData.localId || generateId();
  const now = getCurrentTimestamp();

  // Determinar el diaId basado en fechaInicio
  let diaId: string | null = null;
  if (resData.fechaInicio) {
    diaId = diasMap.get(resData.fechaInicio) || null;
  }

  // Mapear lugarId al nuevo ID local
  let lugarId: string | null = null;
  if (resData.lugarId) {
    lugarId = placeIdMap.get(resData.lugarId) || null;
  }

  // Verificar si ya existe un registro con este localId
  const existing = await db.getFirstAsync<{ id: string; firestoreId: string | null }>(
    'SELECT id, firestoreId FROM reservas WHERE id = ?',
    [id]
  );

  if (existing) {
    console.log(`[SyncDownload] Reserva ya existe con localId: ${id}, actualizando en lugar de insertar`);

    // Si existe pero no tiene firestoreId, vincularlo
    if (!existing.firestoreId) {
      await db.runAsync(
        'UPDATE reservas SET firestoreId = ?, updatedAt = ? WHERE id = ?',
        [firestoreId, now, id]
      );
    }

    // Actualizar campos
    await db.runAsync(
      `UPDATE reservas SET
        viajeId = ?, diaId = ?, categoria = ?, nombre = ?, proveedor = ?,
        numeroConfirmacion = ?, fechaInicio = ?, horaInicio = ?, fechaFin = ?,
        horaFin = ?, ubicacion = ?, direccion = ?, latitud = ?, longitud = ?,
        precio = ?, moneda = ?, estadoPago = ?, notas = ?, metadatos = ?,
        lugarId = ?, updatedAt = ?
      WHERE id = ?`,
      [
        viajeId,
        diaId,
        resData.categoria,
        resData.nombre,
        resData.proveedor,
        resData.numeroConfirmacion,
        resData.fechaInicio,
        resData.horaInicio,
        resData.fechaFin,
        resData.horaFin,
        resData.ubicacion,
        resData.direccion,
        resData.latitud,
        resData.longitud,
        resData.precio,
        resData.moneda || 'EUR',
        resData.estadoPago || 'pending',
        resData.notas,
        resData.metadatos,
        lugarId,
        now,
        id,
      ]
    );

    return id;
  }

  // No existe, insertar nuevo
  await db.runAsync(
    `INSERT INTO reservas (
      id, viajeId, diaId, categoria, nombre, proveedor, numeroConfirmacion,
      fechaInicio, horaInicio, fechaFin, horaFin, ubicacion, direccion,
      latitud, longitud, precio, moneda, estadoPago, notas, metadatos,
      lugarId, firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      diaId,
      resData.categoria,
      resData.nombre,
      resData.proveedor,
      resData.numeroConfirmacion,
      resData.fechaInicio,
      resData.horaInicio,
      resData.fechaFin,
      resData.horaFin,
      resData.ubicacion,
      resData.direccion,
      resData.latitud,
      resData.longitud,
      resData.precio,
      resData.moneda || 'EUR',
      resData.estadoPago || 'pending',
      resData.notas,
      resData.metadatos,
      lugarId,
      firestoreId,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Crea un gasto en SQLite a partir de datos de Firestore
 */
async function createLocalGasto(
  expData: FirestoreExpense,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>
): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = getCurrentTimestamp();

  // Determinar el diaId basado en la fecha
  let diaId: string | null = null;
  if (expData.date) {
    diaId = diasMap.get(expData.date) || null;
  }

  // Convertir de céntimos a decimal
  const monto = expData.amount / 100;

  await db.runAsync(
    `INSERT INTO gastos (
      id, viajeId, diaId, reservaId, categoria, descripcion, monto,
      moneda, fecha, firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      diaId,
      null, // No mapeamos reservaId por ahora para evitar complejidad
      expData.category,
      expData.description,
      monto,
      expData.currency || 'EUR',
      expData.date,
      firestoreId,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Obtiene el directorio de documentos usando la nueva API de SDK 52
 */
function getDocumentsDirectory(): Directory {
  return new Directory(Paths.document, 'viatio_docs');
}

/**
 * Asegurar que el directorio de documentos existe
 */
async function ensureDocumentsDir(): Promise<void> {
  try {
    const docsDir = getDocumentsDirectory();
    if (!docsDir.exists) {
      docsDir.create();
    }
  } catch (error) {
    logError(error, 'ensureDocumentsDir');
    throw new Error('Error al crear directorio de documentos');
  }
}

/**
 * Crea un documento en SQLite y descarga el archivo de Storage
 */
async function createLocalDocumento(
  docData: FirestoreDocument,
  viajeId: string,
  firestoreId: string
): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = getCurrentTimestamp();

  await ensureDocumentsDir();

  // Generar nombre de archivo local
  const extension = docData.nombre.split('.').pop() || 'bin';
  const fileName = `${id}.${extension}`;

  // Descargar archivo de Storage
  const docsDir = getDocumentsDirectory();
  const destinationFile = new File(docsDir, fileName);

  console.log('[SyncDownload] Descargando documento:', docData.nombre);

  try {
    await downloadDocument(docData.storageUrl, destinationFile.uri);
    console.log('[SyncDownload] ✓ Documento descargado:', fileName);
  } catch (downloadError) {
    console.error('[SyncDownload] ⚠ Error al descargar archivo:', downloadError);
    // Continuar de todas formas para crear el registro en BD
    // El archivo se puede reintentar descargar después
  }

  // Insertar en BD
  await db.runAsync(
    `INSERT INTO documentos (
      id, viajeId, nombre, categoria, tipoArchivo,
      rutaArchivo, tamano, firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      docData.nombre,
      docData.categoria,
      docData.tipoArchivo,
      fileName,
      docData.tamano,
      firestoreId,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Crea un evento personalizado en SQLite a partir de datos de Firestore
 * Usa el localId si existe para evitar duplicados
 */
async function createLocalEvento(
  eventData: FirestoreEvent,
  viajeId: string,
  firestoreId: string,
  diasMap: Map<string, string>,
  placeIdMap: Map<string, string>
): Promise<string> {
  const db = await getDatabase();
  // Usar el localId de Firestore si existe, si no generar uno nuevo
  const id = eventData.localId || generateId();
  const now = getCurrentTimestamp();

  // Mapear diaId y lugarId si existen
  const localDiaId = eventData.diaId ? diasMap.get(eventData.diaId) || null : null;
  const localLugarId = eventData.lugarId ? placeIdMap.get(eventData.lugarId) || null : null;

  // Verificar si ya existe un registro con este localId
  const existing = await db.getFirstAsync<{ id: string; firestoreId: string | null }>(
    'SELECT id, firestoreId FROM eventos_personalizados WHERE id = ?',
    [id]
  );

  if (existing) {
    console.log(`[SyncDownload] Evento ya existe con localId: ${id}, actualizando en lugar de insertar`);

    // Si existe pero no tiene firestoreId, vincularlo
    if (!existing.firestoreId) {
      await db.runAsync(
        'UPDATE eventos_personalizados SET firestoreId = ?, updatedAt = ? WHERE id = ?',
        [firestoreId, now, id]
      );
    }

    // Actualizar campos
    await db.runAsync(
      `UPDATE eventos_personalizados SET
        viajeId = ?, diaId = ?, nombre = ?, descripcion = ?, categoria = ?,
        horaInicio = ?, horaFin = ?, duracionMinutos = ?, ubicacion = ?,
        direccion = ?, latitud = ?, longitud = ?, lugarId = ?, notas = ?,
        completado = ?, prioridad = ?, updatedAt = ?
      WHERE id = ?`,
      [
        viajeId,
        localDiaId,
        eventData.nombre,
        eventData.descripcion,
        eventData.categoria,
        eventData.horaInicio,
        eventData.horaFin,
        eventData.duracionMinutos,
        eventData.ubicacion,
        eventData.direccion,
        eventData.latitud,
        eventData.longitud,
        localLugarId,
        eventData.notas,
        eventData.completado ? 1 : 0,
        eventData.prioridad || 'media',
        now,
        id,
      ]
    );

    return id;
  }

  // No existe, insertar nuevo
  await db.runAsync(
    `INSERT INTO eventos_personalizados (
      id, viajeId, diaId, nombre, descripcion, categoria,
      horaInicio, horaFin, duracionMinutos, ubicacion, direccion,
      latitud, longitud, lugarId, notas, completado, prioridad,
      firestoreId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      viajeId,
      localDiaId,
      eventData.nombre,
      eventData.descripcion,
      eventData.categoria,
      eventData.horaInicio,
      eventData.horaFin,
      eventData.duracionMinutos,
      eventData.ubicacion,
      eventData.direccion,
      eventData.latitud,
      eventData.longitud,
      localLugarId,
      eventData.notas,
      eventData.completado ? 1 : 0,
      eventData.prioridad || 'media',
      firestoreId,
      now,
      now,
    ]
  );

  return id;
}
