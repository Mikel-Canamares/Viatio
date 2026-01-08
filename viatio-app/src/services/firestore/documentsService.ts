/**
 * FIRESTORE DOCUMENTS SERVICE
 *
 * Servicio para gestionar documentos en Firestore y Firebase Storage.
 * Maneja la subida/descarga de archivos y metadatos de documentos en viajes compartidos.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from 'firebase/storage';
import { db as firestoreDb, storage, auth } from '@/config/firebase';
import { logError } from '@/utils/errorHandler';
import type { CategoriaDocumento, TipoArchivo } from '@/types/documento';

// ============================================
// TIPOS
// ============================================

export interface FirestoreDocument {
  nombre: string;
  categoria: CategoriaDocumento;
  tipoArchivo: TipoArchivo;
  tamano: number;
  storageUrl: string; // URL de descarga de Firebase Storage
  storagePath: string; // Ruta en Storage para eliminar
  localId: string; // ID del documento en SQLite local
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt: Timestamp | null;
}

// ============================================
// SUBIDA DE DOCUMENTOS
// ============================================

/**
 * Sube un documento a Firebase Storage y crea el registro en Firestore
 *
 * @param tripId - ID del viaje en Firestore
 * @param documentId - ID del documento local
 * @param fileUri - URI del archivo local
 * @param nombre - Nombre del documento
 * @param categoria - Categoría del documento
 * @param tipoArchivo - Tipo de archivo (pdf, image, other)
 * @param tamano - Tamaño del archivo en bytes
 * @returns ID del documento en Firestore
 */
export async function uploadDocument(
  tripId: string,
  documentId: string,
  fileUri: string,
  nombre: string,
  categoria: CategoriaDocumento,
  tipoArchivo: TipoArchivo,
  tamano: number
): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('[Firestore Documents] Iniciando subida de documento:', nombre);

    // 1. Leer el archivo como blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // 2. Crear referencia en Storage
    const extension = nombre.split('.').pop() || 'bin';
    const storagePath = `trips/${tripId}/documents/${documentId}.${extension}`;
    const storageRef = ref(storage, storagePath);

    console.log('[Firestore Documents] Subiendo archivo a Storage:', storagePath);

    // 3. Subir archivo a Storage
    const uploadResult = await uploadBytes(storageRef, blob, {
      contentType: blob.type,
      customMetadata: {
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        categoria,
        tipoArchivo,
      },
    });

    console.log('[Firestore Documents] Archivo subido, obteniendo URL de descarga...');

    // 4. Obtener URL de descarga
    const storageUrl = await getDownloadURL(uploadResult.ref);

    console.log('[Firestore Documents] URL obtenida, creando registro en Firestore...');

    // 5. Generar ID del documento en Firestore ANTES de crearlo
    const docRef = doc(collection(firestoreDb, 'trips', tripId, 'documents'));
    const firestoreDocId = docRef.id;

    // 6. CRÍTICO: Actualizar SQLite con el firestoreId ANTES de crear el documento en Firestore
    // Esto previene que el listener lo detecte como un documento nuevo
    console.log('[Firestore Documents] ⚠️ Actualizando SQLite ANTES de crear en Firestore');
    const { getDatabase } = await import('@/database');
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE documentos SET firestoreId = ?, updatedAt = ? WHERE id = ?',
      [firestoreDocId, new Date().toISOString(), documentId]
    );
    console.log('[Firestore Documents] ✓ SQLite actualizado con firestoreId:', firestoreDocId);

    // 7. Ahora sí, crear registro en Firestore
    const documentData: FirestoreDocument = {
      nombre,
      categoria,
      tipoArchivo,
      tamano,
      storageUrl,
      storagePath,
      localId: documentId,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: user.uid,
      deletedAt: null,
    };

    await setDoc(docRef, documentData);

    console.log('[Firestore Documents] ✓ Documento subido exitosamente:', firestoreDocId);

    return firestoreDocId;
  } catch (error) {
    logError(error, 'uploadDocument');
    throw new Error(`Error al subir documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Actualiza los metadatos de un documento en Firestore
 */
export async function updateDocumentMetadata(
  tripId: string,
  firestoreDocId: string,
  updates: {
    nombre?: string;
    categoria?: CategoriaDocumento;
  }
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const docRef = doc(firestoreDb, 'trips', tripId, 'documents', firestoreDocId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    console.log('[Firestore Documents] ✓ Metadatos actualizados:', firestoreDocId);
  } catch (error) {
    logError(error, 'updateDocumentMetadata');
    throw error;
  }
}

/**
 * Elimina un documento de Firestore y Storage (soft delete)
 */
export async function deleteDocument(
  tripId: string,
  firestoreDocId: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const docRef = doc(firestoreDb, 'trips', tripId, 'documents', firestoreDocId);

    // Soft delete: marcar como eliminado
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    console.log('[Firestore Documents] ✓ Documento marcado como eliminado:', firestoreDocId);

    // TODO: Implementar limpieza de Storage en Cloud Function
    // Por ahora dejamos el archivo en Storage para recuperación
  } catch (error) {
    logError(error, 'deleteDocument');
    throw error;
  }
}

/**
 * Elimina permanentemente un documento de Storage
 * (Usar con precaución - generalmente llamado desde Cloud Functions)
 */
export async function permanentlyDeleteDocumentFromStorage(
  storagePath: string
): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('[Firestore Documents] ✓ Archivo eliminado de Storage:', storagePath);
  } catch (error) {
    logError(error, 'permanentlyDeleteDocumentFromStorage');
    // No lanzar error - el archivo puede ya no existir
  }
}

// ============================================
// DESCARGA DE DOCUMENTOS
// ============================================

/**
 * Descarga un documento de Storage y lo guarda localmente
 *
 * @param storageUrl - URL de descarga de Firebase Storage
 * @param destinationUri - URI local donde guardar el archivo
 */
export async function downloadDocument(
  storageUrl: string,
  destinationUri: string
): Promise<void> {
  try {
    console.log('[Firestore Documents] Descargando documento desde:', storageUrl);

    // Usar FileReader para leer el blob de manera compatible con React Native
    const response = await fetch(storageUrl);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Usar FileReader para convertir blob a base64 (compatible con React Native)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extraer solo la parte base64 (eliminar el prefijo data:...)
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Error al convertir blob a base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Usar la nueva API de expo-file-system
    const { File } = await import('expo-file-system/next');
    const destinationFile = new File(destinationUri);

    // Escribir archivo en base64
    await destinationFile.write(base64, { encoding: 'base64' });

    console.log('[Firestore Documents] ✓ Documento descargado:', destinationUri);
  } catch (error) {
    logError(error, 'downloadDocument');
    throw new Error(`Error al descargar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Verifica si un archivo existe en Storage
 */
export async function checkDocumentExists(storagePath: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, storagePath);
    await getMetadata(storageRef);
    return true;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    throw error;
  }
}
