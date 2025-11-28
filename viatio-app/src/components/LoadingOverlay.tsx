/**
 * LOADING OVERLAY
 *
 * Overlay de carga que cubre toda la pantalla.
 * Muestra un spinner y mensaje personalizable.
 */

import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from './Card';
import { theme } from '@/config';

interface LoadingOverlayProps {
  /** Si el overlay está visible */
  visible: boolean;

  /** Mensaje a mostrar (default: "Cargando...") */
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = 'Cargando...',
}: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Card style={styles.card} padding={24}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primaryLight}
          />
          <Text style={styles.message}>{message}</Text>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    minWidth: 200,
    alignItems: 'center',
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
