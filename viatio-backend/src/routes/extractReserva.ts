import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import type { ExtractReservaRequest, ExtractReservaResponse } from '../types';

const router = Router();

/**
 * POST /api/extract-reserva
 * Extrae datos estructurados de una imagen de reserva usando Gemini Vision
 */
router.post(
  '/extract-reserva',
  async (req: Request<{}, {}, ExtractReservaRequest>, res: Response<ExtractReservaResponse>): Promise<void> => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      // Validar entrada
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Campo "imageBase64" requerido y debe ser string'
        });
        return;
      }

      // Validar mimeType
      const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
