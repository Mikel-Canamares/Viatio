import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimits: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por ventana
  },
};

export function validateConfig(): void {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }
}
