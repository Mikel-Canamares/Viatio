/**
 * ROOT NAVIGATOR
 *
 * Navegador raíz que decide entre AuthStack o RootTabs
 * basado en el estado de autenticación del usuario.
 */

import { useAuth } from '@/context';
import { AuthStackNavigator } from './AuthStackNavigator';
import { RootTabs } from './RootTabs';
import { SplashScreen } from '@/screens';

export function RootNavigator() {
  const { user, loading } = useAuth();

  // Mostrar splash mientras carga el estado de autenticación
  if (loading) {
    return <SplashScreen />;
  }

  // Si hay usuario autenticado, mostrar app principal
  // Si no hay usuario, mostrar flujo de autenticación
  return user ? <RootTabs /> : <AuthStackNavigator />;
}
