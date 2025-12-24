/**
 * FILE SERVICE
 *
 * Servicio para gestión de archivos: documentos, imágenes y conversiones.
 * Utiliza expo-document-picker, expo-image-picker y expo-file-system.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';

// ============================================
// TYPES
// ============================================

export interface DocumentInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface ImageInfo {
  uri: string;
  base64?: string;
}

// ============================================
// DOCUMENT PICKER
// ============================================

/**
 * Permite seleccionar un documento (PDF o imagen)
 * Retorna información del documento o null si se cancela
 */
export async function pickDocument(): Promise<DocumentInfo | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    };
  } catch (error) {
    console.error('[FileService] Error picking document:', error);
    throw new Error('Error al seleccionar el documento');
  }
}

/**
 * Permite seleccionar múltiples documentos (PDFs o imágenes)
 * Retorna array de información de documentos o array vacío si se cancela
 */
export async function pickMultipleDocuments(): Promise<DocumentInfo[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true, // Habilitar selección múltiple
    });

    if (result.canceled) {
      return [];
    }

    // Mapear todos los assets a DocumentInfo
    return result.assets.map(asset => ({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    }));
  } catch (error) {
    console.error('[FileService] Error picking multiple documents:', error);
    throw new Error('Error al seleccionar los documentos');
  }
}

// ============================================
// IMAGE PICKER
// ============================================

/**
 * Permite capturar una foto o seleccionar de la galería
 * Retorna URI y base64 de la imagen o null si se cancela
 */
export async function pickImage(useCamera = false, quality = 0.8): Promise<ImageInfo | null> {
  try {
    // Solicitar permisos
    let permissionResult;

    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permissionResult.granted) {
      throw new Error(
        useCamera
          ? 'Se necesitan permisos de cámara para tomar fotos'
          : 'Se necesitan permisos de galería para seleccionar imágenes'
      );
    }

    // Lanzar picker
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality, // Usar parámetro de calidad configurable
          base64: true,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality, // Usar parámetro de calidad configurable
          base64: true,
          allowsEditing: false,
        });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      base64: asset.base64 || undefined,
    };
  } catch (error) {
    console.error('[FileService] Error picking image:', error);
    throw error;
  }
}

// ============================================
// FILE SYSTEM
// ============================================

/**
 * Lee un archivo y lo convierte a base64
 * Usa la nueva API de expo-file-system (SDK 52+)
 */
export async function readFileAsBase64(uri: string): Promise<string> {
  try {
    // Usar la nueva API de FileSystem con File class (SDK 52+)
    const file = new File(uri);
    const arrayBuffer = await file.arrayBuffer();

    // Convertir ArrayBuffer a base64 usando Buffer (incluido en React Native)
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return base64;
  } catch (error) {
    console.error('[FileService] Error reading file as base64:', error);
    throw new Error('Error al leer el archivo');
  }
}

// ============================================
// FILE TYPE HELPERS
// ============================================

/**
 * Verifica si un tipo MIME corresponde a una imagen
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Verifica si un tipo MIME corresponde a un PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

// ============================================
// FILE SIZE HELPERS
// ============================================

/**
 * Formatea bytes a formato legible (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================
// FILE NAME HELPERS
// ============================================

/**
 * Extrae la extensión de un nombre de archivo
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}
