/**
 * MEMBERS SECTION
 *
 * Sección de miembros para mostrar en TripDetailScreen.
 * - Si el viaje no está compartido: Muestra botón para compartir
 * - Si el viaje está compartido: Muestra card con icono de personas
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { Card } from '@/components';
import type { Viaje } from '@/types/viaje';
import type { TripMember } from '@/types/shared';
import { getTripMembers } from '@/services/firestore/tripsService';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();

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

  // Verificar si el usuario actual es administrador (owner o admin)
  const currentMember = members.find(m => m.uid === user?.uid);
  const isAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // Vista para viaje no compartido
  if (!isShared) {
    return (
      <Card onPress={onShareTrip} style={styles.menuCard}>
        <View style={styles.menuRow}>
          <View style={[styles.iconContainer, styles.iconViajeros]}>
            <Ionicons name="people-outline" size={24} color="#EC4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Compartir viaje</Text>
            <Text style={styles.menuDescription}>Invita a otras personas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>
      </Card>
    );
  }

  // Vista para viaje compartido
  if (loading) {
    return (
      <Card style={styles.menuCard}>
        <View style={styles.menuRow}>
          <View style={[styles.iconContainer, styles.iconViajeros]}>
            <Ionicons name="people-outline" size={24} color="#EC4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <ActivityIndicator size="small" color={theme.colors.primaryLight} />
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onViewMembers} style={styles.menuCard}>
      <View style={styles.menuRow}>
        <View style={[styles.iconContainer, styles.iconViajeros]}>
          <Ionicons name="people-outline" size={24} color="#EC4899" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Viajeros</Text>
          <Text style={styles.menuDescription}>
            {members.length} {members.length === 1 ? 'viajero' : 'viajeros'}
          </Text>
        </View>
        {isAdmin && (
          <Pressable
            style={styles.inviteButton}
            onPress={(e) => {
              e.stopPropagation();
              onInvite();
            }}
            hitSlop={8}
          >
            <Ionicons name="person-add-outline" size={20} color={theme.colors.primaryLight} />
          </Pressable>
        )}
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    marginBottom: theme.spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconViajeros: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // Rosa pink
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
});
