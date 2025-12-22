/**
 * NOTIFICATIONS MANAGEMENT SCREEN
 *
 * Pantalla profesional de gestión de notificaciones.
 * Permite al usuario:
 * - Ver todas las notificaciones programadas
 * - Enviar notificación de prueba
 * - Limpiar notificaciones obsoletas
 * - Ver estadísticas
 * - Activar modo debug
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '@/navigation/types';
import {
  getAllScheduledNotificationsInfo,
  getNotificationStats,
  sendTestNotification,
  cleanupObsoleteNotifications,
  setDebugMode,
  getDebugMode,
  ScheduledNotificationInfo,
} from '@/services/notificationsService';
import { theme } from '@/config/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationsManagement'>;

export default function NotificationsManagementScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<ScheduledNotificationInfo[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    viajes: 0,
    reservas: 0,
    eventos: 0,
    upcoming: 0,
    past: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [debugMode, setDebugModeState] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [notifs, statistics, debugState] = await Promise.all([
        getAllScheduledNotificationsInfo(),
        getNotificationStats(),
        getDebugMode(),
      ]);

      // Ordenar por fecha más cercana primero
      notifs.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

      setNotifications(notifs);
      setStats(statistics);
      setDebugModeState(debugState);
    } catch (error) {
      console.error('Error loading notifications data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert(
        'Notificación programada',
        'Recibirás una notificación de prueba en 3 segundos'
      );
    } else {
      Alert.alert(
        'Error',
        'No se pudo enviar la notificación. Verifica que tienes permisos activados.'
      );
    }
  };

  const handleCleanup = async () => {
    Alert.alert(
      'Limpiar notificaciones obsoletas',
      '¿Deseas eliminar todas las notificaciones que ya han pasado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            const count = await cleanupObsoleteNotifications();
            Alert.alert('Limpieza completada', `Se eliminaron ${count} notificaciones obsoletas`);
            await loadData();
          },
        },
      ]
    );
  };

  const toggleDebugMode = async (value: boolean) => {
    await setDebugMode(value);
    setDebugModeState(value);
    Alert.alert(
      'Modo debug ' + (value ? 'activado' : 'desactivado'),
      value
        ? 'Ahora verás logs detallados en la consola'
        : 'Los logs de debug están desactivados'
    );
  };

  const formatTimeUntil = (minutesUntil: number): string => {
    if (minutesUntil < 0) {
      const absMinutes = Math.abs(minutesUntil);
      if (absMinutes < 60) return `Hace ${absMinutes}m`;
      if (absMinutes < 1440) return `Hace ${Math.floor(absMinutes / 60)}h`;
      return `Hace ${Math.floor(absMinutes / 1440)}d`;
    }

    if (minutesUntil < 60) return `En ${minutesUntil}m`;
    if (minutesUntil < 1440) return `En ${Math.floor(minutesUntil / 60)}h`;
    return `En ${Math.floor(minutesUntil / 1440)}d`;
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'viaje':
        return 'airplane';
      case 'reserva':
        return 'calendar';
      case 'evento':
        return 'star';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'viaje':
        return theme.colors.primary;
      case 'reserva':
        return theme.colors.success;
      case 'evento':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {stats.upcoming}
              </Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {stats.viajes}
              </Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                {stats.reservas}
              </Text>
              <Text style={styles.statLabel}>Reservas</Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Ionicons name="flask" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Enviar notificación de prueba</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCleanup}
            disabled={stats.past === 0}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={stats.past > 0 ? theme.colors.error : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.actionButtonText,
                stats.past === 0 && { color: theme.colors.textSecondary },
              ]}
            >
              Limpiar obsoletas ({stats.past})
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Ionicons name="bug" size={20} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Modo debug</Text>
            <Switch
              value={debugMode}
              onValueChange={toggleDebugMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Lista de notificaciones programadas */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            Notificaciones programadas ({notifications.length})
          </Text>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No hay notificaciones programadas
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Las notificaciones se programan automáticamente cuando creas viajes y reservas
              </Text>
            </View>
          ) : (
            notifications.map((notification, index) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  notification.isPast && styles.notificationCardPast,
                ]}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name={getTypeIcon(notification.type) as any}
                      size={20}
                      color={getTypeColor(notification.type)}
                    />
                  </View>
                  <View style={styles.notificationHeaderText}>
                    <Text style={styles.notificationType}>
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </Text>
                    <Text
                      style={[
                        styles.notificationTime,
                        notification.isPast && { color: theme.colors.textSecondary },
                      ]}
                    >
                      {formatTimeUntil(notification.minutesUntil)}
                    </Text>
                  </View>
                  {notification.isPast && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>Pasada</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>

                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationDate}>
                    {notification.scheduledFor.toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Stats
  statsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Actions
  actionsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#fff',
    marginTop: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },

  // List
  listContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#fff',
    marginTop: theme.spacing.sm,
    minHeight: 400,
  },
  notificationCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationCardPast: {
    opacity: 0.6,
    borderLeftColor: theme.colors.textSecondary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  notificationType: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  pastBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 12,
  },
  pastBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  notificationFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  notificationDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
  },
});
