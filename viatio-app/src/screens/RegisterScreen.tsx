/**
 * REGISTER SCREEN
 *
 * Pantalla de registro con email, contraseña y nombre.
 * Incluye header con gradiente, logo y card de registro.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input, PrimaryButton, GoogleSignInButton, LinkAccountModal, LoadingOverlay } from '@/components';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { registerWithEmail, loginWithGoogle, error, clearError, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkingModal, setLinkingModal] = useState({
    visible: false,
    email: '',
    idToken: '',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nombre requerido (mínimo 2 caracteres)
    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Email requerido y formato válido
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Contraseña requerida (mínimo 6 caracteres)
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Confirmar contraseña debe coincidir
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    clearError();
    const success = await registerWithEmail({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
    });

    if (success) {
      showToast.success(
        'Cuenta creada',
        '¡Bienvenido a Viatio! Hemos enviado un email de verificación a tu correo. Por favor verifica tu email para continuar.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryLight, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Logo más pequeño */}
          <View style={styles.logoContainer}>
            <Ionicons name="airplane" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Viatio</Text>
        </LinearGradient>

        {/* Card de registro */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            {/* Título */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>Comienza a organizar tus viajes</Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Error banner con sugerencias */}
              {error && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorContent}>
                    <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error.message}</Text>
                  </View>

                  {error.suggestLogin && (
                    <Pressable
                      onPress={() => {
                        clearError();
                        navigation.navigate('Login');
                      }}
                      style={styles.errorAction}
                    >
                      <Text style={styles.errorActionText}>Ir a inicio de sesión</Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.primaryLight} />
                    </Pressable>
                  )}
                </View>
              )}

              <Input
                label="Nombre completo"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (error) clearError();
                }}
                placeholder="Ej: María García"
                leftIcon="person-outline"
                error={errors.displayName}
              />

              <Input
                label="Correo electrónico"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) clearError();
                }}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={errors.email}
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) clearError();
                }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              <Input
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) clearError();
                }}
                placeholder="Repite tu contraseña"
                secureTextEntry={!showConfirmPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
              />

              {/* Botón de registro */}
              <PrimaryButton onPress={handleRegister} disabled={loading}>
                Crear cuenta
              </PrimaryButton>

              {/* Separador */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>o regístrate con</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Botón de Google */}
              <GoogleSignInButton
                text="Registrarse con Google"
                onSuccess={loginWithGoogle}
                onError={(err: any) => {
                  if (err?.needsLinking) {
                    setLinkingModal({
                      visible: true,
                      email: err.email || '',
                      idToken: err.pendingCredential || '',
                    });
                  } else {
                    console.error('Error Google Sign-In:', err);
                    showToast.error('Error', 'No se pudo registrar con Google. Intenta nuevamente.');
                  }
                }}
                disabled={loading}
              />

              {/* Texto informativo */}
              <Text style={styles.helperText}>
                Al usar Google, tu cuenta se creará automáticamente
              </Text>

              {/* Footer - Login */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Inicia sesión</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Creando cuenta..." />

      <LinkAccountModal
        visible={linkingModal.visible}
        email={linkingModal.email}
        idToken={linkingModal.idToken}
        onSuccess={() => {
          setLinkingModal({ visible: false, email: '', idToken: '' });
        }}
        onCancel={() => {
          setLinkingModal({ visible: false, email: '', idToken: '' });
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 40,
    paddingBottom: 32,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.md,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  separatorText: {
    paddingHorizontal: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
    lineHeight: 20,
  },
  errorAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    gap: 4,
  },
  errorActionText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
