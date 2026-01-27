/**
 * SYNC UPLOAD SERVICE
 *
 * Servicio para subir cambios locales a Firestore.
 * Se usa cuando un usuario crea/actualiza entidades en un viaje compartido.
 */

import { db as firestoreDb, auth } from '@/config/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { getDatabase } from '@/database';
import { getViajeById } from '@/services/viajesService';
import { logError } from '@/utils/errorHandler';
import { uploadDocument as uploadDocumentToStorage } from '@/services/firestore/documentsService';
import { getDocumentoUri } from '@/services/documentosService';
import type { Reserva } from '@/types/reserva';
import type { Lugar } from '@/types/lugar';
import type { Gasto } from '@/types/gasto';
import type { Documento } from '@/types/documento';
import type { EventoPersonalizado } from '@/types/evento';
import type { ChecklistItem } from '@/types/checklist';

// ============================================
// TIPOS
// ============================================

export interface UploadResult {
  success: boolean;
  firestoreId: string | null;
  error?: string;
}

// ============================================
// VERIFICACIÓN DE VIAJE COMPARTIDO
// ============================================

/**
 * Verifica si un viaje es compartido y obtiene su firestoreId
 */
export async function getSharedTripFirestoreId(viajeId: string): Promise<string | null> {
  try {
    const viaje = await getViajeById(viajeId);
    if (viaje?.isShared === 1 && viaje.firestoreId) {
      return viaje.firestoreId;
    }
    return null;
  } catch (error) {
    logError(error, 'getSharedTripFirestoreId');
    return null;
  }
}

// ============================================
// UPLOAD DE RESERVAS
// ============================================

/**
 * Sube una reserva a Firestore
 */
export async function uploadReserva(
  reserva: Reserva,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    // Usar el ID local como ID en Firestore para mantener consistencia
    const firestoreId = reserva.firestoreId || reserva.id;
    const reservaRef = doc(firestoreDb, 'trips', tripFirestoreId, 'reservations', firestoreId);

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
      metadatos: reserva.metadatos ? JSON.stringify(reserva.metadatos) : null,

      // Referencias
      localId: reserva.id,
      lugarId: reserva.lugarId || null,

      // Auditoría
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }, { merge: true });

    // Actualizar el firestoreId en SQLite si no existía
    if (!reserva.firestoreId) {
      await updateLocalFirestoreId('reservas', reserva.id, firestoreId);
    }

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Reserva subida:', reserva.nombre, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadReserva');
    result.error = error.message;
    return result;
  }
}

// ============================================
// UPLOAD DE LUGARES
// ============================================

/**
 * Sube un lugar a Firestore
 */
export async function uploadLugar(
  lugar: Lugar,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    const firestoreId = lugar.firestoreId || lugar.id;
    const lugarRef = doc(firestoreDb, 'trips', tripFirestoreId, 'places', firestoreId);

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
      diaId: lugar.diaId || null,

      // Auditoría
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }, { merge: true });

    if (!lugar.firestoreId) {
      await updateLocalFirestoreId('lugares', lugar.id, firestoreId);
    }

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Lugar subido:', lugar.nombre, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadLugar');
    result.error = error.message;
    return result;
  }
}

// ============================================
// UPLOAD DE EVENTOS PERSONALIZADOS
// ============================================

/**
 * Sube un evento personalizado a Firestore
 */
export async function uploadEvento(
  evento: EventoPersonalizado,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    const firestoreId = evento.firestoreId || evento.id;
    const eventoRef = doc(firestoreDb, 'trips', tripFirestoreId, 'events', firestoreId);

    // Obtener la fecha del día si hay diaId (para mapeo correcto en otros usuarios)
    let diaFecha: string | null = null;
    if (evento.diaId) {
      const db = await getDatabase();
      const dia = await db.getFirstAsync<{ fecha: string }>(
        'SELECT fecha FROM dias_viaje WHERE id = ?',
        [evento.diaId]
      );
      diaFecha = dia?.fecha || null;
    }

    await setDoc(eventoRef, {
      nombre: evento.nombre,
      descripcion: evento.descripcion || null,
      categoria: evento.categoria,

      // Fechas y horas
      horaInicio: evento.horaInicio || null,
      horaFin: evento.horaFin || null,
      duracionMinutos: evento.duracionMinutos || null,

      // Ubicación
      ubicacion: evento.ubicacion || null,
      direccion: evento.direccion || null,
      latitud: evento.latitud || null,
      longitud: evento.longitud || null,

      // Estado
      completado: Boolean(evento.completado),
      prioridad: evento.prioridad || 'media',

      // Notas
      notas: evento.notas || null,

      // Referencias
      localId: evento.id,
      diaId: diaFecha, // Guardar la fecha del día en lugar del ID local
      lugarId: evento.lugarId || null,

      // Auditoría
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }, { merge: true });

    if (!evento.firestoreId) {
      await updateLocalFirestoreId('eventos_personalizados', evento.id, firestoreId);
    }

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Evento subido:', evento.nombre, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadEvento');
    result.error = error.message;
    return result;
  }
}

// ============================================
// UPLOAD DE GASTOS
// ============================================

/**
 * Sube un gasto a Firestore
 */
export async function uploadGasto(
  gasto: Gasto,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    const firestoreId = gasto.firestoreId || gasto.id;
    const gastoRef = doc(firestoreDb, 'trips', tripFirestoreId, 'expenses', firestoreId);

    // Convertir monto a céntimos
    const amountInCents = Math.round(gasto.monto * 100);

    await setDoc(gastoRef, {
      description: gasto.descripcion,
      amount: amountInCents,
      currency: gasto.moneda || 'EUR',
      category: gasto.categoria,
      date: gasto.fecha,

      // Pagador
      paidByUid: user.uid,
      paidByName: user.displayName || user.email?.split('@')[0] || 'Usuario',

      // Reparto (por defecto igual entre 1)
      splitMethod: 'equal',
      participantUids: [user.uid],
      shares: [{
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        value: 1,
        calculatedAmount: amountInCents,
      }],

      // Referencias
      localId: gasto.id,
      reservaId: gasto.reservaId || null,
      receiptUrl: null,
      notes: null,

      // Auditoría
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }, { merge: true });

    if (!gasto.firestoreId) {
      await updateLocalFirestoreId('gastos', gasto.id, firestoreId);
    }

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Gasto subido:', gasto.descripcion, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadGasto');
    result.error = error.message;
    return result;
  }
}

// ============================================
// UPLOAD DE DOCUMENTOS
// ============================================

/**
 * Sube un documento a Firestore Storage y crea el registro en Firestore
 */
export async function uploadDocumento(
  documento: Documento,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    console.log('[SyncUpload] Subiendo documento:', documento.nombre);

    // Obtener URI completa del archivo local
    const fileUri = getDocumentoUri(documento);

    // Subir a Storage y crear registro en Firestore
    // NOTA: uploadDocumentToStorage ya actualiza el firestoreId en SQLite internamente
    const firestoreId = await uploadDocumentToStorage(
      tripFirestoreId,
      documento.id,
      fileUri,
      documento.nombre,
      documento.categoria,
      documento.tipoArchivo,
      documento.tamano || 0
    );

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Documento subido:', documento.nombre, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadDocumento');
    result.error = error.message;
    return result;
  }
}

/**
 * Vincula un documento a una reserva en Firestore
 * Actualiza el campo documentIds en la reserva
 */
export async function linkDocumentToReservationInFirestore(
  tripFirestoreId: string,
  reservationFirestoreId: string,
  documentFirestoreId: string
): Promise<boolean> {
  try {
    const reservaRef = doc(firestoreDb, 'trips', tripFirestoreId, 'reservations', reservationFirestoreId);

    await updateDoc(reservaRef, {
      documentIds: arrayUnion(documentFirestoreId),
      updatedAt: serverTimestamp(),
    });

    console.log('[SyncUpload] Documento vinculado a reserva:', {
      reservationFirestoreId,
      documentFirestoreId,
    });

    return true;
  } catch (error) {
    logError(error, 'linkDocumentToReservationInFirestore');
    return false;
  }
}

// ============================================
// ELIMINACIÓN (SOFT DELETE)
// ============================================

/**
 * Marca una entidad como eliminada en Firestore
 */
export async function markDeletedInFirestore(
  tripFirestoreId: string,
  collectionName: 'reservations' | 'places' | 'expenses' | 'documents' | 'events' | 'checklist',
  entityFirestoreId: string
): Promise<boolean> {
  try {
    const entityRef = doc(firestoreDb, 'trips', tripFirestoreId, collectionName, entityFirestoreId);

    await updateDoc(entityRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`[SyncUpload] Marcado como eliminado: ${collectionName}/${entityFirestoreId}`);
    return true;
  } catch (error) {
    logError(error, 'markDeletedInFirestore');
    return false;
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Actualiza el firestoreId en la tabla local
 */
async function updateLocalFirestoreId(
  tableName: string,
  localId: string,
  firestoreId: string
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${tableName} SET firestoreId = ?, updatedAt = ? WHERE id = ?`,
      [firestoreId, new Date().toISOString(), localId]
    );
  } catch (error) {
    logError(error, 'updateLocalFirestoreId');
  }
}

// ============================================
// SYNC AUTOMÁTICO DESPUÉS DE OPERACIONES
// ============================================

/**
 * Sincroniza una reserva si el viaje es compartido
 * Llamar después de crear/actualizar una reserva
 */
export async function syncReservaIfShared(reserva: Reserva): Promise<void> {
  try {
    const tripFirestoreId = await getSharedTripFirestoreId(reserva.viajeId);
    if (tripFirestoreId) {
      await uploadReserva(reserva, tripFirestoreId);
    }
  } catch (error) {
    // No fallar la operación principal si falla el sync
    console.warn('[SyncUpload] Error sincronizando reserva:', error);
  }
}

/**
 * Sincroniza un lugar si el viaje es compartido
 */
export async function syncLugarIfShared(lugar: Lugar): Promise<void> {
  try {
    const tripFirestoreId = await getSharedTripFirestoreId(lugar.viajeId);
    if (tripFirestoreId) {
      await uploadLugar(lugar, tripFirestoreId);
    }
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando lugar:', error);
  }
}

/**
 * Sincroniza un gasto si el viaje es compartido
 */
export async function syncGastoIfShared(gasto: Gasto): Promise<void> {
  try {
    const tripFirestoreId = await getSharedTripFirestoreId(gasto.viajeId);
    if (tripFirestoreId) {
      await uploadGasto(gasto, tripFirestoreId);
    }
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando gasto:', error);
  }
}

/**
 * Sincroniza un evento personalizado si el viaje es compartido
 */
export async function syncEventoIfShared(evento: EventoPersonalizado): Promise<void> {
  try {
    const tripFirestoreId = await getSharedTripFirestoreId(evento.viajeId);
    if (tripFirestoreId) {
      await uploadEvento(evento, tripFirestoreId);
    }
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando evento:', error);
  }
}

/**
 * Sincroniza un documento si el viaje es compartido
 */
export async function syncDocumentoIfShared(documento: Documento): Promise<string | null> {
  try {
    const tripFirestoreId = await getSharedTripFirestoreId(documento.viajeId);
    if (tripFirestoreId) {
      const result = await uploadDocumento(documento, tripFirestoreId);
      return result.firestoreId;
    }
    return null;
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando documento:', error);
    return null;
  }
}

/**
 * Vincula un documento a una reserva en Firestore si el viaje es compartido
 */
export async function syncDocumentLinkIfShared(
  viajeId: string,
  reservaFirestoreId: string | null | undefined,
  documentoFirestoreId: string | null | undefined
): Promise<void> {
  if (!reservaFirestoreId || !documentoFirestoreId) return;

  try {
    const tripFirestoreId = await getSharedTripFirestoreId(viajeId);
    if (tripFirestoreId) {
      await linkDocumentToReservationInFirestore(
        tripFirestoreId,
        reservaFirestoreId,
        documentoFirestoreId
      );
    }
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando vinculación de documento:', error);
  }
}

/**
 * Marca como eliminado en Firestore si el viaje es compartido
 */
export async function syncDeleteIfShared(
  viajeId: string,
  collectionName: 'reservations' | 'places' | 'expenses' | 'documents' | 'events' | 'checklist',
  entityFirestoreId: string | null
): Promise<void> {
  console.log('[SyncUpload] syncDeleteIfShared llamado:', { viajeId, collectionName, entityFirestoreId });

  if (!entityFirestoreId) {
    console.log('[SyncUpload] entityFirestoreId es null, retornando');
    return;
  }

  try {
    const tripFirestoreId = await getSharedTripFirestoreId(viajeId);
    console.log('[SyncUpload] tripFirestoreId obtenido:', tripFirestoreId);

    if (tripFirestoreId) {
      await markDeletedInFirestore(tripFirestoreId, collectionName, entityFirestoreId);
      console.log('[SyncUpload] ✅ markDeletedInFirestore completado');
    } else {
      console.log('[SyncUpload] Viaje no compartido, no se sincroniza eliminación');
    }
  } catch (error) {
    console.error('[SyncUpload] ❌ Error sincronizando eliminación:', error);
    throw error; // Re-throw para que el caller lo maneje
  }
}

// ============================================
// UPLOAD DE CHECKLIST ITEMS
// ============================================

/**
 * Sube un item de checklist a Firestore
 * Solo sube items con seccion = 'grupal'
 */
export async function uploadChecklistItem(
  item: ChecklistItem,
  tripFirestoreId: string
): Promise<UploadResult> {
  const result: UploadResult = { success: false, firestoreId: null };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.error = 'Usuario no autenticado';
      return result;
    }

    // Usar el ID local como ID en Firestore para mantener consistencia
    const firestoreId = item.firestoreId || item.id;
    const itemRef = doc(firestoreDb, 'trips', tripFirestoreId, 'checklist', firestoreId);

    await setDoc(itemRef, {
      texto: item.texto,
      completado: item.completado,
      orden: item.orden,
      localId: item.id,

      // Auditoría
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    }, { merge: true });

    // Actualizar el firestoreId en SQLite si no existía
    if (!item.firestoreId) {
      await updateLocalFirestoreId('checklist_items', item.id, firestoreId);
    }

    result.success = true;
    result.firestoreId = firestoreId;
    console.log('[SyncUpload] Checklist item subido:', item.texto, '->', firestoreId);

    return result;
  } catch (error: any) {
    logError(error, 'uploadChecklistItem');
    result.error = error.message;
    return result;
  }
}

/**
 * Sincroniza un item de checklist si el viaje es compartido y es grupal
 */
export async function syncChecklistItemIfShared(item: ChecklistItem): Promise<void> {
  try {
    // Solo sincronizar items grupales
    if (item.seccion !== 'grupal') {
      return;
    }

    const tripFirestoreId = await getSharedTripFirestoreId(item.viajeId);
    if (tripFirestoreId) {
      await uploadChecklistItem(item, tripFirestoreId);
    }
  } catch (error) {
    console.warn('[SyncUpload] Error sincronizando checklist item:', error);
  }
}
