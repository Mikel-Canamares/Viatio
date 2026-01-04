/**
 * DOCUMENT VIEWER
 *
 * Utilidades para abrir y compartir documentos.
 * Maneja diferentes tipos de archivos en Android e iOS.
 */

import * as IntentLauncher from 'expo-intent-launcher';
import { File } from 'expo-file-system/next';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Linking } from 'react-native';
import type { Documento, TipoArchivo } from '@/types/documento';
import { getDocumentoUri } from '@/services/documentosService';
import { logError } from './errorHandler';
import { showToast } from './toast';

// ============================================
// MIME TYPE DETECTION
// ============================================

/**
 * Obtiene el MIME type según el tipo de archivo y nombre
 */
export function getMimeType(tipoArchivo: TipoArchivo, filename: string): string {
  if (tipoArchivo === 'pdf') {
    return 'application/pdf';
  }

  if (tipoArchivo === 'image') {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  return 'application/octet-stream';
}

// ============================================
// OPEN DOCUMENT
// ============================================

/**
 * Abre un documento con la aplicación predeterminada del sistema
 */
export async function openDocument(documento: Documento): Promise<void> {
  try {
    const uri = getDocumentoUri(documento);

    // Verificar que el archivo existe usando la nueva API
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('El archivo no existe');
    }

    const mimeType = getMimeType(documento.tipoArchivo, documento.nombre);

    if (Platform.OS === 'android') {
      // Android: usar IntentLauncher con legacy getContentUriAsync
      const contentUri = await FileSystemLegacy.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mimeType,
      });
    } else {
      // iOS: intentar abrir con Linking, si falla usar Sharing
      const canOpen = await Linking.canOpenURL(uri);

      if (canOpen) {
        await Linking.openURL(uri);
      } else {
        // Si Linking no funciona, usar Sharing como alternativa
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType,
            dialogTitle: `Abrir ${documento.nombre}`,
          });
        } else {
          throw new Error('No se puede abrir el documento en este dispositivo');
        }
      }
    }
  } catch (error) {
    logError(error, 'openDocument');

    // Mensaje de error específico para el usuario
    if (error instanceof Error && error.message === 'El archivo no existe') {
      showToast.error('Error', 'El archivo no se encuentra en el dispositivo');
    } else {
      showToast.error(
        'No se puede abrir',
        'No hay ninguna aplicación instalada que pueda abrir este tipo de archivo'
      );
    }

    throw error;
  }
}

// ============================================
// SHARE DOCUMENT
// ============================================

/**
 * Comparte un documento usando el sistema de compartir nativo
 */
export async function shareDocument(documento: Documento): Promise<void> {
  try {
    const uri = getDocumentoUri(documento);

    // Verificar que el archivo existe usando la nueva API
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('El archivo no existe');
    }

    // Verificar si el sistema soporta sharing
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Compartir no está disponible en este dispositivo');
    }

    const mimeType = getMimeType(documento.tipoArchivo, documento.nombre);

    // Compartir el documento
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: `Compartir ${documento.nombre}`,
      UTI: documento.tipoArchivo === 'pdf' ? 'com.adobe.pdf' : undefined,
    });
  } catch (error) {
    logError(error, 'shareDocument');

    // Mensaje de error específico para el usuario
    if (error instanceof Error && error.message === 'El archivo no existe') {
      showToast.error('Error', 'El archivo no se encuentra en el dispositivo');
    } else if (error instanceof Error && error.message.includes('no está disponible')) {
      showToast.error('Error', 'Compartir archivos no está disponible en este dispositivo');
    } else {
      showToast.error('Error', 'No se pudo compartir el documento');
    }

    throw error;
  }
}
