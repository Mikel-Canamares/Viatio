import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingInvite, ROLE_LABELS } from '@/types/shared';
import { theme } from '@/config/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PendingInviteCardProps {
  invite: PendingInvite;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function PendingInviteCard({
  invite,
  onAccept,
  onReject,
  loading = false,
}: PendingInviteCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={28} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Invitación a viaje</Text>
        <Text style={styles.tripName}>{invite.tripName}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            De: {invite.invitedByName}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>
            Rol: {ROLE_LABELS[invite.role]}
          </Text>
        </View>

        <Text style={styles.date}>
          {format(invite.createdAt, "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.rejectButton} onPress={onReject}>
            <Ionicons name="close" size={20} color={theme.colors.error} />
          </Pressable>
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '08',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    marginBottom: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  dot: {
    marginHorizontal: 6,
    color: theme.colors.textMuted,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
