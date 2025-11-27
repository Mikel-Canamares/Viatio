/**
 * Configuración de variables de entorno
 *
 * Este archivo valida y exporta las variables de entorno necesarias para la aplicación.
 * Lanza errores descriptivos si faltan variables obligatorias.
 */

interface EnvConfig {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  GOOGLE_MAPS_API_KEY: string;
  BACKEND_URL: string;
}

/**
 * Valida que una variable de entorno obligatoria existe
 * @param key - Nombre de la variable
 * @param value - Valor de la variable
 * @throws Error si la variable es undefined o string vacío
 */
function validateRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `❌ Variable de entorno obligatoria faltante: ${key}\n\n` +
      `Por favor, asegúrate de que existe un archivo .env en la raíz del proyecto\n` +
      `con la siguiente variable definida:\n\n` +
      `${key}=tu_valor_aqui\n\n` +
      `Consulta el archivo .env.template para ver un ejemplo.`
    );
  }
  return value;
}

/**
 * Obtiene una variable de entorno opcional
 * @param key - Nombre de la variable
 * @param defaultValue - Valor por defecto si no existe
 */
function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// Validar y exportar variables de entorno
const env: EnvConfig = {
  // Firebase Configuration
  FIREBASE_API_KEY: validateRequiredEnv(
    'FIREBASE_API_KEY',
    process.env.FIREBASE_API_KEY
  ),
  FIREBASE_AUTH_DOMAIN: validateRequiredEnv(
    'FIREBASE_AUTH_DOMAIN',
    process.env.FIREBASE_AUTH_DOMAIN
  ),
  FIREBASE_PROJECT_ID: validateRequiredEnv(
    'FIREBASE_PROJECT_ID',
    process.env.FIREBASE_PROJECT_ID
  ),

  // Google Maps API
  GOOGLE_MAPS_API_KEY: validateRequiredEnv(
    'GOOGLE_MAPS_API_KEY',
    process.env.GOOGLE_MAPS_API_KEY
  ),

  // Backend URL (opcional)
  BACKEND_URL: getOptionalEnv('BACKEND_URL', ''),
};

// Exportar constantes inmutables
export const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  GOOGLE_MAPS_API_KEY,
  BACKEND_URL,
} = env;

// Exportar objeto completo como default
export default env;
