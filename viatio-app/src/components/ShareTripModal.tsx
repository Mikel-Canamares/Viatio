/**
 * SHARE TRIP MODAL
 *
 * Modal de confirmación para compartir un viaje.
 * Muestra información sobre lo que implica compartir y el progreso de migración.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { PrimaryButton } from './PrimaryButton';
import {
  migrateTripToFirestore,
  getMigrationPreview,
  canShareTrip,
  type MigrationProgress,
} from '@/services/migration/migrateTripToFirestore';

interface ShareTripModalProps {
  visible: boolean;
  viajeId: string;
  viajeDestino: string;
  onClose: () => void;
  onSuccess: (firestoreId: string) => void;
}

export function ShareTripModal({
  visible,
  viajeId,
  viajeDestino,
  onClose,
  onSuccess,
}: ShareTripModalProps) {
  const [step, setStep] = useState<'confirm' | 'migrating' | 'success' | 'error'>('confirm');
  const [preview, setPreview] = useState({ reservations: 0, places: 0, expenses: 0 });
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Cargar preview al abrir
  useEffect(() => {
    if (visible) {
      loadPreview();
    } else {
      // Reset state when closing
      setStep('confirm');
      setProgress(null);
      setErrorMessage('');
    }
  }, [visible]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const check = await canShareTrip(viajeId);
      if (!check.canShare) {
        setErrorMessage(check.reason || 'No se puede compartir este viaje');
        setStep('error');
        return;
      }

      const previewData = await getMigrationPreview(viajeId);
      setPreview(previewData);
    } catch (error) {
      console.error('[ShareTripModal] Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setStep('migrating');

    const result = await migrateTripToFirestore(viajeId, (p) => {
      setProgress(p);
    });

    if (result.success && result.firestoreId) {
      setStep('success');
      // Esperar un momento para mostrar el éxito antes de cerrar
      setTimeout(() => {
        onSuccess(result.firestoreId!);
      }, 1500);
    } else {
      setErrorMessage(result.errors.join('\n') || 'Error al compartir el viaje');
      setStep('error');
    }
  };

  const renderConfirmStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="people" size={48} color={theme.colors.primaryLight} />
      </View>

      <Text style={styles.title}>Compartir viaje</Text>
      <Text style={styles.subtitle}>
        ¿Quieres compartir "{viajeDestino}" con otras personas?
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.infoText}>
            Todos los miembros verán las reservas, lugares y gastos
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.infoText}>
            Podrán añadir nuevos elementos al viaje
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.infoText}>
            Los gastos se pueden dividir entre viajeros
          </Text>
        </View>
      </View>

      {!loading && (preview.reservations > 0 || preview.places > 0 || preview.expenses > 0) && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Se sincronizarán:</Text>
          <View style={styles.previewRow}>
            {preview.reservations > 0 && (
              <View style={styles.previewItem}>
                <Text style={styles.previewNumber}>{preview.reservations}</Text>
                <Text style={styles.previewLabel}>reservas</Text>
              </View>
            )}
            {preview.places > 0 && (
              <View style={styles.previewItem}>
                <Text style={styles.previewNumber}>{preview.places}</Text>
                <Text style={styles.previewLabel}>lugares</Text>
              </View>
            )}
            {preview.expenses > 0 && (
              <View style={styles.previewItem}>
                <Text style={styles.previewNumber}>{preview.expenses}</Text>
                <Text style={styles.previewLabel}>gastos</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <View style={styles.primaryButtonWrapper}>
          <PrimaryButton onPress={handleShare} disabled={loading}>
            Compartir viaje
          </PrimaryButton>
        </View>
      </View>
    </>
  );

  const renderMigratingStep = () => (
    <>
      <ActivityIndicator size="large" color={theme.colors.primaryLight} />

      <Text style={styles.title}>Preparando viaje...</Text>

      {progress && (
        <>
          <Text style={styles.progressMessage}>{progress.message}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(progress.current / progress.total) * 100}%` },
              ]}
            />
          </View>
        </>
      )}
    </>
  );

  const renderSuccessStep = () => (
    <>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
      </View>

      <Text style={styles.title}>¡Viaje compartido!</Text>
      <Text style={styles.subtitle}>
        Ahora puedes invitar a otras personas
      </Text>
    </>
  );

  const renderErrorStep = () => (
    <>
      <View style={[styles.iconContainer, styles.errorIcon]}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
      </View>

      <Text style={styles.title}>Error al compartir</Text>
      <Text style={styles.errorText}>{errorMessage}</Text>

      <View style={styles.singleButtonContainer}>
        <PrimaryButton onPress={onClose}>
          Cerrar
        </PrimaryButton>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 'confirm' && renderConfirmStep()}
          {step === 'migrating' && renderMigratingStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  errorIcon: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },

  // Text
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Info box
  infoBox: {
    width: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Preview box
  previewBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
  },
  previewNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  previewLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  primaryButtonWrapper: {
    flex: 1,
  },
  singleButtonContainer: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },

  // Progress
  progressMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryLight,
  },

  // Error
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
