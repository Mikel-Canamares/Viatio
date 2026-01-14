/**
 * LOGIN SCREEN
 *
 * Pantalla de inicio de sesión con email y contraseña.
 * Incluye header con gradiente, logo y card de login.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input, PrimaryButton, GoogleSignInButton, LinkAccountModal, LoadingOverlay } from '@/components';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { loginWithEmail, loginWithGoogle, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkingModal, setLinkingModal] = useState({
    visible: false,
    email: '',
    idToken: '',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email requerido y formato válido
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Contraseña requerida
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    clearError();
    await loginWithEmail({ email: email.trim(), password });
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      {/* Header con imagen de fondo - posición absoluta */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={require('../../assets/headerViatio.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Espaciador para el header */}
          <View style={styles.headerSpacer} />

        {/* Card de login */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            {/* Título */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Bienvenido de nuevo</Text>
              <Text style={styles.subtitle}>Inicia sesión para acceder a tus viajes</Text>
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

                  {error.suggestRegister && (
                    <Pressable
                      onPress={() => {
                        clearError();
                        navigation.navigate('Register');
                      }}
                      style={styles.errorAction}
                    >
                      <Text style={styles.errorActionText}>Crear cuenta nueva</Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.primaryLight} />
                    </Pressable>
                  )}
                </View>
              )}

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
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              {/* Recordarme y olvide contraseña */}
              <View style={styles.optionsRow}>
                <View style={styles.spacer} />
                <Pressable onPress={handleForgotPassword}>
                  <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              </View>

              {/* Botón de login */}
              <PrimaryButton onPress={handleLogin} disabled={loading}>
                Iniciar sesión
              </PrimaryButton>

              {/* Separador */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>o continúa con</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Botón de Google */}
              <GoogleSignInButton
                text="Continuar con Google"
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
                    showToast.error('Error', 'No se pudo iniciar sesión con Google. Intenta nuevamente.');
                  }
                }}
                disabled={loading}
              />

              {/* Footer - Registro */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Regístrate gratis</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>

        <LoadingOverlay visible={loading} message="Iniciando sesión..." />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 480,
    overflow: 'hidden',
    zIndex: 0,
  },
  headerImage: {
    width: '100%',
    height: 500,
    marginTop: 50,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSpacer: {
    height: 450,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  cardContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 40,
    paddingBottom: 48,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  forgotPassword: {
    fontSize: 14,
    color: theme.colors.primaryLight,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
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
