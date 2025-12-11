import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  GEMINI_API_KEY: string;
  NODE_ENV: 'development' | 'production';
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

function validateEnv(): EnvConfig {
  const requiredVars = ['GEMINI_API_KEY'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}\n` +
      'Por favor, copia .env.example a .env y configura las variables.'
    );
  }

  return {
    PORT: parseInt(process.env.PORT || '3000', 10),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

export const env = validateEnv();
