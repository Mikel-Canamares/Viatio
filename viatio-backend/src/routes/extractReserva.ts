import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import type { ExtractReservaRequest, ExtractReservaResponse } from '../types';

const router = Router();

/**
 * POST /api/extract-reserva
 * Extrae datos estructurados de una imagen de reserva usando Gemini Vision
 */
router.post(
  '/',
  async (req: Request<{}, {}, ExtractReservaRequest>, res: Response<ExtractReservaResponse>): Promise<void> => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      // Debug: Log del request
      console.log('[extractReserva] Request body keys:', Object.keys(req.body));
      console.log('[extractReserva] mimeType:', mimeType);
      console.log('[extractReserva] imageBase64 type:', typeof imageBase64);
      console.log('[extractReserva] imageBase64 length:', imageBase64?.length);

      // Validar entrada
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        console.error('[extractReserva] Validation failed - imageBase64:', imageBase64);
        res.status(400).json({
          success: false,
          error: 'Campo "imageBase64" requerido y debe ser string'
        });
        return;
      }

      // Validar mimeType (Gemini Vision soporta imágenes y PDFs)
      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf'
      ];
      if (mimeType && !validMimeTypes.includes(mimeType)) {
        res.status(400).json({
          success: false,
          error: `mimeType inválido. Permitidos: ${validMimeTypes.join(', ')}`
        });
        return;
      }

      // Llamar al servicio de Gemini
      const extractedData = await geminiService.extractReservaFromImage(
        imageBase64,
        mimeType
      );

      res.json({
        success: true,
        data: extractedData
      });
    } catch (error) {
      console.error('Error en /extract-reserva:', error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar la imagen'
      });
    }
  }
);

export default router;
