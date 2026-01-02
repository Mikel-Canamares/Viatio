import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components';
import { migrateTrip, MigrationResult } from '@/services/migration/migrateExpenses';
import { theme } from '@/theme';

interface MigrationModalProps {
  visible: boolean;
  tripId: string;
  tripName: string;
  localExpensesCount: number;
  onComplete: (result: MigrationResult) => void;
  onCancel: () => void;
}

export function MigrationModal({
  visible,
  tripId,
  tripName,
  localExpensesCount,
  onComplete,
  onCancel,
}: MigrationModalProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    setProgress({ current: 0, total: localExpensesCount });

    const migrationResult = await migrateTrip(tripId, (current, total) => {
      setProgress({ current, total });
    });

    setResult(migrationResult);
    setMigrating(false);
    setCompleted(true);
  };

  const handleDone = () => {
    if (result) {
      onComplete(result);
    }
    setCompleted(false);
    setResult(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {!migrating && !completed && (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary} />
              </View>

              <Text style={styles.title}>Sincronizar gastos</Text>

              <Text style={styles.description}>
                El viaje "{tripName}" tiene {localExpensesCount} gastos guardados localmente.
                {'\n\n'}
                ¿Quieres sincronizarlos para poder compartir el viaje con otras personas?
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>
                  Los gastos se asignarán a tu cuenta. Después podrás ajustar quién pagó cada uno.
                </Text>
              </View>

              <View style={styles.buttons}>
                <Pressable style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>Ahora no</Text>
                </Pressable>
                <PrimaryButton
                  title="Sincronizar"
                  onPress={handleMigrate}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {migrating && (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.progressTitle}>Sincronizando...</Text>
              <Text style={styles.progressText}>
                {progress.current} de {progress.total} gastos
              </Text>
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

          {completed && result && (
            <>
              <View style={styles.iconContainer}>
                {result.success ? (
                  <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                ) : (
                  <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                )}
              </View>

              <Text style={styles.title}>
                {result.success ? '¡Sincronización completada!' : 'Sincronización parcial'}
              </Text>

              <Text style={styles.description}>
                Se han migrado {result.migratedCount} de {result.totalCount} gastos.
              </Text>

              {result.errors.length > 0 && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Errores ({result.errors.length}):</Text>
                  {result.errors.slice(0, 3).map((error, i) => (
                    <Text key={i} style={styles.errorText}>• {error}</Text>
                  ))}
                  {result.errors.length > 3 && (
                    <Text style={styles.errorText}>
                      ... y {result.errors.length - 3} más
                    </Text>
                  )}
                </View>
              )}

              <PrimaryButton
                title="Continuar"
                onPress={handleDone}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 20,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  errorBox: {
    backgroundColor: theme.colors.error + '10',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 2,
  },
});
