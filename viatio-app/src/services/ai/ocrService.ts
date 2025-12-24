/**
 * OCR SERVICE
 *
 * Servicio para extraer información de imágenes de documentos de viaje.
 * Usa Gemini AI a través del backend para procesar documentos y extraer datos estructurados.
 */

import type { CreateReservaInput } from '@/types/reserva';
import { logError } from '@/utils/errorHandler';
import { config } from '@/config/env';

const API_TIMEOUT = 30000; // 30 segundos

// ============================================
// TYPES
// ============================================

interface OcrResult {
  success: boolean;
  data?: Partial<CreateReservaInput>;
  confianza?: 'alta' | 'media' | 'baja';
  error?: string;
}

// ============================================
// OCR EXTRACTION
// ============================================

/**
 * Extrae información de reserva desde una o múltiples imágenes usando Gemini AI
 * Las imágenes se envían al backend que procesa con Gemini y retorna datos estructurados
 */
export async function extractReservaFromImage(
  imageBase64: string,
  mimeType?: string
): Promise<OcrResult>;
export async function extractReservaFromImage(
  images: Array<{ base64: string; mimeType: string }>
): Promise<OcrResult>;
export async function extractReservaFromImage(
  imageOrImages: string | Array<{ base64: string; mimeType: string }>,
  mimeType: string = 'image/jpeg'
): Promise<OcrResult> {
  try {
    if (!config.backendUrl) {
      throw new Error('Backend URL not configured');
    }

    console.log('[OCR] Backend URL:', config.backendUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    let payload: any;

    // Determinar si es una imagen o múltiples
    if (typeof imageOrImages === 'string') {
      // Modo legacy: una sola imagen
      console.log('[OCR] Procesando UNA imagen');
      console.log('[OCR] imageBase64 type:', typeof imageOrImages);
      console.log('[OCR] imageBase64 length:', imageOrImages.length);
      console.log('[OCR] mimeType:', mimeType);

      payload = {
        imageBase64: imageOrImages,
        mimeType,
      };
    } else {
      // Modo nuevo: múltiples imágenes
      console.log('[OCR] Procesando MÚLTIPLES imágenes:', imageOrImages.length);

      for (let i = 0; i < imageOrImages.length; i++) {
        const img = imageOrImages[i];
        console.log(`[OCR] Imagen ${i + 1}: mimeType=${img.mimeType}, size=${(img.base64.length / 1024).toFixed(2)}KB`);
      }

      payload = {
        images: imageOrImages,
      };
    }

    console.log('[OCR] Payload keys:', Object.keys(payload));
    console.log('[OCR] Sending request to:', `${config.backendUrl}/api/extract-reserva`);

    const response = await fetch(`${config.backendUrl}/api/extract-reserva`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[OCR] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] Error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // El backend ya devuelve los datos en el formato correcto
    if (!result.success || !result.data) {
      throw new Error(result.error || 'No data received from API');
    }

    return {
      success: true,
      data: result.data,
      confianza: result.data.confianza || 'media',
    };
  } catch (error) {
    logError(error, 'extractReservaFromImage');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

