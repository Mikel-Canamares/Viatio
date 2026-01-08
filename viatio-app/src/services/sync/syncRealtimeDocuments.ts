/**
 * SYNC REALTIME DOCUMENTS SERVICE
 *
 * Servicio para sincronización bidireccional en tiempo real de documentos.
 * Escucha cambios en Firestore y actualiza SQLite local automáticamente.
 * Descarga archivos de Firebase Storage según sea necesario.
 *
 * Características:
 * - Listener de Firestore con onSnapshot
 * - Descarga automática de archivos desde Storage
 * - Inserción, actualización y eliminación en SQLite
 * - Sincronización de vinculaciones reserva-documento
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { Directory, File, Paths } from 'expo-file-system/next';
import { db as firestoreDb } from '@/config/firebase';
import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import { logError } from '@/utils/errorHandler';
import { downloadDocument } from '@/services/firestore/documentsService';
import type { CategoriaDocumento, TipoArchivo } from '@/types/documento';

// ============================================
// DEDUPLICACIÓN
// ============================================

// Mapa para trackear cambios procesados recientemente y evitar duplicados
const processedChanges = new Map<string, number>();
const DEDUP_WINDOW_MS = 2000; // 2 segundos

/**
 * Verifica si un cambio debe ser procesado o si es un duplicado reciente
 */
function shouldProcessChange(docId: string, changeType: string): boolean {
  const key = `${docId}_${changeType}`;
  const now = Date.now();
  const lastProcessed = processedChanges.get(key);

  if (lastProcessed && (now - lastProcessed) < DEDUP_WINDOW_MS) {
    console.log('[Sync⬇️ Documents] ⚠️ Cambio duplicado ignorado:', key);
    return false;
  }

  processedChanges.set(key, now);

  // Limpieza de entradas antiguas para evitar memory leaks
  if (processedChanges.size > 100) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [k, v] of processedChanges.entries()) {
      if (v < cutoff) processedChanges.delete(k);
    }
  }

  return true;
}

// ============================================
// TIPOS
// ============================================

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

// ============================================
// HELPERS - DIRECTORIO
// ============================================

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

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Suscribirse a cambios en documentos de un viaje compartido
 *
 * @param firestoreId - ID del viaje en Firestore
 * @param viajeId - ID del viaje en SQLite local
 * @param onUpdate - Callback llamado cuando hay cambios (opcional)
 * @returns Función para desuscribirse
 */
export function subscribeToDocuments(
  firestoreId: string,
  viajeId: string,
  onUpdate?: () => void
): () => void {
  console.log('[Sync⬇️ Documents] 🔄 Iniciando subscripción:', {
    firestoreId,
    viajeIdLocal: viajeId,
  });

  const documentsRef = collection(firestoreDb, 'trips', firestoreId, 'documents');
  const q = query(documentsRef, where('deletedAt', '==', null));

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        await ensureDocumentsDir();
        const db = await getDatabase();

        // En el primer snapshot, procesar TODOS los documentos existentes
        if (isFirstSnapshot) {
          console.log('[Sync⬇️ Documents] Snapshot inicial, procesando todos los documentos:', snapshot.docs.length, '| viajeIdLocal:', viajeId);

          for (const doc of snapshot.docs) {
            const docData = doc.data() as FirestoreDocument;
            const firestoreDocId = doc.id;

            console.log('[Sync⬇️ Documents] 🔍 Verificando documento:', {
              nombre: docData.nombre,
              firestoreDocId,
              buscandoEnViajeId: viajeId,
            });

            // Verificar si ya existe en SQLite PARA ESTE VIAJE
            // IMPORTANTE: Buscar por firestoreId Y viajeId combinados
            const existing = await db.getFirstAsync<{ id: string; viajeId: string }>(
              'SELECT id, viajeId FROM documentos WHERE firestoreId = ? AND viajeId = ?',
              [firestoreDocId, viajeId]
            );

            console.log('[Sync⬇️ Documents] 📊 Resultado búsqueda:', existing || 'No encontrado');

            if (!existing) {
              // Descargar y crear nuevo documento
              await downloadAndCreateLocalDocument(docData, viajeId, firestoreDocId);
              console.log('[Sync⬇️ Documents] ✓ Documento creado (inicial):', docData.nombre);
            } else {
              // Actualizar documento existente
              await updateLocalDocument(existing.id, docData);
              console.log('[Sync⬇️ Documents] ✓ Documento actualizado (inicial):', docData.nombre, '| viajeIdEnBD:', existing.viajeId);
            }
          }

          isFirstSnapshot = false;
        } else {
          // En snapshots posteriores, solo procesar cambios
          console.log('[Sync⬇️ Documents] Cambios detectados:', snapshot.docChanges().length);

          for (const change of snapshot.docChanges()) {
            const docData = change.doc.data() as FirestoreDocument;
            const firestoreDocId = change.doc.id;

            // Verificar si es un cambio duplicado
            if (!shouldProcessChange(firestoreDocId, change.type)) {
              continue;
            }

            if (change.type === 'added' || change.type === 'modified') {
              // Verificar si ya existe en SQLite PARA ESTE VIAJE
              // IMPORTANTE: Buscar por firestoreId Y viajeId combinados
              const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM documentos WHERE firestoreId = ? AND viajeId = ?',
                [firestoreDocId, viajeId]
              );

              if (!existing) {
                // Descargar y crear nuevo documento
                await downloadAndCreateLocalDocument(docData, viajeId, firestoreDocId);
                console.log('[Sync⬇️ Documents] ✓ Documento creado:', docData.nombre);
              } else {
                // Actualizar documento existente
                await updateLocalDocument(existing.id, docData);
                console.log('[Sync⬇️ Documents] ✓ Documento actualizado:', docData.nombre);
              }
            } else if (change.type === 'removed') {
              // Eliminar de SQLite SOLO para este viaje
              await deleteLocalDocument(firestoreDocId, viajeId);
              console.log('[Sync⬇️ Documents] ✓ Documento eliminado');
            }
          }
        }

        // Sincronizar vinculaciones reserva-documento
        await syncReservationDocumentLinks(firestoreId, viajeId);

        // Notificar cambios
        if (onUpdate) {
          onUpdate();
        }

        console.log('[Sync✅ Documents] Sincronización completada');
      } catch (error) {
        logError(error, 'subscribeToDocuments.onSnapshot');
      }
    },
    (error) => {
      console.error('[Sync❌ Documents] Error en listener:', error);
      logError(error, 'subscribeToDocuments');
    }
  );
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Descarga un documento de Storage y lo crea en SQLite local
 */
async function downloadAndCreateLocalDocument(
  docData: FirestoreDocument,
  viajeId: string,
  firestoreId: string
): Promise<void> {
  try {
    const db = await getDatabase();

    console.log('[Sync⬇️ Documents] 📥 Descargando documento:', {
      nombre: docData.nombre,
      firestoreId,
      viajeIdLocal: viajeId,
      localIdOriginal: docData.localId,
    });

    // Generar SIEMPRE un nuevo ID local para este usuario
    // NO usar docData.localId porque es del usuario que creó el documento
    const id = generateId();

    // Generar nombre de archivo local
    const extension = docData.nombre.split('.').pop() || 'bin';
    const fileName = `${id}.${extension}`;

    // Descargar archivo de Storage
    const docsDir = getDocumentsDirectory();
    const destinationFile = new File(docsDir, fileName);

    console.log('[Sync⬇️ Documents] Descargando archivo:', docData.nombre);

    try {
      await downloadDocument(docData.storageUrl, destinationFile.uri);
    } catch (downloadError) {
      console.error('[Sync❌ Documents] Error al descargar archivo:', downloadError);
      // Continuar de todas formas para crear el registro en BD
      // El archivo se puede reintentar descargar después
    }

    const now = getCurrentTimestamp();

    // Insertar en BD
    await db.runAsync(
      `INSERT OR REPLACE INTO documentos (
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

    console.log('[Sync✅ Documents] Documento descargado y guardado:', {
      id,
      viajeIdLocal: viajeId,
      fileName,
    });
  } catch (error) {
    logError(error, 'downloadAndCreateLocalDocument');
    throw error;
  }
}

/**
 * Actualiza un documento existente en SQLite
 */
async function updateLocalDocument(
  localId: string,
  docData: FirestoreDocument
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = getCurrentTimestamp();

    await db.runAsync(
      `UPDATE documentos SET
        nombre = ?,
        categoria = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        docData.nombre,
        docData.categoria,
        now,
        localId,
      ]
    );

    console.log('[Sync✅ Documents] Documento actualizado:', localId);
  } catch (error) {
    logError(error, 'updateLocalDocument');
    throw error;
  }
}

/**
 * Elimina un documento de SQLite y su archivo físico
 * SOLO para el viaje especificado
 */
async function deleteLocalDocument(firestoreId: string, viajeId: string): Promise<void> {
  try {
    const db = await getDatabase();

    // Obtener documento para eliminar archivo físico
    // IMPORTANTE: Buscar por firestoreId Y viajeId
    const documento = await db.getFirstAsync<{ id: string; rutaArchivo: string }>(
      'SELECT id, rutaArchivo FROM documentos WHERE firestoreId = ? AND viajeId = ?',
      [firestoreId, viajeId]
    );

    if (!documento) {
      console.warn('[Sync⚠️ Documents] Documento no encontrado para eliminar:', { firestoreId, viajeId });
      return;
    }

    // Eliminar archivo físico
    try {
      const docsDir = getDocumentsDirectory();
      const file = new File(docsDir, documento.rutaArchivo);
      if (file.exists) {
        file.delete();
      }
    } catch (fileError) {
      console.warn('[Sync⚠️ Documents] Error al eliminar archivo físico:', fileError);
      // Continuar con eliminación de BD
    }

    // Eliminar de BD (CASCADE eliminará también las vinculaciones)
    await db.runAsync('DELETE FROM documentos WHERE id = ?', [documento.id]);

    console.log('[Sync✅ Documents] Documento eliminado:', documento.id);
  } catch (error) {
    logError(error, 'deleteLocalDocument');
    throw error;
  }
}

/**
 * Sincroniza las vinculaciones reserva-documento desde Firestore
 *
 * NOTA: Las vinculaciones se almacenan en el campo 'documentIds' de cada reserva en Firestore
 */
async function syncReservationDocumentLinks(
  firestoreTripId: string,
  viajeId: string
): Promise<void> {
  try {
    console.log('[Sync🔄 Documents] Sincronizando vinculaciones reserva-documento...');

    const db = await getDatabase();

    // Obtener todas las reservas de Firestore para este viaje
    const reservationsRef = collection(firestoreDb, 'trips', firestoreTripId, 'reservations');
    const reservationsSnapshot = await getDocs(
      query(reservationsRef, where('deletedAt', '==', null))
    );

    let linksCreated = 0;

    for (const resDoc of reservationsSnapshot.docs) {
      const resData = resDoc.data();
      const documentIds = resData.documentIds as string[] | undefined;

      if (!documentIds || documentIds.length === 0) {
        continue;
      }

      // Obtener la reserva local correspondiente
      const localReserva = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM reservas WHERE firestoreId = ? AND viajeId = ?',
        [resDoc.id, viajeId]
      );

      if (!localReserva) {
        console.warn('[Sync⚠️ Documents] Reserva no encontrada en local:', resDoc.id);
        continue;
      }

      // Para cada documentId de Firestore, crear la vinculación local
      for (const firestoreDocId of documentIds) {
        // Buscar el documento local correspondiente
        const localDoc = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM documentos WHERE firestoreId = ? AND viajeId = ?',
          [firestoreDocId, viajeId]
        );

        if (!localDoc) {
          console.warn('[Sync⚠️ Documents] Documento no encontrado en local:', firestoreDocId);
          continue;
        }

        // Verificar si la vinculación ya existe
        const existingLink = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM reservas_documentos WHERE reservaId = ? AND documentoId = ?',
          [localReserva.id, localDoc.id]
        );

        if (!existingLink) {
          // Crear la vinculación
          const linkId = generateId();
          const now = getCurrentTimestamp();

          await db.runAsync(
            `INSERT INTO reservas_documentos (id, reservaId, documentoId, createdAt)
             VALUES (?, ?, ?, ?)`,
            [linkId, localReserva.id, localDoc.id, now]
          );

          linksCreated++;
          console.log('[Sync✅ Documents] Vinculación creada:', {
            reservaId: localReserva.id,
            documentoId: localDoc.id,
          });
        }
      }
    }

    if (linksCreated > 0) {
      console.log(`[Sync✅ Documents] ${linksCreated} vinculación(es) creada(s)`);
    }
  } catch (error) {
    logError(error, 'syncReservationDocumentLinks');
    // No lanzar error - continuar con la sincronización
  }
}
