/**
 * Configuración de variables de entorno
 *
 * TODO: Configurar expo-constants para cargar desde .env
 * Por ahora usamos valores placeholder para que la app funcione sin Firebase/Google Maps
 */

interface EnvConfig {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  GOOGLE_MAPS_API_KEY: string;
  BACKEND_URL: string;
}

// Valores placeholder temporales
// Cuando implementemos Firebase/Maps, configuraremos expo-constants correctamente
const env: EnvConfig = {
  FIREBASE_API_KEY: '',
  FIREBASE_AUTH_DOMAIN: '',
  FIREBASE_PROJECT_ID: '',
  GOOGLE_MAPS_API_KEY: '',
  BACKEND_URL: '',
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
