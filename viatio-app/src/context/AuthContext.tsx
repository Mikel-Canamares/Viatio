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
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthUser, LoginCredentials, RegisterCredentials, mapFirebaseUser } from '@/types/auth';
import { logError, getUserFriendlyMessage } from '@/utils/errorHandler';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (credentials: LoginCredentials) => Promise<boolean>;
  registerWithEmail: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(message);
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
      const result = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      await updateProfile(result.user, { displayName: credentials.displayName });
      return true;
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
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
