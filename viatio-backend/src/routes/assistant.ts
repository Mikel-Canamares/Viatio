import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import type { AssistantRequest, AssistantResponse } from '../types';

const router = Router();

/**
 * POST /api/assistant
 * Chat con el asistente de viaje usando Gemini
 */
router.post(
  '/assistant',
  async (req: Request<{}, {}, AssistantRequest>, res: Response<AssistantResponse>): Promise<void> => {
    try {
      const { message, context, conversationHistory } = req.body;

      // Validar entrada
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Campo "message" requerido y no puede estar vacío'
        });
        return;
      }

      // Validar formato de conversationHistory si existe
      if (conversationHistory && !Array.isArray(conversationHistory)) {
        res.status(400).json({
          success: false,
          error: 'conversationHistory debe ser un array'
        });
        return;
      }

      // Llamar a Gemini
      const responseMessage = await geminiService.chatAssistant(
        message,
        context,
        conversationHistory
      );

      res.json({
        success: true,
        message: responseMessage
      });
    } catch (error) {
      console.error('Error en /assistant:', error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al comunicarse con el asistente'
      });
    }
  }
);

export default router;
