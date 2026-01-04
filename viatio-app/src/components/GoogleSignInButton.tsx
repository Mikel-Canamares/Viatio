/**
 * GOOGLE SIGN-IN BUTTON
 *
 * Componente reutilizable para inicio de sesión/registro con Google.
 * Maneja automáticamente Android (SDK nativo) e iOS/Web (expo-auth-session).
 */

import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { useGoogleAuth, signInWithGoogle } from '@/services/auth/googleAuthService';

interface GoogleSignInButtonProps {
  /** Texto del botón */
  text?: string;

  /** Callback al completar sign-in (para iOS/Web) */
  onSuccess?: (idToken: string) => void;

  /** Callback en caso de error */
  onError?: (error: unknown) => void;

  /** Si el botón está deshabilitado */
  disabled?: boolean;

  /** Estilo adicional para el botón */
  style?: any;
}

export function GoogleSignInButton({
  text = 'Continuar con Google',
  onSuccess,
  onError,
  disabled = false,
  style,
}: GoogleSignInButtonProps) {
  const googleAuth = Platform.OS !== 'android' ? useGoogleAuth() : null;

  const handlePress = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android: SDK nativo maneja todo el flujo incluida la autenticación en Firebase
        await signInWithGoogle();
      } else {
        // iOS/Web: Necesitamos el idToken para autenticar en Firebase
        if (googleAuth?.promptAsync) {
          const response = await googleAuth.promptAsync();
          if (response.type === 'success' && response.authentication?.idToken) {
            onSuccess?.(response.authentication.idToken);
          }
        }
      }
    } catch (error) {
      console.error('[GoogleSignInButton] Error:', error);
      onError?.(error);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || (Platform.OS !== 'android' && !googleAuth?.request)}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name="logo-google" size={20} color={theme.colors.text} />
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  pressed: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
});
