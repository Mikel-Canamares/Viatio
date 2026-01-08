/**
 * LINK ACCOUNT MODAL
 *
 * Modal para vincular cuenta de Google con cuenta existente de email/contraseña.
 * Aparece cuando el usuario intenta usar Google con un email ya registrado.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, PrimaryButton, LoadingOverlay } from '@/components';
import { useAuth } from '@/context';
import { theme } from '@/config';

interface LinkAccountModalProps {
  visible: boolean;
  email: string;
  idToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LinkAccountModal({
  visible,
  email,
  idToken,
  onSuccess,
  onCancel,
}: LinkAccountModalProps) {
  const { linkGoogleAccount, error, clearError, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLink = async () => {
    if (!password) {
      return;
    }

    const success = await linkGoogleAccount(idToken, password);
    if (success) {
      setPassword('');
      onSuccess();
    }
  };

  const handleCancel = () => {
    setPassword('');
    clearError();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleCancel} />

        {/* Modal Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="link" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Vincular cuenta</Text>
            <Text style={styles.subtitle}>
              El email <Text style={styles.emailText}>{email}</Text> ya está registrado con
              contraseña.
            </Text>
            <Text style={styles.description}>
              Ingresa tu contraseña para vincular tu cuenta de Google.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <Input
              label="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <PrimaryButton onPress={handleLink} disabled={!password || loading} style={styles.linkButton}>
              Vincular cuenta
            </PrimaryButton>
          </View>
        </View>

        <LoadingOverlay visible={loading} message="Vinculando cuenta..." />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emailText: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: theme.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  linkButton: {
    flex: 1,
  },
});
