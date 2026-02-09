import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, Card } from '@/components';
import { CustomModal } from '@/components/CustomModal';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, centsToDisplay, ROLE_LABELS } from '@/types/shared';
import { theme } from '@/theme';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { showToast } from '@/utils/toast';

type RouteParams = {
  SharedTripDetail: { tripId: string };
};

export default function SharedTripDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'SharedTripDetail'>>();
  const { tripId } = route.params;
  const { user } = useAuth();

  const {
    currentTrip,
    members,
    selectTrip,
    subscribeCurrentTrip,
    unsubscribeCurrentTrip,
    leaveCurrentTrip,
    deleteTrip,
  } = useSharedTripsStore();

  const { summary, fetchExpenses } = useExpensesV2Store();

  const [loading, setLoading] = useState(true);
  const [showOwnerWarningModal, setShowOwnerWarningModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadTrip();
    subscribeCurrentTrip(tripId);

    return () => {
      unsubscribeCurrentTrip();
    };
  }, [tripId]);

  const loadTrip = async () => {
    setLoading(true);
    await selectTrip(tripId);
    await fetchExpenses(tripId, members);
    setLoading(false);
  };

  useEffect(() => {
    if (members.length > 0) {
      fetchExpenses(tripId, members);
    }
  }, [members]);

  const canEdit = hasPermission(currentTrip?.currentUserRole, 'canEditTrip');
  const canDelete = hasPermission(currentTrip?.currentUserRole, 'canDeleteTrip');
  const isOwner = currentTrip?.ownerUid === user?.uid;

  const getTripStatus = () => {
    if (!currentTrip) return null;

    const today = new Date();
    const start = parseISO(currentTrip.startDate);
    const end = parseISO(currentTrip.endDate);

    if (isBefore(today, start)) {
      const daysUntil = differenceInDays(start, today);
      return {
        label: `En ${daysUntil} días`,
        color: theme.colors.primary,
        icon: 'time-outline' as const,
      };
    }

    if (isAfter(today, end)) {
      return {
        label: 'Finalizado',
        color: theme.colors.textSecondary,
        icon: 'checkmark-circle-outline' as const,
      };
    }

    return {
      label: 'En curso',
      color: theme.colors.success,
      icon: 'airplane' as const,
    };
  };

  const handleLeaveTrip = () => {
    if (isOwner) {
      setShowOwnerWarningModal(true);
      return;
    }
    setShowLeaveModal(true);
  };

  const confirmLeaveTrip = async () => {
    const success = await leaveCurrentTrip();
    if (success) {
      showToast.info('Has salido del viaje');
      navigation.goBack();
    }
  };

  const handleDeleteTrip = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteTrip = async () => {
    const success = await deleteTrip(tripId);
    if (success) {
      showToast.success('Viaje eliminado');
      navigation.goBack();
    }
  };

  if (!currentTrip) {
    return (
      <ScreenContainer>
        <PageHeader title="Cargando..." onBack={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const status = getTripStatus();
  const totalDays = differenceInDays(
    parseISO(currentTrip.endDate),
    parseISO(currentTrip.startDate)
  ) + 1;

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader
        title={currentTrip.name}
        onBack={() => navigation.goBack()}
        rightElement={
          canEdit ? (
            <Pressable onPress={() => navigation.navigate('EditSharedTrip', { tripId })}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header con imagen */}
        <View style={styles.header}>
          {currentTrip.coverImage ? (
            <Image source={{ uri: currentTrip.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={theme.colors.textTertiary} />
            </View>
          )}

          <View style={styles.headerOverlay}>
            <View style={styles.destinationRow}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
              <Text style={styles.destination}>{currentTrip.destination}</Text>
            </View>

            {status && (
              <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                <Ionicons name={status.icon} size={14} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info rápida */}
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{totalDays}</Text>
            <Text style={styles.quickInfoLabel}>días</Text>
          </View>
          <View style={styles.quickInfoDivider} />
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{members.length}</Text>
            <Text style={styles.quickInfoLabel}>personas</Text>
          </View>
          <View style={styles.quickInfoDivider} />
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>
              {centsToDisplay(summary?.totalAmount || 0, currentTrip.currency).split(',')[0]}
            </Text>
            <Text style={styles.quickInfoLabel}>gastado</Text>
          </View>
        </View>

        {/* Fechas */}
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.cardRowContent}>
              <Text style={styles.cardRowLabel}>Fechas</Text>
              <Text style={styles.cardRowValue}>
                {format(parseISO(currentTrip.startDate), "d 'de' MMMM", { locale: es })} -{' '}
                {format(parseISO(currentTrip.endDate), "d 'de' MMMM, yyyy", { locale: es })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Acciones principales */}
        <Text style={styles.sectionTitle}>Gestionar viaje</Text>

        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionCard}
            onPress={() => navigation.navigate('SharedExpenses', { tripId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '15' }]}>
              <Ionicons name="wallet-outline" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.actionLabel}>Gastos</Text>
            <Text style={styles.actionSubtitle}>
              {summary?.expenseCount || 0} gastos
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => navigation.navigate('TripMembers', { tripId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Miembros</Text>
            <Text style={styles.actionSubtitle}>
              {members.length} personas
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => navigation.navigate('TripSettlements', { tripId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name="swap-horizontal-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={styles.actionLabel}>Liquidar</Text>
            <Text style={styles.actionSubtitle}>Ver balances</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => navigation.navigate('InviteToTrip', { tripId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#9333EA15' }]}>
              <Ionicons name="person-add-outline" size={24} color="#9333EA" />
            </View>
            <Text style={styles.actionLabel}>Invitar</Text>
            <Text style={styles.actionSubtitle}>Compartir</Text>
          </Pressable>
        </View>

        {/* Preview de miembros */}
        <Card style={styles.card}>
          <Pressable
            style={styles.cardHeader}
            onPress={() => navigation.navigate('TripMembers', { tripId })}
          >
            <Text style={styles.cardTitle}>Miembros</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </Pressable>

          <View style={styles.membersPreview}>
            {members.slice(0, 5).map((member, index) => (
              <View
                key={member.uid}
                style={[
                  styles.memberAvatar,
                  { marginLeft: index > 0 ? -12 : 0, zIndex: 5 - index },
                ]}
              >
                {member.photoURL ? (
                  <Image source={{ uri: member.photoURL }} style={styles.memberAvatarImage} />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={styles.memberAvatarText}>
                      {member.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {members.length > 5 && (
              <View style={[styles.memberAvatar, styles.memberAvatarMore, { marginLeft: -12 }]}>
                <Text style={styles.memberAvatarMoreText}>+{members.length - 5}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Descripción */}
        {currentTrip.description && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Descripción</Text>
            <Text style={styles.description}>{currentTrip.description}</Text>
          </Card>
        )}

        {/* Tu rol */}
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.cardRowContent}>
              <Text style={styles.cardRowLabel}>Tu rol en este viaje</Text>
              <Text style={styles.cardRowValue}>
                {ROLE_LABELS[currentTrip.currentUserRole || 'member']}
              </Text>
            </View>
          </View>
        </Card>

        {/* Acciones peligrosas */}
        <View style={styles.dangerSection}>
          {!isOwner && (
            <Pressable style={styles.dangerButton} onPress={handleLeaveTrip}>
              <Ionicons name="exit-outline" size={20} color={theme.colors.error} />
              <Text style={styles.dangerButtonText}>Salir del viaje</Text>
            </Pressable>
          )}

          {canDelete && (
            <Pressable style={styles.dangerButton} onPress={handleDeleteTrip}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              <Text style={styles.dangerButtonText}>Eliminar viaje</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={showOwnerWarningModal}
        type="info"
        title="No puedes salir"
        message="Eres el propietario del viaje. Transfiere la propiedad a otro miembro antes de salir."
        onClose={() => setShowOwnerWarningModal(false)}
        primaryButton={{
          text: 'Entendido',
          onPress: () => setShowOwnerWarningModal(false),
        }}
      />

      <CustomModal
        visible={showLeaveModal}
        type="warning"
        title="Salir del viaje"
        message="¿Estás seguro de que quieres salir de este viaje?"
        onClose={() => setShowLeaveModal(false)}
        primaryButton={{
          text: 'Salir',
          onPress: confirmLeaveTrip,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => setShowLeaveModal(false),
        }}
      />

      <CustomModal
        visible={showDeleteModal}
        type="warning"
        title="Eliminar viaje"
        message="¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer."
        onClose={() => setShowDeleteModal(false)}
        primaryButton={{
          text: 'Eliminar',
          onPress: confirmDeleteTrip,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => setShowDeleteModal(false),
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destination: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickInfo: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickInfoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  quickInfoLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  quickInfoDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardRowContent: {
    flex: 1,
  },
  cardRowLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  cardRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  membersPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  memberAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  memberAvatarMore: {
    backgroundColor: theme.colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
  dangerSection: {
    marginTop: 32,
    marginHorizontal: 16,
    gap: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
