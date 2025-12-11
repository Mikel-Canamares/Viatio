/**
 * Configuración de variables de entorno
 *
 * Las variables con prefijo EXPO_PUBLIC_ son automáticamente inyectadas por Expo
 * desde el archivo .env en la raíz del proyecto
 */

export const config = {
  // Firebase
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },

  // Google Maps
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // Backend
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
};

// Exportar valores individuales para retrocompatibilidad
export const FIREBASE_API_KEY = config.firebase.apiKey;
export const FIREBASE_AUTH_DOMAIN = config.firebase.authDomain;
export const FIREBASE_PROJECT_ID = config.firebase.projectId;
export const GOOGLE_MAPS_API_KEY = config.googleMapsApiKey;
export const BACKEND_URL = config.backendUrl;

export default config;
