/**
 * GOOGLE AUTH SERVICE
 *
 * Servicio para autenticación con Google usando OAuth 2.0.
 *
 * - Android: Usa @react-native-google-signin/google-signin (SDK nativo)
 * - iOS/Web: Usa expo-auth-session (flujo basado en navegador)
 */

import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
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
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

// Configurar Google Sign-In para Android
if (Platform.OS === 'android') {
  GoogleSignin.configure({
    webClientId: config.webClientId,
  });
}

// ============================================
// HOOKS (solo para iOS/Web)
// ============================================

/**
 * Hook para iniciar el flujo de autenticación con Google en iOS/Web.
 * Usa expo-auth-session para manejar el flujo OAuth.
 *
 * IMPORTANTE: En Android, usa directamente signInWithGoogle() en lugar de este hook.
 *
 * @returns Objeto con request, response y función promptAsync para iniciar el flujo
 */
export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({
    scheme: 'com.viatio.app',
    path: 'oauth2redirect/google',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: config.iosClientId,
    webClientId: config.webClientId,
    redirectUri,
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
 * Inicia sesión con Google usando el método nativo apropiado para cada plataforma.
 *
 * - Android: Usa GoogleSignin.signIn() (SDK nativo)
 * - iOS/Web: Lanza error (usar useGoogleAuth hook)
 *
 * @returns Promise<boolean> - true si la autenticación fue exitosa
 * @throws Error si falla la autenticación
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // Android: Usar SDK nativo
      console.log('[GoogleAuth] Iniciando Google Sign-In nativo en Android');

      // Verificar si Google Play Services está disponible
      await GoogleSignin.hasPlayServices();

      // Iniciar sesión
      const userInfo = await GoogleSignin.signIn();

      console.log('[GoogleAuth] Usuario autenticado:', JSON.stringify(userInfo, null, 2));

      // Obtener el ID token (estructura: userInfo.data.idToken)
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        console.error('[GoogleAuth] No se encontró idToken en userInfo:', userInfo);
        throw new Error('No se pudo obtener el ID token de Google');
      }

      console.log('[GoogleAuth] ID Token obtenido correctamente');

      // Autenticar en Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      console.log('[GoogleAuth] Usuario autenticado en Firebase');
      return true;
    } else {
      throw new Error(
        'signInWithGoogle() solo está disponible en Android. En iOS/Web, usa useGoogleAuth hook.'
      );
    }
  } catch (error) {
    logError(error, 'signInWithGoogle');
    throw error;
  }
}

/**
 * Autentica al usuario en Firebase usando el ID Token de Google.
 * Usado por el flujo de iOS/Web con expo-auth-session.
 *
 * @param idToken - ID Token obtenido del flujo OAuth de Google
 * @returns Promise<boolean> - true si la autenticación fue exitosa
 * @throws Error si falla la autenticación con Firebase
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

/**
 * Cierra la sesión de Google.
 */
export async function signOutGoogle(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    logError(error, 'signOutGoogle');
  }
}
