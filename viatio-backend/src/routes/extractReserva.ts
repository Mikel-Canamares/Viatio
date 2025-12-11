import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import type { ExtractReservaRequest, ExtractReservaResponse } from '../types';

const router = Router();

router.post('/extract-reserva', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' }: ExtractReservaRequest = req.body;

    // Validación
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Campo "imageBase64" requerido y debe ser string',
      } as ExtractReservaResponse);
      return;
    }

    // Extraer datos con Gemini
    const data = await geminiService.extractReservaFromImage(imageBase64, mimeType);

    res.json({
      success: true,
      data,
    } as ExtractReservaResponse);
  } catch (error) {
    console.error('Error en /extract-reserva:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar la imagen',
    } as ExtractReservaResponse);
  }
});

export default router;
