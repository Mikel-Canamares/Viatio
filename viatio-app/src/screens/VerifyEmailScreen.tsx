/**
 * VERIFY EMAIL SCREEN
 *
 * Pantalla que se muestra cuando el usuario necesita verificar su email.
 * Incluye opción para reenviar el email de verificación con countdown.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context';
import { ScreenContainer, Card, PrimaryButton, SecondaryButton } from '@/components';
import { theme } from '@/config';

export default function VerifyEmailScreen() {
  const { user, resendVerificationEmail, logout, refreshUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Polling para verificar si el email fue verificado
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshUser();
    }, 3000); // Verificar cada 3 segundos

    return () => clearInterval(interval);
  }, [refreshUser]);

  // Countdown para evitar spam de reenvíos
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleResend = async () => {
    setResending(true);
    const success = await resendVerificationEmail();
    setResending(false);

    if (success) {
      Alert.alert('Email enviado', 'Revisa tu bandeja de entrada y carpeta de spam');
      setCountdown(60); // 60 segundos antes de poder reenviar
    } else {
      Alert.alert('Error', 'No se pudo enviar el email. Inténtalo más tarde.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas usar otra cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Icono de email */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color={theme.colors.primaryLight} />
        </View>

        {/* Título */}
        <Text style={styles.title}>Verifica tu email</Text>

        {/* Descripción */}
        <Text style={styles.description}>
          Hemos enviado un email de verificación a{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        {/* Instrucciones */}
        <Text style={styles.instructions}>
          Haz clic en el enlace del email para activar tu cuenta.
          Si no lo encuentras, revisa la carpeta de spam.
        </Text>

        {/* Acciones */}
        <Card style={styles.actionsCard}>
          <PrimaryButton
            onPress={handleResend}
            disabled={resending || countdown > 0}
          >
            {countdown > 0
              ? `Reenviar en ${countdown}s`
              : resending
              ? 'Enviando...'
              : 'Reenviar email de verificación'
            }
          </PrimaryButton>

          <SecondaryButton
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Usar otra cuenta
          </SecondaryButton>
        </Card>

        {/* Ayuda adicional */}
        <Text style={styles.helpText}>
          ¿Problemas con la verificación?{' '}
          <Text style={styles.helpLink}>Contacta soporte</Text>
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  email: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  actionsCard: {
    width: '100%',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  logoutButton: {
    marginTop: theme.spacing.xs,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  helpLink: {
    color: theme.colors.primaryLight,
    fontWeight: '600',
  },
});
