/**
 * FIREBASE CONFIG
 *
 * Configuración de Firebase para autenticación y servicios backend.
 * Se configura persistencia explícita con AsyncStorage para React Native.
 */

import { initializeApp, getApps } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence existe en runtime pero tiene issues de tipos en Firebase 12
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase App
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar Auth con persistencia explícita para React Native
// Se usa AsyncStorage para mantener la sesión entre cierres de app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app };
