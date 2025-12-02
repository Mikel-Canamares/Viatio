/**
 * ROOT NAVIGATOR
 *
 * Navegador raíz que decide entre AuthStack, VerifyEmailScreen o RootTabs
 * basado en el estado de autenticación y verificación del usuario.
 */

import { useAuth } from '@/context';
import { AuthStackNavigator } from './AuthStackNavigator';
import { RootTabs } from './RootTabs';
import { SplashScreen, VerifyEmailScreen } from '@/screens';

export function RootNavigator() {
  const { user, loading } = useAuth();

  // Mostrar splash mientras carga el estado de autenticación
  if (loading) {
    return <SplashScreen />;
  }

  // Si no hay usuario, mostrar flujo de autenticación
  if (!user) {
    return <AuthStackNavigator />;
  }

  // Si hay usuario pero no ha verificado su email, mostrar pantalla de verificación
  if (user && !user.emailVerified) {
    return <VerifyEmailScreen />;
  }

  // Usuario autenticado y verificado, mostrar app principal
  return <RootTabs />;
}
