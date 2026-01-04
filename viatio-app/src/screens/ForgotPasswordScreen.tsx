/**
 * FORGOT PASSWORD SCREEN
 *
 * Pantalla dedicada para solicitar el restablecimiento de contraseña.
 * Incluye validación de email y pantalla de confirmación.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context';
import { ScreenContainer, Card, Input, PrimaryButton } from '@/components';
import { theme } from '@/config';
import type { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('El email es requerido');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Introduce un email válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) return;

    const success = await resetPassword(email.trim().toLowerCase());

    if (success) {
      setSent(true);
    } else if (error) {
      showToast.error('Error', error.message);
    }
  };

  if (sent) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          </View>

          <Text style={styles.successTitle}>Email enviado</Text>

          <Text style={styles.successDescription}>
            Hemos enviado instrucciones para restablecer tu contraseña a{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>

          <Text style={styles.successInstructions}>
            Sigue el enlace del email para crear una nueva contraseña.
            Si no lo recibes en unos minutos, revisa la carpeta de spam.
          </Text>

          <PrimaryButton
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLoginButton}
          >
            Volver a iniciar sesión
          </PrimaryButton>

          <Pressable
            onPress={() => setSent(false)}
            style={styles.retryLink}
          >
            <Text style={styles.retryText}>¿No recibiste el email? Intentar de nuevo</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Restablecer contraseña</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-open-outline" size={64} color={theme.colors.primaryLight} />
          </View>

          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>

          <Text style={styles.description}>
            Introduce tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </Text>

          <Card style={styles.formCard}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                if (error) clearError();
              }}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              leftIcon="mail-outline"
            />

            <PrimaryButton
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </PrimaryButton>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  formCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
  // Estilos de éxito
  successContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  successIcon: {
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  successDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  successEmail: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  successInstructions: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  backToLoginButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  retryLink: {
    padding: theme.spacing.sm,
  },
  retryText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
