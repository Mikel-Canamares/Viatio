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

    await ensureDocumentsDir();

    const id = generateId();
    const timestamp = getCurrentTimestamp();

    // Generar nombre único para el archivo
    const extension = input.rutaArchivo.split('.').pop() || 'bin';
    const fileName = `${id}.${extension}`;

    // Crear File usando la nueva API
    const docsDir = getDocumentsDirectory();
    const sourceFile = new File(sourceUri);
    const destinationFile = new File(docsDir, fileName);

    // Copiar archivo de sourceUri a directorio de documentos
    sourceFile.copy(destinationFile);

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

    return documento;
  } catch (error) {
    logError(error, 'createDocumento');
    throw new Error('Error al crear el documento');
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
    const db = await getDatabase();
    const result = await db.getAllAsync<Documento>(
      'SELECT * FROM documentos WHERE viajeId = ? ORDER BY createdAt DESC',
      [viajeId]
    );

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
    const db = await getDatabase();
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO reservas_documentos (id, reservaId, documentoId, createdAt)
       VALUES (?, ?, ?, ?)`,
      [id, reservaId, documentoId, timestamp]
    );

    console.log('[linkDocumentoToReserva] Documento vinculado:', { reservaId, documentoId });
    return true;
  } catch (error) {
    // Si ya existe la relación (UNIQUE constraint), no es un error
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      console.log('[linkDocumentoToReserva] Relación ya existe:', { reservaId, documentoId });
      return true;
    }
    logError(error, 'linkDocumentoToReserva');
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
    for (const documentoId of documentoIds) {
      await linkDocumentoToReserva(reservaId, documentoId);
    }
    console.log('[linkMultipleDocumentosToReserva] Documentos vinculados:', { reservaId, count: documentoIds.length });
    return true;
  } catch (error) {
    logError(error, 'linkMultipleDocumentosToReserva');
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
