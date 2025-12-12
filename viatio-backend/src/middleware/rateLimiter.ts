import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimits.windowMs,
  max: config.rateLimits.max,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite más estricto para endpoints de IA
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: {
    error: 'AI rate limit exceeded, please wait before trying again.',
  },
});
