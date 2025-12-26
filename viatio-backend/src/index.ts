import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, aiLimiter } from './middleware/rateLimiter';
import healthRouter from './routes/health';
import extractReservaRouter from './routes/extractReserva';
import assistantRouter from './routes/assistant';
import copilotRouter from './routes/copilot';

// Validar configuración antes de iniciar
validateConfig();

const app = express();

// Middleware global
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' })); // Para imágenes base64
app.use(apiLimiter);

// Rutas
app.use('/health', healthRouter);
app.use('/api/extract-reserva', aiLimiter, extractReservaRouter);
app.use('/api/assistant', aiLimiter, assistantRouter);
app.use('/api/copilot', aiLimiter, copilotRouter);

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
});
