/**
 * AUTH CONTEXT
 *
 * Context de React para autenticación con Firebase.
 * Proporciona estado de usuario y funciones de auth a toda la app.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  linkWithCredential,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthUser, LoginCredentials, RegisterCredentials, mapFirebaseUser } from '@/types/auth';
import {
  logError,
  getUserFriendlyMessage,
  shouldSuggestRegister,
  shouldSuggestLogin,
} from '@/utils/errorHandler';
import { upsertUser } from '@/services/firestore/usersService';
import { processPendingInvitations } from '@/services/firestore/invitesService';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';

/**
 * Tipo para errores de autenticación con sugerencias
 */
export interface AuthError {
  message: string;
  suggestRegister?: boolean;
  suggestLogin?: boolean;
  needsLinking?: boolean;
  pendingCredential?: string;
  email?: string;
  originalError?: unknown;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  loginWithEmail: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  registerWithEmail: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  resendVerificationEmail: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  linkGoogleAccount: (idToken: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthContext] Usuario autenticado, creando documento en Firestore...', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        // Crear/actualizar documento en Firestore
        try {
          const result = await upsertUser(firebaseUser.uid, {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || null,
          });

          if (result) {
            console.log('[AuthContext] ✅ Documento creado/actualizado en Firestore:', result.uid);

            // Procesar invitaciones pendientes para este email
            if (firebaseUser.email) {
              console.log('[AuthContext] Verificando invitaciones pendientes...');
              const notificationsCreated = await processPendingInvitations(
                firebaseUser.email,
                firebaseUser.uid
              );

              if (notificationsCreated > 0) {
                console.log(`[AuthContext] ✅ ${notificationsCreated} notificaciones creadas desde invitaciones pendientes`);
              }
            }
          } else {
            console.warn('[AuthContext] ⚠️ upsertUser devolvió null');
          }
        } catch (error) {
          console.error('[AuthContext] ❌ Error al crear documento en Firestore:', error);
        }

        setUser(mapFirebaseUser(firebaseUser));

        // Cargar configuración del usuario autenticado
        useConfiguracionStore.getState().loadConfig(firebaseUser.uid);

        // Registrar push token para notificaciones (no bloqueante)
        import('@/services/pushTokenService').then(({ registerPushToken }) => {
          registerPushToken().catch((error) => {
            console.error('[AuthContext] Error al registrar push token:', error);
          });
        });
      } else {
        setUser(null);

        // Limpiar configuración al hacer logout
        useConfiguracionStore.getState().clearLocalConfig();

        // Eliminar push token al hacer logout (no bloqueante)
        import('@/services/pushTokenService').then(({ unregisterPushToken }) => {
          unregisterPushToken().catch((error) => {
            console.error('[AuthContext] Error al eliminar push token:', error);
          });
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      return true;
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError({
        message,
        suggestRegister: shouldSuggestRegister(err),
        originalError: err,
      });
      logError(err, 'loginWithEmail');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      return true;
    } catch (err: any) {
      // Detectar cuenta existente con otro proveedor
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError({
          message: 'Este email ya está registrado con otro método. Puedes vincular tu cuenta de Google.',
          needsLinking: true,
          pendingCredential: idToken,
          email: err.customData?.email || '',
          originalError: err,
        });
        return false;
      }

      const message = getUserFriendlyMessage(err);
      setError({ message, originalError: err });
      logError(err, 'loginWithGoogle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Crear usuario
      const result = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Actualizar perfil con nombre
      await updateProfile(result.user, { displayName: credentials.displayName });

      // Enviar email de verificación
      await sendEmailVerification(result.user, {
        url: 'https://viatio-app-d0e13.firebaseapp.com/__/auth/action',
        handleCodeInApp: false,
      });

      return true;
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError({
        message,
        suggestLogin: shouldSuggestLogin(err),
        originalError: err,
      });
      logError(err, 'registerWithEmail');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (err) {
      logError(err, 'logout');
    }
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        return true;
      }
      return false;
    } catch (err) {
      logError(err, 'resendVerificationEmail');
      setError({
        message: getUserFriendlyMessage(err),
      });
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetEmail(auth, email, {
        url: 'https://viatio-app-d0e13.firebaseapp.com/__/auth/action',
        handleCodeInApp: false,
      });

      return true;
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError({ message, originalError: err });
      logError(err, 'resetPassword');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        // Forzar actualización del estado
        setUser(mapFirebaseUser(auth.currentUser));
      }
    } catch (err) {
      logError(err, 'refreshUser');
    }
  };

  const linkGoogleAccount = async (idToken: string, password: string): Promise<boolean> => {
    try {
      if (!auth.currentUser?.email) {
        setError({
          message: 'No se pudo obtener el email de la cuenta actual',
        });
        return false;
      }

      setLoading(true);
      setError(null);

      // 1. Re-autenticar con contraseña actual
      const emailCred = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, emailCred);

      // 2. Vincular con Google
      const googleCred = GoogleAuthProvider.credential(idToken);
      await linkWithCredential(auth.currentUser, googleCred);

      return true;
    } catch (err: any) {
      const message = getUserFriendlyMessage(err);
      setError({ message, originalError: err });
      logError(err, 'linkGoogleAccount');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
        clearError,
        resendVerificationEmail,
        resetPassword,
        refreshUser,
        linkGoogleAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
