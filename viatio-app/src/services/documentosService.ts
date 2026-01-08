/**
 * DOCUMENTOS SERVICE
 *
 * Servicio para gestión de documentos de viaje.
 * Maneja almacenamiento físico de archivos y registros en BD.
 */

import { Directory, File, Paths } from 'expo-file-system/next';
import { getDatabase, generateId, getCurrentTimestamp } from '@/database';
import type { Documento, CreateDocumentoInput, CategoriaDocumento, TipoArchivo } from '@/types/documento';
import { logError } from '@/utils/errorHandler';
import { syncDocumentoIfShared, syncDocumentLinkIfShared, syncDeleteIfShared } from '@/services/sync/syncUpload';
import { getViajeById } from '@/services/viajesService';

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
// HELPERS - TIPO DE ARCHIVO
// ============================================

/**
 * Detecta el tipo de archivo según su MIME type
 */
export function detectTipoArchivo(mimeType: string): TipoArchivo {
  if (mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (mimeType.includes('image')) {
    return 'image';
  }
  return 'other';
}

// ============================================
// CREATE
// ============================================

/**
 * Crea un nuevo documento en BD y copia el archivo al almacenamiento
 */
export async function createDocumento(
  input: CreateDocumentoInput,
  sourceUri: string
): Promise<Documento> {
  try {
    console.log('[createDocumento] Input recibido:', JSON.stringify(input, null, 2));
    console.log('[createDocumento] Source URI:', sourceUri);

    await ensureDocumentsDir();

    const id = generateId();
    const timestamp = getCurrentTimestamp();

    // Generar nombre único para el archivo
    const extension = input.rutaArchivo.split('.').pop() || 'bin';
    const fileName = `${id}.${extension}`;

    // Crear File usando la nueva API
    const docsDir = getDocumentsDirectory();
    console.log('[createDocumento] Directorio de documentos:', docsDir.uri);

    const sourceFile = new File(sourceUri);
    const destinationFile = new File(docsDir, fileName);

    console.log('[createDocumento] Iniciando copia de archivo...');
    console.log('[createDocumento] Source exists:', sourceFile.exists);
    console.log('[createDocumento] Destination path:', destinationFile.uri);

    // Verificar que el archivo fuente existe
    if (!sourceFile.exists) {
      throw new Error(`Archivo fuente no existe: ${sourceUri}`);
    }

    // Copiar archivo de sourceUri a directorio de documentos
    try {
      sourceFile.copy(destinationFile);
      console.log('[createDocumento] Archivo copiado exitosamente');
    } catch (copyError) {
      console.error('[createDocumento] Error al copiar archivo:', copyError);
      throw new Error('Error al copiar el archivo al almacenamiento');
    }

    // Verificar que el archivo se copió correctamente
    if (!destinationFile.exists) {
      throw new Error('El archivo no se copió correctamente al destino');
    }

    console.log('[createDocumento] Verificación exitosa, archivo existe en destino');

    // Insertar registro en BD
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO documentos (
        id, viajeId, nombre, categoria, tipoArchivo,
        rutaArchivo, tamano, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.viajeId,
        input.nombre,
        input.categoria,
        input.tipoArchivo,
        fileName, // Guardamos solo el nombre, no la ruta completa
        input.tamano,
        timestamp,
        timestamp,
      ]
    );

    console.log('[createDocumento] Documento creado en BD:', id);

    const documento: Documento = {
      id,
      viajeId: input.viajeId,
      nombre: input.nombre,
      categoria: input.categoria,
      tipoArchivo: input.tipoArchivo,
      rutaArchivo: fileName,
      tamano: input.tamano,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Sincronizar con Firestore si el viaje es compartido
    // NOTA: El UPDATE del firestoreId se hace DENTRO de uploadDocument para prevenir race conditions
    try {
      const firestoreDocId = await syncDocumentoIfShared(documento);
      if (firestoreDocId) {
        // Actualizar el objeto en memoria (la BD ya fue actualizada en uploadDocument)
        documento.firestoreId = firestoreDocId;
        console.log('[createDocumento] ✓ Documento sincronizado con Firestore:', firestoreDocId);
      }
    } catch (syncError) {
      console.warn('[createDocumento] Error sincronizando documento:', syncError);
      // No fallar la creación del documento local
    }

    return documento;
  } catch (error) {
    logError(error, 'createDocumento');
    console.error('[createDocumento] Error completo:', error);
    throw new Error(`Error al crear el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// ============================================
// READ
// ============================================

/**
 * Obtiene todos los documentos de un viaje
 */
export async function getDocumentosByViajeId(viajeId: string): Promise<Documento[]> {
  try {
    console.log('[getDocumentosByViajeId] 🔍 Consultando documentos para viajeId:', viajeId);
    const db = await getDatabase();
    const result = await db.getAllAsync<Documento>(
      'SELECT * FROM documentos WHERE viajeId = ? ORDER BY createdAt DESC',
      [viajeId]
    );

    console.log('[getDocumentosByViajeId] 📊 Documentos encontrados:', result?.length || 0);
    if (result && result.length > 0) {
      console.log('[getDocumentosByViajeId] 📄 Detalle:', result.map(d => ({
        id: d.id,
        nombre: d.nombre,
        viajeId: d.viajeId,
        firestoreId: d.firestoreId,
      })));
    }

    return result || [];
  } catch (error) {
    logError(error, 'getDocumentosByViajeId');
    return [];
  }
}

/**
 * Obtiene documentos de un viaje filtrados por categoría
 */
export async function getDocumentosByCategoria(
  viajeId: string,
  categoria: CategoriaDocumento
): Promise<Documento[]> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Documento>(
      'SELECT * FROM documentos WHERE viajeId = ? AND categoria = ? ORDER BY createdAt DESC',
      [viajeId, categoria]
    );

    return result || [];
  } catch (error) {
    logError(error, 'getDocumentosByCategoria');
    return [];
  }
}

/**
 * Obtiene un documento por su ID
 */
export async function getDocumentoById(id: string): Promise<Documento | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Documento>(
      'SELECT * FROM documentos WHERE id = ?',
      [id]
    );

    return result || null;
  } catch (error) {
    logError(error, 'getDocumentoById');
    return null;
  }
}

/**
 * Retorna la URI completa del archivo físico
 */
export function getDocumentoUri(documento: Documento): string {
  const docsDir = getDocumentsDirectory();
  const file = new File(docsDir, documento.rutaArchivo);
  return file.uri;
}

// ============================================
// UPDATE
// ============================================

/**
 * Actualiza la categoría de un documento
 */
export async function updateDocumentoCategoria(
  id: string,
  categoria: CategoriaDocumento
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE documentos SET categoria = ?, updatedAt = ? WHERE id = ?',
      [categoria, timestamp, id]
    );

    console.log('[updateDocumentoCategoria] Categoría actualizada:', { id, categoria });

    return true;
  } catch (error) {
    logError(error, 'updateDocumentoCategoria');
    return false;
  }
}

/**
 * Actualiza el nombre de un documento
 */
export async function updateDocumentoNombre(
  id: string,
  nombre: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE documentos SET nombre = ?, updatedAt = ? WHERE id = ?',
      [nombre, timestamp, id]
    );

    console.log('[updateDocumentoNombre] Nombre actualizado:', { id, nombre });

    return true;
  } catch (error) {
    logError(error, 'updateDocumentoNombre');
    return false;
  }
}

// ============================================
// RELACIÓN RESERVA-DOCUMENTO
// ============================================

/**
 * Vincula un documento a una reserva
 */
export async function linkDocumentoToReserva(
  reservaId: string,
  documentoId: string
): Promise<boolean> {
  try {
    console.log('[linkDocumentoToReserva] Intentando vincular:', { reservaId, documentoId });

    const db = await getDatabase();

    // Verificar que la reserva existe
    const reservaExists = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM reservas WHERE id = ?',
      [reservaId]
    );

    if (!reservaExists) {
      console.error('[linkDocumentoToReserva] Reserva no existe:', reservaId);
      return false;
    }

    // Verificar que el documento existe
    const documentoExists = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM documentos WHERE id = ?',
      [documentoId]
    );

    if (!documentoExists) {
      console.error('[linkDocumentoToReserva] Documento no existe:', documentoId);
      return false;
    }

    const id = generateId();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO reservas_documentos (id, reservaId, documentoId, createdAt)
       VALUES (?, ?, ?, ?)`,
      [id, reservaId, documentoId, timestamp]
    );

    console.log('[linkDocumentoToReserva] Documento vinculado exitosamente:', { reservaId, documentoId, linkId: id });

    // Verificar que la relación se creó correctamente
    const linkCreated = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM reservas_documentos WHERE reservaId = ? AND documentoId = ?',
      [reservaId, documentoId]
    );

    if (!linkCreated) {
      console.error('[linkDocumentoToReserva] La relación no se creó en la BD');
      return false;
    }

    console.log('[linkDocumentoToReserva] Verificación exitosa, relación existe en BD');

    // Sincronizar vinculación con Firestore si el viaje es compartido
    try {
      // Obtener firestoreId de la reserva y documento
      const reserva = await db.getFirstAsync<{ firestoreId: string | null; viajeId: string }>(
        'SELECT firestoreId, viajeId FROM reservas WHERE id = ?',
        [reservaId]
      );

      const documento = await db.getFirstAsync<{ firestoreId: string | null }>(
        'SELECT firestoreId FROM documentos WHERE id = ?',
        [documentoId]
      );

      if (reserva && documento && reserva.firestoreId && documento.firestoreId) {
        await syncDocumentLinkIfShared(
          reserva.viajeId,
          reserva.firestoreId,
          documento.firestoreId
        );
        console.log('[linkDocumentoToReserva] Vinculación sincronizada con Firestore');
      }
    } catch (syncError) {
      console.warn('[linkDocumentoToReserva] Error sincronizando vinculación:', syncError);
      // No fallar la vinculación local
    }

    return true;
  } catch (error) {
    // Si ya existe la relación (UNIQUE constraint), no es un error
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      console.log('[linkDocumentoToReserva] Relación ya existe:', { reservaId, documentoId });
      return true;
    }
    logError(error, 'linkDocumentoToReserva');
    console.error('[linkDocumentoToReserva] Error completo:', error);
    return false;
  }
}

/**
 * Vincula múltiples documentos a una reserva
 */
export async function linkMultipleDocumentosToReserva(
  reservaId: string,
  documentoIds: string[]
): Promise<boolean> {
  try {
    console.log('[linkMultipleDocumentosToReserva] Iniciando vinculación de', documentoIds.length, 'documentos a reserva:', reservaId);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < documentoIds.length; i++) {
      const documentoId = documentoIds[i];
      console.log(`[linkMultipleDocumentosToReserva] Vinculando documento ${i + 1}/${documentoIds.length}:`, documentoId);

      const success = await linkDocumentoToReserva(reservaId, documentoId);

      if (success) {
        successCount++;
        console.log(`[linkMultipleDocumentosToReserva] Documento ${i + 1} vinculado exitosamente`);
      } else {
        failCount++;
        console.error(`[linkMultipleDocumentosToReserva] Falló vinculación del documento ${i + 1}`);
      }
    }

    console.log('[linkMultipleDocumentosToReserva] Resultado:', {
      reservaId,
      total: documentoIds.length,
      exitosos: successCount,
      fallidos: failCount
    });

    // Retornar true solo si todos se vincularon exitosamente
    return failCount === 0;
  } catch (error) {
    logError(error, 'linkMultipleDocumentosToReserva');
    console.error('[linkMultipleDocumentosToReserva] Error completo:', error);
    return false;
  }
}

/**
 * Obtiene todos los documentos vinculados a una reserva
 */
export async function getDocumentosByReservaId(reservaId: string): Promise<Documento[]> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Documento>(
      `SELECT d.* FROM documentos d
       INNER JOIN reservas_documentos rd ON d.id = rd.documentoId
       WHERE rd.reservaId = ?
       ORDER BY rd.createdAt DESC`,
      [reservaId]
    );

    return result || [];
  } catch (error) {
    logError(error, 'getDocumentosByReservaId');
    return [];
  }
}

/**
 * Desvincula un documento de una reserva (no elimina el documento)
 */
export async function unlinkDocumentoFromReserva(
  reservaId: string,
  documentoId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM reservas_documentos WHERE reservaId = ? AND documentoId = ?',
      [reservaId, documentoId]
    );

    console.log('[unlinkDocumentoFromReserva] Documento desvinculado:', { reservaId, documentoId });
    return true;
  } catch (error) {
    logError(error, 'unlinkDocumentoFromReserva');
    return false;
  }
}

// ============================================
// DELETE
// ============================================

/**
 * Elimina un documento (archivo físico y registro de BD)
 * IMPORTANTE: La foreign key con ON DELETE CASCADE se encarga automáticamente
 * de eliminar las relaciones en reservas_documentos
 */
export async function deleteDocumento(id: string): Promise<boolean> {
  try {
    // Obtener documento para saber la ruta del archivo
    const documento = await getDocumentoById(id);

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    // Eliminar archivo físico usando la nueva API
    const docsDir = getDocumentsDirectory();
    const file = new File(docsDir, documento.rutaArchivo);

    if (file.exists) {
      file.delete();
    }

    // Sincronizar eliminación con Firestore si el viaje es compartido
    if (documento.firestoreId) {
      try {
        await syncDeleteIfShared(documento.viajeId, 'documents', documento.firestoreId);
        console.log('[deleteDocumento] Eliminación sincronizada con Firestore');
      } catch (syncError) {
        console.warn('[deleteDocumento] Error sincronizando eliminación:', syncError);
        // Continuar con eliminación local
      }
    }

    // Eliminar registro de BD
    // La foreign key con ON DELETE CASCADE elimina automáticamente
    // las relaciones en reservas_documentos
    const db = await getDatabase();
    await db.runAsync('DELETE FROM documentos WHERE id = ?', [id]);

    console.log('[deleteDocumento] Documento eliminado:', id);

    return true;
  } catch (error) {
    logError(error, 'deleteDocumento');
    return false;
  }
}
