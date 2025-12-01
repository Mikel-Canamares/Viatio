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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input, PrimaryButton, LoadingOverlay } from '@/components';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { AuthStackParamList } from '@/navigation/AuthStackNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { registerWithEmail, error, clearError, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      Alert.alert(
        'Cuenta creada',
        '¡Bienvenido a Viatio! Tu cuenta ha sido creada correctamente.',
        [{ text: 'OK' }]
      );
    } else if (error) {
      Alert.alert('Error al crear cuenta', error);
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
              <Input
                label="Nombre completo"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ej: María García"
                leftIcon="person-outline"
                error={errors.displayName}
              />

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
                onChangeText={setConfirmPassword}
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
