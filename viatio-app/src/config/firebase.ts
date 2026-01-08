import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence existe en runtime pero tiene issues de tipos en Firebase 12
  getReactNativePersistence
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth con persistencia
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore con persistencia offline
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

// Storage para archivos
export const storage = getStorage(app);

// Función para verificar conexión
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    // Intentar leer un documento inexistente (no falla, solo retorna null)
    await getDoc(doc(db, '_health', 'check'));
    return true;
  } catch (error) {
    console.error('[Firestore] Connection check failed:', error);
    return false;
  }
}

export default app;
