import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import type { AssistantRequest, AssistantResponse } from '../types';

const router = Router();

router.post('/assistant', async (req: Request, res: Response) => {
  try {
    const { message, context, conversationHistory }: AssistantRequest = req.body;

    // Validación
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Campo "message" requerido y no puede estar vacío',
      } as AssistantResponse);
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
      message: responseMessage,
    } as AssistantResponse);
  } catch (error) {
    console.error('Error en /assistant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al comunicarse con el asistente',
    } as AssistantResponse);
  }
});

export default router;
