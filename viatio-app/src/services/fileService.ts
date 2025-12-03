/**
 * FILE SERVICE
 *
 * Servicio para gestión de archivos: documentos, imágenes y conversiones.
 * Utiliza expo-document-picker, expo-image-picker y expo-file-system.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

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

// ============================================
// IMAGE PICKER
// ============================================

/**
 * Permite capturar una foto o seleccionar de la galería
 * Retorna URI y base64 de la imagen o null si se cancela
 */
export async function pickImage(useCamera = false): Promise<ImageInfo | null> {
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
          quality: 0.8,
          base64: true,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
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
 */
export async function readFileAsBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

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
