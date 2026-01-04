/**
 * CUSTOM MODAL
 *
 * Modal personalizado para reemplazar Alert nativo.
 * Variantes: success, error, warning, info
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface CustomModalProps {
  visible: boolean;
  type: ModalType;
  title: string;
  message?: string;
  onClose: () => void;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

const MODAL_CONFIG: Record<
  ModalType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
  }
> = {
  success: {
    icon: 'checkmark-circle',
    color: theme.colors.success,
    bgColor: '#16A34A15',
  },
  error: {
    icon: 'close-circle',
    color: theme.colors.error,
    bgColor: '#DC262615',
  },
  warning: {
    icon: 'warning',
    color: theme.colors.warning,
    bgColor: '#F59E0B15',
  },
  info: {
    icon: 'information-circle',
    color: theme.colors.primaryLight,
    bgColor: '#0066CC15',
  },
};

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  primaryButton,
  secondaryButton,
}) => {
  const config = MODAL_CONFIG[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Icono */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={48} color={config.color} />
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensaje */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            {secondaryButton && (
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  secondaryButton.onPress();
                  onClose();
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryButton.text}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                !secondaryButton && styles.fullWidthButton,
              ]}
              onPress={() => {
                primaryButton?.onPress();
                onClose();
              }}
            >
              <Text style={styles.primaryButtonText}>
                {primaryButton?.text || 'OK'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.xl,
    width: Dimensions.get('window').width - theme.spacing.xl * 2,
    maxWidth: 400,
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  primaryButtonText: {
    ...theme.typography.subtitle,
    color: theme.colors.primaryForeground,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
});
