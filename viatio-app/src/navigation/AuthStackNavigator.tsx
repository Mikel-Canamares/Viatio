/**
 * AUTH STACK NAVIGATOR
 *
 * Stack Navigator para el flujo de autenticación.
 * Incluye login, registro y recuperación de contraseña.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, RegisterScreen } from '@/screens';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* ForgotPassword se añadirá en fase posterior */}
    </Stack.Navigator>
  );
}
