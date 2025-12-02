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
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthUser, LoginCredentials, RegisterCredentials, mapFirebaseUser } from '@/types/auth';
import {
  logError,
  getUserFriendlyMessage,
  shouldSuggestRegister,
  shouldSuggestLogin,
} from '@/utils/errorHandler';

/**
 * Tipo para errores de autenticación con sugerencias
 */
export interface AuthError {
  message: string;
  suggestRegister?: boolean;
  suggestLogin?: boolean;
  originalError?: unknown;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  loginWithEmail: (credentials: LoginCredentials) => Promise<boolean>;
  registerWithEmail: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  resendVerificationEmail: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        setUser(null);
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

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail,
        registerWithEmail,
        logout,
        clearError,
        resendVerificationEmail,
        resetPassword,
        refreshUser,
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
