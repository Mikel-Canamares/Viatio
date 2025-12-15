/**
 * GOOGLE AUTH SERVICE
 *
 * Servicio para autenticación con Google usando OAuth 2.0.
 * Soporta Web, iOS y Android con configuraciones específicas por plataforma.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { logError } from '@/utils/errorHandler';

// ============================================
// SETUP
// ============================================

// Necesario para que el navegador se cierre correctamente en web
WebBrowser.maybeCompleteAuthSession();

// Configuración de clientes OAuth por plataforma
const config = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook para iniciar el flujo de autenticación con Google.
 * Usa expo-auth-session para manejar el flujo OAuth.
 *
 * @returns Objeto con request, response y función promptAsync para iniciar el flujo
 *
 * @example
 * const { request, response, promptAsync } = useGoogleAuth();
 *
 * // En el evento del botón "Sign in with Google"
 * await promptAsync();
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
  });

  return {
    request,
    response,
    promptAsync,
  };
}

// ============================================
// AUTENTICACIÓN
// ============================================

/**
 * Autentica al usuario en Firebase usando el ID Token de Google.
 *
 * @param idToken - ID Token obtenido del flujo OAuth de Google
 * @returns Promise<boolean> - true si la autenticación fue exitosa
 * @throws Error si falla la autenticación con Firebase
 *
 * @example
 * try {
 *   const success = await signInWithGoogleCredential(idToken);
 *   if (success) {
 *     // Usuario autenticado
 *   }
 * } catch (error) {
 *   // Manejar error
 * }
 */
export async function signInWithGoogleCredential(idToken: string): Promise<boolean> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
    return true;
  } catch (error) {
    logError(error, 'signInWithGoogleCredential');
    throw error;
  }
}
