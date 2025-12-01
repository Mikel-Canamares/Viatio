/**
 * LOGIN SCREEN
 *
 * Pantalla de inicio de sesión con email y contraseña.
 * Incluye header con gradiente, logo y card de login.
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input, PrimaryButton, SecondaryButton, LoadingOverlay } from '@/components';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { AuthStackParamList } from '@/navigation/AuthStackNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { loginWithEmail, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const success = await loginWithEmail({ email: email.trim(), password });

    if (!success && error) {
      Alert.alert('Error de inicio de sesión', error);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar contraseña',
      'Esta funcionalidad estará disponible próximamente.'
    );
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      `Login con ${provider}`,
      'Esta funcionalidad estará disponible próximamente.'
    );
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
          {/* Logo o texto */}
          <View style={styles.logoContainer}>
            <Ionicons name="airplane" size={80} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Viatio</Text>
          <Text style={styles.tagline}>Organiza tus viajes de forma inteligente</Text>
        </LinearGradient>

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
              <Input
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={errors.email}
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
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

              {/* Botones sociales */}
              <View style={styles.socialButtons}>
                <SecondaryButton
                  onPress={() => handleSocialLogin('Google')}
                  style={styles.socialButton}
                >
                  <Ionicons name="logo-google" size={20} color={theme.colors.text} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </SecondaryButton>
                {Platform.OS === 'ios' && (
                  <SecondaryButton
                    onPress={() => handleSocialLogin('Apple')}
                    style={styles.socialButton}
                  >
                    <Ionicons name="logo-apple" size={20} color={theme.colors.text} />
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </SecondaryButton>
                )}
              </View>

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
    paddingBottom: 48,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#DBEAFE',
    opacity: 0.9,
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
  socialButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
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
});
