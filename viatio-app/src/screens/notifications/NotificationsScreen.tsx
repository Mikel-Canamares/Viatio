import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader } from '@/components';
import { useNotificationsStore } from '@/store/notificationsStore';
import { Notification, NotificationType } from '@/services/firestore/notificationsService';
import { acceptInvitation } from '@/services/firestore/invitesService';
import { downloadSharedTrip } from '@/services/sync/syncDownload';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';
import { theme } from '@/theme';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingNotification, setProcessingNotification] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marcar como leída
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navegar según el tipo
    switch (notification.type) {
      case 'trip_invite':
        // Aceptar automáticamente la invitación y navegar al viaje
        if (notification.data.tripId && notification.data.inviteId && user?.uid) {
          setProcessingNotification(notification.id);
          try {
            // Aceptar invitación
            await acceptInvitation(notification.data.tripId, notification.data.inviteId);

            // Descargar viaje compartido a BD local
            const downloadResult = await downloadSharedTrip(notification.data.tripId, user.uid);

            if (downloadResult.success && downloadResult.viaje) {
              showToast.success('¡Bienvenido!', `Te has unido a ${notification.data.tripName || 'el viaje'}`);

              // Navegar a TripList para tener un stack de navegación correcto
              // Así el usuario puede ver la lista completa y volver si lo necesita
              navigation.navigate('Home', { screen: 'TripList' });
            } else {
              throw new Error(downloadResult.error || 'Error al descargar el viaje');
            }
          } catch (error: any) {
            showToast.error('Error', error.message || 'No se pudo unir al viaje');
          } finally {
            setProcessingNotification(null);
          }
        } else {
          // Fallback: navegar a la lista de viajes
          navigation.navigate('Home', { screen: 'TripList' });
        }
        break;

      case 'invite_accepted':
      case 'member_joined':
      case 'trip_updated':
        if (notification.data.tripId) {
          // Los viajes compartidos ahora usan TripDetail
          navigation.navigate('Home', {
            screen: 'TripDetail',
            params: { viajeId: notification.data.tripId },
          });
        }
        break;

      case 'expense_added':
      case 'expense_updated':
        if (notification.data.tripId) {
          navigation.navigate('Home', {
            screen: 'Expenses',
            params: { viajeId: notification.data.tripId },
          });
        }
        break;

      case 'settlement_requested':
      case 'settlement_completed':
        if (notification.data.tripId) {
          navigation.navigate('Home', {
            screen: 'TripSettlements',
            params: { viajeId: notification.data.tripId, firestoreId: notification.data.tripId },
          });
        }
        break;
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getIcon = (type: NotificationType): string => {
    switch (type) {
      case 'trip_invite':
        return 'mail';
      case 'invite_accepted':
        return 'checkmark-circle';
      case 'invite_rejected':
        return 'close-circle';
      case 'member_joined':
        return 'person-add';
      case 'member_left':
        return 'person-remove';
      case 'expense_added':
        return 'cash';
      case 'expense_updated':
        return 'create';
      case 'settlement_requested':
        return 'card';
      case 'settlement_completed':
        return 'checkmark-done';
      case 'trip_updated':
        return 'pencil';
      case 'trip_deleted':
        return 'trash';
      case 'role_changed':
        return 'shield';
      default:
        return 'notifications';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const isProcessing = processingNotification === item.id;

    return (
      <Pressable
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        disabled={isProcessing}
      >
        <View style={styles.iconContainer}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons
              name={getIcon(item.type) as any}
              size={24}
              color={item.isRead ? theme.colors.textSecondary : theme.colors.primary}
            />
          )}
        </View>

      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>
          {formatDistanceToNow(item.createdAt, {
            addSuffix: true,
            locale: es,
          })}
        </Text>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isProcessing}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={theme.colors.textTertiary}
        />
      </Pressable>
    </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={theme.colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>Sin notificaciones</Text>
      <Text style={styles.emptyText}>
        Te notificaremos cuando tengas invitaciones o actualizaciones
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader
        title="Notificaciones"
        onBack={() => navigation.goBack()}
        rightElement={
          unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButton}>Marcar todas</Text>
            </Pressable>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: theme.colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  deleteButton: {
    padding: 8,
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    lineHeight: 22,
  },
});
