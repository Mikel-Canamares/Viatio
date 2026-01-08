import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Settlement, centsToDisplay } from '@/types/shared';
import { theme } from '@/config/theme';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SettlementsListProps {
  settlements: Settlement[];
  currency?: string;
  currentUserId?: string;
  onSettlementPress?: (settlement: Settlement) => void;
  onMarkComplete?: (settlement: Settlement) => void;
}

export function SettlementsList({
  settlements,
  currency = 'EUR',
  currentUserId,
  onSettlementPress,
  onMarkComplete,
}: SettlementsListProps) {
  if (settlements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="swap-horizontal-outline" size={40} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>No hay liquidaciones registradas</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {settlements.map((settlement) => {
        const isFrom = settlement.fromUid === currentUserId;
        const isTo = settlement.toUid === currentUserId;
        const isPending = settlement.status === 'pending';

        return (
          <Pressable
            key={settlement.id}
            style={[styles.card, isPending && styles.cardPending]}
            onPress={() => onSettlementPress?.(settlement)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.usersRow}>
                <View style={[styles.userCircle, styles.fromCircle]}>
                  <Text style={styles.userInitial}>
                    {settlement.fromName.charAt(0)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
                <View style={[styles.userCircle, styles.toCircle]}>
                  <Text style={styles.userInitial}>
                    {settlement.toName.charAt(0)}
                  </Text>
                </View>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amount}>
                  {centsToDisplay(settlement.amount, currency)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  isPending ? styles.statusPending : styles.statusCompleted
                ]}>
                  <Text style={[
                    styles.statusText,
                    isPending ? styles.statusTextPending : styles.statusTextCompleted
                  ]}>
                    {isPending ? 'Pendiente' : 'Completado'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.description}>
                {isFrom ? 'Tú' : settlement.fromName} pagó a {isTo ? 'ti' : settlement.toName}
              </Text>
              <Text style={styles.date}>{formatDate(settlement.date)}</Text>
            </View>

            {isPending && (isFrom || isTo) && onMarkComplete && (
              <Pressable
                style={styles.completeButton}
                onPress={() => onMarkComplete(settlement)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
                <Text style={styles.completeButtonText}>Marcar como completado</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPending: {
    borderColor: theme.colors.accent,
    borderStyle: 'dashed',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromCircle: {
    backgroundColor: theme.colors.error + '20',
  },
  toCircle: {
    backgroundColor: theme.colors.success + '20',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statusPending: {
    backgroundColor: theme.colors.accent + '20',
  },
  statusCompleted: {
    backgroundColor: theme.colors.success + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPending: {
    color: theme.colors.accent,
  },
  statusTextCompleted: {
    color: theme.colors.success,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  date: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  completeButtonText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
  },
});
