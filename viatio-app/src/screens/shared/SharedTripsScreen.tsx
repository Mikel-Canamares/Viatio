import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, FloatingActionButton } from '@/components';
import { PendingInviteCard } from '@/components/shared';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useAuth } from '@/context/AuthContext';
import { SharedTrip, ROLE_LABELS } from '@/types/shared';
import { theme } from '@/theme';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { showToast } from '@/utils/toast';

export default function SharedTripsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const {
    trips,
    pendingInvites,
    loading,
    fetchTrips,
    fetchPendingInvites,
    subscribeTrips,
    unsubscribeTrips,
    acceptPendingInvite,
    rejectPendingInvite,
  } = useSharedTripsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  useEffect(() => {
    subscribeTrips();
    fetchPendingInvites();

    return () => {
      unsubscribeTrips();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPendingInvites();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTrips(), fetchPendingInvites()]);
    setRefreshing(false);
  };

  const handleTripPress = (trip: SharedTrip) => {
    navigation.navigate('SharedTripDetail', { tripId: trip.id });
  };

  const handleCreateTrip = () => {
    navigation.navigate('CreateSharedTrip');
  };

  const handleAcceptInvite = async (tripId: string, inviteId: string) => {
    setProcessingInvite(inviteId);
    try {
      await acceptPendingInvite(tripId, inviteId);
      showToast.success('¡Bienvenido!', 'Te has unido al viaje');
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvite = async (tripId: string, inviteId: string) => {
    setProcessingInvite(inviteId);
    try {
      await rejectPendingInvite(tripId, inviteId);
      showToast.info('Invitación rechazada');
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setProcessingInvite(null);
    }
  };

  const formatTripDates = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = differenceInDays(end, start) + 1;

      return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })} · ${days} días`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  const renderTrip = ({ item: trip }: { item: SharedTrip }) => {
    const memberCount = trip.memberUids.length;

    return (
      <Pressable
        style={styles.tripCard}
        onPress={() => handleTripPress(trip)}
      >
        {trip.coverImage ? (
          <Image source={{ uri: trip.coverImage }} style={styles.tripImage} />
        ) : (
          <View style={[styles.tripImage, styles.tripImagePlaceholder]}>
            <Ionicons name="airplane" size={32} color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.tripContent}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
            {trip.currentUserRole && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[trip.currentUserRole]}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tripMeta}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.tripDestination} numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>

          <Text style={styles.tripDates}>
            {formatTripDates(trip.startDate, trip.endDate)}
          </Text>

          <View style={styles.tripFooter}>
            <View style={styles.membersInfo}>
              <Ionicons name="people-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.membersText}>
                {memberCount} {memberCount === 1 ? 'persona' : 'personas'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <>
      {pendingInvites.length > 0 && (
        <View style={styles.invitesSection}>
          <Text style={styles.sectionTitle}>
            Invitaciones pendientes ({pendingInvites.length})
          </Text>
          {pendingInvites.map((invite) => (
            <PendingInviteCard
              key={`${invite.tripId}-${invite.inviteId}`}
              invite={invite}
              onAccept={() => handleAcceptInvite(invite.tripId, invite.inviteId)}
              onReject={() => handleRejectInvite(invite.tripId, invite.inviteId)}
              loading={processingInvite === invite.inviteId}
            />
          ))}
        </View>
      )}

      {trips.length > 0 && (
        <Text style={styles.sectionTitle}>Mis viajes compartidos</Text>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>Sin viajes compartidos</Text>
      <Text style={styles.emptyText}>
        Crea un viaje y compártelo con tus compañeros de aventura
      </Text>
      <Pressable style={styles.emptyButton} onPress={handleCreateTrip}>
        <Text style={styles.emptyButtonText}>Crear viaje</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader
        title="Viajes compartidos"
        rightElement={
          <Pressable onPress={() => navigation.navigate('JoinTripByCode')}>
            <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
          </Pressable>
        }
      />

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <FloatingActionButton icon="add" onPress={handleCreateTrip} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  invitesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tripImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.background,
  },
  tripImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
  },
  tripContent: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  tripDates: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginBottom: 12,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
