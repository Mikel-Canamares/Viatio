/**
 * MEMBERS SECTION
 *
 * Sección de miembros para mostrar en TripDetailScreen.
 * - Si el viaje no está compartido: Muestra botón para compartir
 * - Si el viaje está compartido: Muestra avatares de miembros
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import type { Viaje } from '@/types/viaje';
import type { TripMember } from '@/types/shared';
import { getTripMembers } from '@/services/firestore/tripsService';

interface MembersSectionProps {
  viaje: Viaje;
  onShareTrip: () => void;
  onViewMembers: () => void;
  onInvite: () => void;
}

export function MembersSection({
  viaje,
  onShareTrip,
  onViewMembers,
  onInvite,
}: MembersSectionProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(false);

  const isShared = viaje.isShared === 1 && viaje.firestoreId;

  // Cargar miembros si el viaje está compartido
  useEffect(() => {
    if (isShared && viaje.firestoreId) {
      loadMembers();
    }
  }, [isShared, viaje.firestoreId]);

  const loadMembers = async () => {
    if (!viaje.firestoreId) return;

    setLoading(true);
    try {
      const tripMembers = await getTripMembers(viaje.firestoreId);
      setMembers(tripMembers);
    } catch (error) {
      console.error('[MembersSection] Error cargando miembros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Vista para viaje no compartido
  if (!isShared) {
    return (
      <Pressable
        style={styles.shareContainer}
        onPress={onShareTrip}
      >
        <View style={styles.shareIconContainer}>
          <Ionicons name="people-outline" size={24} color={theme.colors.primaryLight} />
        </View>
        <View style={styles.shareTextContainer}>
          <Text style={styles.shareTitle}>Compartir viaje</Text>
          <Text style={styles.shareDescription}>
            Invita a otras personas para planificar juntos
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </Pressable>
    );
  }

  // Vista para viaje compartido
  return (
    <View style={styles.sharedContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Viajeros</Text>
        <Pressable onPress={onViewMembers} hitSlop={8}>
          <Text style={styles.viewAllText}>Ver todos</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primaryLight} />
      ) : (
        <View style={styles.membersRow}>
          {/* Avatares de miembros */}
          <View style={styles.avatarsContainer}>
            {members.slice(0, 4).map((member, index) => (
              <View
                key={member.uid}
                style={[
                  styles.avatarWrapper,
                  { marginLeft: index > 0 ? -8 : 0, zIndex: 4 - index },
                ]}
              >
                {member.photoURL ? (
                  <Image source={{ uri: member.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {member.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {members.length > 4 && (
              <View style={[styles.avatarWrapper, { marginLeft: -8 }]}>
                <View style={[styles.avatar, styles.moreAvatar]}>
                  <Text style={styles.moreText}>+{members.length - 4}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Texto de conteo */}
          <Text style={styles.memberCount}>
            {members.length} {members.length === 1 ? 'viajero' : 'viajeros'}
          </Text>

          {/* Botón invitar */}
          <Pressable style={styles.inviteButton} onPress={onInvite}>
            <Ionicons name="person-add-outline" size={18} color={theme.colors.primaryLight} />
            <Text style={styles.inviteText}>Invitar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Container para viaje no compartido
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  shareTextContainer: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  shareDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Container para viaje compartido
  sharedContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    fontWeight: '500',
  },

  // Row de miembros
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarsContainer: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.card,
    borderRadius: theme.radius.full,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  moreAvatar: {
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  // Conteo y botón
  memberCount: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: theme.radius.md,
    gap: 4,
  },
  inviteText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primaryLight,
  },
});
