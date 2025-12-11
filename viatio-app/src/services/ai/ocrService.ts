/**
 * OCR SERVICE
 *
 * Servicio para extraer información de imágenes de documentos de viaje.
 * Usa Gemini AI a través del backend para procesar documentos y extraer datos estructurados.
 */

import { buildOcrPrompt } from './geminiPrompt';
import type { CreateReservaInput, CategoriaReserva } from '@/types/reserva';
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
 * Extrae información de reserva desde una imagen usando Gemini AI
 * La imagen se envía al backend que procesa con Gemini y retorna datos estructurados
 */
export async function extractReservaFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<OcrResult> {
  try {
    if (!config.backendUrl) {
      throw new Error('Backend URL not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${config.backendUrl}/api/extract-reserva`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        mimeType,
        systemPrompt: buildOcrPrompt(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Mapear respuesta a CreateReservaInput
    const reservaData = mapOcrResponseToReserva(result);

    return {
      success: true,
      data: reservaData,
      confianza: result.confianza || 'media',
    };
  } catch (error) {
    logError(error, 'extractReservaFromImage');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Mapea la respuesta del OCR al formato CreateReservaInput
 */
function mapOcrResponseToReserva(response: any): Partial<CreateReservaInput> {
  return {
    categoria: validateCategoria(response.categoria),
    nombre: response.nombre || '',
    proveedor: response.proveedor || undefined,
    numeroConfirmacion: response.numeroConfirmacion || undefined,
    fechaInicio: response.fechaInicio || undefined,
    horaInicio: response.horaInicio || undefined,
    fechaFin: response.fechaFin || undefined,
    horaFin: response.horaFin || undefined,
    ubicacion: response.ubicacion || undefined,
    direccion: response.direccion || undefined,
    precio: typeof response.precio === 'number' ? response.precio : undefined,
    moneda: response.moneda || 'EUR',
    metadatos: response.metadatos || undefined,
  };
}

/**
 * Valida que la categoría sea válida, retorna 'other' si no lo es
 */
function validateCategoria(cat: string): CategoriaReserva {
  const valid: CategoriaReserva[] = ['transport', 'accommodation', 'food', 'activity', 'other'];
  return valid.includes(cat as CategoriaReserva) ? (cat as CategoriaReserva) : 'other';
}
