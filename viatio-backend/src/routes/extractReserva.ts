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
      const { imageBase64, mimeType = 'image/jpeg', images } = req.body;

      // Debug: Log del request
      console.log('[extractReserva] Request body keys:', Object.keys(req.body));

      // Validar mimeTypes permitidos
      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf'
      ];

      // OPCIÓN 1: Múltiples imágenes (nuevo formato)
      if (images && Array.isArray(images)) {
        console.log('[extractReserva] Procesando múltiples imágenes:', images.length);

        // Validar que el array no esté vacío
        if (images.length === 0) {
          res.status(400).json({
            success: false,
            error: 'El array "images" no puede estar vacío'
          });
          return;
        }

        // Validar cada imagen
        for (let i = 0; i < images.length; i++) {
          const img = images[i];

          if (!img.base64 || typeof img.base64 !== 'string') {
            res.status(400).json({
              success: false,
              error: `Imagen ${i + 1}: campo "base64" requerido y debe ser string`
            });
            return;
          }

          if (!img.mimeType || !validMimeTypes.includes(img.mimeType)) {
            res.status(400).json({
              success: false,
              error: `Imagen ${i + 1}: mimeType inválido. Permitidos: ${validMimeTypes.join(', ')}`
            });
            return;
          }

          console.log(`[extractReserva] Imagen ${i + 1}: mimeType=${img.mimeType}, size=${(img.base64.length / 1024).toFixed(2)}KB`);
        }

        // Llamar al servicio de Gemini con múltiples imágenes
        const extractedData = await geminiService.extractReservaFromImage(images);

        res.json({
          success: true,
          data: extractedData
        });
        return;
      }

      // OPCIÓN 2: Una sola imagen (formato legacy)
      if (imageBase64) {
        console.log('[extractReserva] Procesando una imagen (formato legacy)');
        console.log('[extractReserva] mimeType:', mimeType);
        console.log('[extractReserva] imageBase64 type:', typeof imageBase64);
        console.log('[extractReserva] imageBase64 length:', imageBase64?.length);

        // Validar entrada
        if (typeof imageBase64 !== 'string') {
          console.error('[extractReserva] Validation failed - imageBase64:', imageBase64);
          res.status(400).json({
            success: false,
            error: 'Campo "imageBase64" debe ser string'
          });
          return;
        }

        // Validar mimeType
        if (mimeType && !validMimeTypes.includes(mimeType)) {
          res.status(400).json({
            success: false,
            error: `mimeType inválido. Permitidos: ${validMimeTypes.join(', ')}`
          });
          return;
        }

        // Llamar al servicio de Gemini con una sola imagen
        const extractedData = await geminiService.extractReservaFromImage(
          imageBase64,
          mimeType
        );

        res.json({
          success: true,
          data: extractedData
        });
        return;
      }

      // Si no hay ni imageBase64 ni images, error
      res.status(400).json({
        success: false,
        error: 'Debe proporcionar "imageBase64" (string) o "images" (array)'
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
