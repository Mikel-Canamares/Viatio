/**
 * NOTIFICATION DEBUG SCREEN
 *
 * Pantalla de debugging para notificaciones.
 * Muestra información técnica, permite probar notificaciones y gestionar tokens.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, Card, PrimaryButton, CustomModal } from '@/components';
import {
  getAllScheduledNotificationsInfo,
  getNotificationStats,
  sendTestNotification,
  cleanupObsoleteNotifications,
  cancelAllNotifications,
  getDebugMode,
  setDebugMode,
} from '@/services/notificationsService';
import {
  getExpoPushToken,
  canReceivePushNotifications,
  getDeviceInfo,
} from '@/services/pushTokenService';
import { getPushToken } from '@/services/firestore/usersService';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';
import {
  showBatteryOptimizationAlert,
  showNotificationDeliveryTips,
} from '@/utils/batteryOptimization';
import {
  getLogs,
  clearLogs,
  exportLogs,
  getNotificationStats as getLogStats,
  getRecentLogs,
} from '@/utils/notificationLogger';
import { theme } from '@/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationDebug'>;

export default function NotificationDebugScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    viajes: 0,
    reservas: 0,
    eventos: 0,
    upcoming: 0,
    past: 0,
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [firestorePushToken, setFirestorePushToken] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [debugMode, setDebugModeState] = useState(false);
  const [logStats, setLogStats] = useState({
    totalScheduled: 0,
    totalCancelled: 0,
    totalFailed: 0,
    totalDelivered: 0,
    successRate: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Estado del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'warning' as const,
    title: '',
    message: '',
    primaryButton: { text: 'Confirmar', onPress: () => {}, destructive: true },
    secondaryButton: { text: 'Cancelar', onPress: () => {} },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar estadísticas
      const statsData = await getNotificationStats();
      setStats(statsData);

      // Cargar notificaciones programadas
      const scheduled = await getAllScheduledNotificationsInfo();
      setScheduledNotifications(scheduled);

      // Obtener push token actual
      const token = await getExpoPushToken();
      setPushToken(token);

      // Obtener push token guardado en Firestore
      if (user) {
        const firestoreToken = await getPushToken(user.uid);
        setFirestorePushToken(firestoreToken);
      }

      // Información del dispositivo
      const info = getDeviceInfo();
      setDeviceInfo(info);

      // Estado de debug mode
      const debug = await getDebugMode();
      setDebugModeState(debug);

      // Cargar estadísticas de logs
      const logStatsData = await getLogStats();
      setLogStats(logStatsData);

      // Cargar logs recientes (últimas 24 horas)
      const recent = await getRecentLogs(24);
      setRecentLogs(recent.slice(0, 10)); // Solo los 10 más recientes
    } catch (error) {
      console.error('[NotificationDebug] Error cargando datos:', error);
      showToast.error('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTestNotification = async () => {
    try {
      const success = await sendTestNotification();
      if (success) {
        showToast.success('Éxito', 'Notificación de prueba enviada. Aparecerá en 3 segundos.');
      } else {
        showToast.error('Error', 'No se pudo enviar la notificación de prueba');
      }
    } catch (error) {
      console.error('[NotificationDebug] Error enviando notificación de prueba:', error);
      showToast.error('Error', 'No se pudo enviar la notificación de prueba');
    }
  };

  const handleCleanupObsolete = async () => {
    try {
      const count = await cleanupObsoleteNotifications();
      showToast.success('Limpieza completa', `Se eliminaron ${count} notificaciones obsoletas`);
      await loadData();
    } catch (error) {
      console.error('[NotificationDebug] Error limpiando notificaciones:', error);
      showToast.error('Error', 'No se pudo limpiar las notificaciones');
    }
  };

  const handleCancelAll = () => {
    setModalConfig({
      type: 'warning',
      title: 'Cancelar todas las notificaciones',
      message: '¿Estás seguro? Esto cancelará TODAS las notificaciones programadas.',
      primaryButton: {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await cancelAllNotifications();
            showToast.success('Éxito', 'Todas las notificaciones han sido canceladas');
            await loadData();
          } catch (error) {
            console.error('[NotificationDebug] Error cancelando notificaciones:', error);
            showToast.error('Error', 'No se pudo cancelar las notificaciones');
          }
        },
        destructive: true,
      },
      secondaryButton: {
        text: 'Cancelar',
        onPress: () => {},
      },
    });
    setModalVisible(true);
  };

  const handleToggleDebugMode = async () => {
    try {
      const newMode = !debugMode;
      await setDebugMode(newMode);
      setDebugModeState(newMode);
      showToast.success(
        'Modo debug',
        newMode ? 'Logging detallado activado' : 'Logging detallado desactivado'
      );
    } catch (error) {
      console.error('[NotificationDebug] Error cambiando modo debug:', error);
      showToast.error('Error', 'No se pudo cambiar el modo debug');
    }
  };

  const handleExportLogs = async () => {
    try {
      const logsText = await exportLogs();
      // TODO: Implementar compartir logs (Share API o copiar al portapapeles)
      console.log('Logs exportados:', logsText);
      showToast.success('Logs exportados', 'Revisa la consola para ver los logs');
    } catch (error) {
      console.error('[NotificationDebug] Error exportando logs:', error);
      showToast.error('Error', 'No se pudieron exportar los logs');
    }
  };

  const handleClearLogs = () => {
    setModalConfig({
      type: 'warning',
      title: 'Limpiar logs',
      message: '¿Estás seguro de que quieres borrar todos los logs? Esta acción no se puede deshacer.',
      primaryButton: {
        text: 'Borrar',
        onPress: async () => {
          try {
            await clearLogs();
            setRecentLogs([]);
            setLogStats({
              totalScheduled: 0,
              totalCancelled: 0,
              totalFailed: 0,
              totalDelivered: 0,
              successRate: 0,
            });
            showToast.success('Logs borrados', 'Todos los logs han sido eliminados');
          } catch (error) {
            console.error('[NotificationDebug] Error limpiando logs:', error);
            showToast.error('Error', 'No se pudieron borrar los logs');
          }
        },
        destructive: true,
      },
      secondaryButton: {
        text: 'Cancelar',
        onPress: () => {},
      },
    });
    setModalVisible(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.wrapper}>
      <PageHeader title="Debug de Notificaciones" onBack={() => navigation.goBack()} />
      <ScreenContainer edges={['top']}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Estadísticas */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📊 Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.upcoming}</Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.past}</Text>
              <Text style={styles.statLabel}>Pasadas</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statDetail}>✈️ Viajes: {stats.viajes}</Text>
            <Text style={styles.statDetail}>📅 Reservas: {stats.reservas}</Text>
            <Text style={styles.statDetail}>⭐ Eventos: {stats.eventos}</Text>
          </View>
        </Card>

        {/* Información del dispositivo */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📱 Dispositivo</Text>
          <InfoRow label="Plataforma" value={deviceInfo?.platform || 'N/A'} />
          <InfoRow label="Versión OS" value={deviceInfo?.osVersion || 'N/A'} />
          <InfoRow label="Fabricante" value={deviceInfo?.manufacturer || 'N/A'} />
          <InfoRow label="Modelo" value={deviceInfo?.modelName || 'N/A'} />
          <InfoRow
            label="Puede recibir push"
            value={canReceivePushNotifications() ? '✅ Sí' : '❌ No (emulador)'}
            valueColor={canReceivePushNotifications() ? theme.colors.success : theme.colors.error}
          />
        </Card>

        {/* Push Token */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Push Token</Text>
          {pushToken ? (
            <>
              <Text style={styles.tokenText} selectable>
                {pushToken}
              </Text>
              <Text style={styles.tokenStatus}>
                {firestorePushToken === pushToken ? '✅ Sincronizado con Firestore' : '⚠️ No sincronizado'}
              </Text>
            </>
          ) : (
            <Text style={styles.noTokenText}>
              {canReceivePushNotifications()
                ? '❌ No se pudo obtener el token'
                : '⚠️ Los emuladores no soportan push notifications'}
            </Text>
          )}
        </Card>

        {/* Notificaciones programadas */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>⏰ Notificaciones Programadas ({scheduledNotifications.length})</Text>
          {scheduledNotifications.length === 0 ? (
            <Text style={styles.emptyText}>No hay notificaciones programadas</Text>
          ) : (
            scheduledNotifications.slice(0, 10).map((notif, index) => (
              <View key={notif.id} style={styles.notificationItem}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notif.title}</Text>
                  <Text style={[styles.notificationBadge, notif.isPast && styles.pastBadge]}>
                    {notif.type}
                  </Text>
                </View>
                <Text style={styles.notificationBody} numberOfLines={1}>
                  {notif.body}
                </Text>
                <Text style={styles.notificationTime}>
                  {notif.isPast ? '❌ ' : '⏰ '}
                  {formatDate(notif.scheduledFor)}
                  {!notif.isPast && ` (en ${notif.minutesUntil} min)`}
                </Text>
              </View>
            ))
          )}
          {scheduledNotifications.length > 10 && (
            <Text style={styles.moreText}>... y {scheduledNotifications.length - 10} más</Text>
          )}
        </Card>

        {/* Estadísticas de Logs */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📊 Estadísticas de Logs (Histórico)</Text>
          <InfoRow label="Notificaciones programadas" value={logStats.totalScheduled.toString()} />
          <InfoRow label="Notificaciones canceladas" value={logStats.totalCancelled.toString()} />
          <InfoRow label="Errores" value={logStats.totalFailed.toString()} />
          <InfoRow
            label="Tasa de éxito"
            value={`${logStats.successRate}%`}
            valueColor={
              logStats.successRate >= 90
                ? theme.colors.success
                : logStats.successRate >= 70
                ? theme.colors.warning
                : theme.colors.error
            }
          />
        </Card>

        {/* Logs Recientes */}
        {recentLogs.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>📝 Logs Recientes (últimas 24h)</Text>
              <View style={styles.logActions}>
                <Pressable onPress={handleExportLogs} style={styles.logAction}>
                  <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
                </Pressable>
                <Pressable onPress={handleClearLogs} style={styles.logAction}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </Pressable>
              </View>
            </View>

            {recentLogs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text
                    style={[
                      styles.logLevel,
                      log.level === 'error'
                        ? styles.logError
                        : log.level === 'warn'
                        ? styles.logWarn
                        : styles.logInfo,
                    ]}
                  >
                    {log.level.toUpperCase()}
                  </Text>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.source && <Text style={styles.logSource}>Source: {log.source}</Text>}
              </View>
            ))}

            {recentLogs.length === 10 && (
              <Text style={styles.logHint}>Mostrando los 10 más recientes</Text>
            )}
          </Card>
        )}

        {/* Acciones */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Acciones</Text>

          <PrimaryButton
            title="🧪 Enviar notificación de prueba"
            onPress={handleTestNotification}
            style={styles.actionButton}
          />

          <PrimaryButton
            title="🗑️ Limpiar obsoletas"
            onPress={handleCleanupObsolete}
            style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
          />

          <PrimaryButton
            title="❌ Cancelar todas"
            onPress={handleCancelAll}
            style={StyleSheet.flatten([styles.actionButton, styles.dangerButton])}
          />

          <PrimaryButton
            title={`🐛 Modo debug: ${debugMode ? 'ON' : 'OFF'}`}
            onPress={handleToggleDebugMode}
            style={StyleSheet.flatten([
              styles.actionButton,
              debugMode ? styles.activeButton : styles.secondaryButton,
            ])}
          />

          {Platform.OS === 'android' && (
            <>
              <PrimaryButton
                title="🔋 Configurar batería"
                onPress={showBatteryOptimizationAlert}
                style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
              />

              <PrimaryButton
                title="💡 Consejos"
                onPress={showNotificationDeliveryTips}
                style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
              />
            </>
          )}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Usa esta pantalla para diagnosticar problemas con notificaciones
          </Text>
        </View>
      </ScrollView>

      {/* Modal de confirmación */}
      <CustomModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
        primaryButton={modalConfig.primaryButton}
        secondaryButton={modalConfig.secondaryButton}
      />
      </ScreenContainer>
    </View>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statDetail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  tokenStatus: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  noTokenText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  notificationItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  notificationBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pastBadge: {
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.border,
  },
  notificationBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  moreText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  activeButton: {
    backgroundColor: theme.colors.success,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logActions: {
    flexDirection: 'row',
    gap: 12,
  },
  logAction: {
    padding: 4,
  },
  logEntry: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logError: {
    backgroundColor: theme.colors.error + '20',
    color: theme.colors.error,
  },
  logWarn: {
    backgroundColor: theme.colors.warning + '20',
    color: theme.colors.warning,
  },
  logInfo: {
    backgroundColor: theme.colors.primary + '20',
    color: theme.colors.primary,
  },
  logTimestamp: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  logMessage: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  logSource: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  logHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
