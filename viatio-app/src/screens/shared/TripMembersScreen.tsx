import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, PrimaryButton } from '@/components';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useAuth } from '@/context/AuthContext';
import { TripMember, TripRole, ROLE_LABELS, hasPermission } from '@/types/shared';
import { theme } from '@/theme';
import { showToast } from '@/utils/toast';

type RouteParams = {
  TripMembers: { viajeId: string; firestoreId: string };
};

export default function TripMembersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'TripMembers'>>();
  const { firestoreId } = route.params;
  // Usamos firestoreId como tripId para las operaciones de Firestore
  const tripId = firestoreId;
  const { user } = useAuth();

  const {
    currentTrip,
    members,
    invitations,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    cancelInvite,
    changeMemberRole,
    removeMember,
  } = useSharedTripsStore();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TripRole>('member');
  const [loading, setLoading] = useState(false);

  const currentUserRole = currentTrip?.currentUserRole;
  const canInvite = hasPermission(currentUserRole, 'canInviteMembers');
  const canManageMembers = hasPermission(currentUserRole, 'canRemoveMembers');

  useEffect(() => {
    fetchMembers(tripId);
    fetchInvitations(tripId);
  }, [tripId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast.error('Error', 'Introduce un email');
      return;
    }

    setLoading(true);
    try {
      await inviteMember(tripId, inviteEmail.trim(), inviteRole);
      showToast.success('Invitación enviada', `Se ha invitado a ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchInvitations(tripId);
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = (inviteId: string, email: string) => {
    Alert.alert(
      'Cancelar invitación',
      `¿Cancelar la invitación a ${email}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await cancelInvite(tripId, inviteId);
            showToast.info('Invitación cancelada');
          },
        },
      ]
    );
  };

  const handleChangeRole = (member: TripMember) => {
    if (member.role === 'owner') {
      showToast.info('No permitido', 'No puedes cambiar el rol del propietario');
      return;
    }

    const roles: TripRole[] = ['admin', 'member', 'read_only'];

    Alert.alert(
      'Cambiar rol',
      `Selecciona el nuevo rol para ${member.displayName}`,
      [
        ...roles.map(role => ({
          text: ROLE_LABELS[role] + (role === member.role ? ' ✓' : ''),
          onPress: async () => {
            const success = await changeMemberRole(tripId, member.uid, role);
            if (success) {
              showToast.success('Rol actualizado');
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const handleRemoveMember = (member: TripMember) => {
    if (member.role === 'owner') {
      showToast.info('No permitido', 'No puedes eliminar al propietario');
      return;
    }

    Alert.alert(
      'Eliminar miembro',
      `¿Eliminar a ${member.displayName} del viaje?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMember(tripId, member.uid);
            if (success) {
              showToast.success('Eliminado', `${member.displayName} ha sido eliminado`);
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item: member }: { item: TripMember }) => {
    const isCurrentUser = member.uid === user?.uid;
    const isOwner = member.role === 'owner';

    return (
      <View style={styles.memberCard}>
        {member.photoURL ? (
          <Image source={{ uri: member.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {member.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {member.displayName}
            {isCurrentUser && <Text style={styles.youLabel}> (tú)</Text>}
          </Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
          <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
            <Text style={[styles.roleText, isOwner && styles.roleTextOwner]}>
              {ROLE_LABELS[member.role]}
            </Text>
          </View>
        </View>

        {canManageMembers && !isCurrentUser && !isOwner && (
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleChangeRole(member)}
            >
              <Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleRemoveMember(member)}
            >
              <Ionicons name="person-remove-outline" size={20} color={theme.colors.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <PageHeader
        title="Miembros"
        onBack={() => navigation.goBack()}
        rightElement={
          canInvite ? (
            <Pressable onPress={() => setShowInviteModal(true)}>
              <Ionicons name="person-add" size={24} color="#FFFFFF" />
            </Pressable>
          ) : undefined
        }
      />

      <FlatList
        data={members.filter(m => m.status === 'active')}
        keyExtractor={(item) => item.uid}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View style={styles.invitationsSection}>
              <Text style={styles.sectionTitle}>Invitaciones pendientes</Text>
              {invitations.map((invite) => (
                <View key={invite.id} style={styles.inviteCard}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteEmail}>{invite.email}</Text>
                    <Text style={styles.inviteRole}>{ROLE_LABELS[invite.role]}</Text>
                  </View>
                  {canManageMembers && (
                    <Pressable onPress={() => handleCancelInvite(invite.id, invite.email)}>
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay miembros activos</Text>
          </View>
        }
      />

      {/* Modal de invitación */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar miembro</Text>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="ejemplo@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.inputLabel}>Rol</Text>
            <View style={styles.roleSelector}>
              {(['admin', 'member', 'read_only'] as TripRole[]).map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.roleOption,
                    inviteRole === role && styles.roleOptionSelected,
                  ]}
                  onPress={() => setInviteRole(role)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      inviteRole === role && styles.roleOptionTextSelected,
                    ]}
                  >
                    {ROLE_LABELS[role]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </Pressable>
              <PrimaryButton
                title="Invitar"
                onPress={handleInvite}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  invitationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteEmail: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  inviteRole: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  youLabel: {
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  memberEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  roleBadgeOwner: {
    backgroundColor: theme.colors.primary + '20',
  },
  roleText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  roleTextOwner: {
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  roleOptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  roleOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
