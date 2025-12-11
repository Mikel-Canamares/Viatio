import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { limiter } from './middleware/rateLimiter';

// Routes
import healthRoutes from './routes/health';
import extractReservaRoutes from './routes/extractReserva';
import assistantRoutes from './routes/assistant';

const app = express();

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' })); // Para imágenes base64
app.use(limiter);

// Routes
app.use('/api', healthRoutes);
app.use('/api', extractReservaRoutes);
app.use('/api', assistantRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Viatio Backend corriendo en puerto ${env.PORT}`);
  console.log(`📍 Entorno: ${env.NODE_ENV}`);
  console.log(`🔑 Gemini API Key configurada: ${env.GEMINI_API_KEY ? '✅' : '❌'}`);
});
