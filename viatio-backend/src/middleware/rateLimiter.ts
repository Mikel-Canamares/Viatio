import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutos por defecto
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests por ventana
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
