import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemberBalance, centsToDisplay } from '@/types/shared';
import { theme } from '@/config/theme';

interface BalancesListProps {
  balances: MemberBalance[];
  currency?: string;
  currentUserId?: string;
  onMemberPress?: (balance: MemberBalance) => void;
}

export function BalancesList({
  balances,
  currency = 'EUR',
  currentUserId,
  onMemberPress,
}: BalancesListProps) {
  // Ordenar: primero deudores (negativo), luego acreedores (positivo)
  const sortedBalances = [...balances].sort((a, b) => a.netBalance - b.netBalance);

  if (balances.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay balances que mostrar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedBalances.map((balance) => {
        const isCurrentUser = balance.uid === currentUserId;
        const isPositive = balance.netBalance > 0;
        const isNegative = balance.netBalance < 0;
        const isZero = balance.netBalance === 0;

        return (
          <Pressable
            key={balance.uid}
            style={[styles.row, isCurrentUser && styles.rowHighlight]}
            onPress={() => onMemberPress?.(balance)}
            disabled={!onMemberPress}
          >
            {/* Avatar */}
            {balance.photoURL ? (
              <Image source={{ uri: balance.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {balance.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name}>
                {balance.displayName}
                {isCurrentUser && <Text style={styles.youLabel}> (tú)</Text>}
              </Text>
              <Text style={styles.details}>
                Pagado: {centsToDisplay(balance.totalPaid, currency)} ·
                Parte: {centsToDisplay(balance.totalOwed, currency)}
              </Text>
            </View>

            {/* Balance */}
            <View style={styles.balanceContainer}>
              <Text
                style={[
                  styles.balance,
                  isPositive && styles.balancePositive,
                  isNegative && styles.balanceNegative,
                  isZero && styles.balanceZero,
                ]}
              >
                {isPositive ? '+' : ''}{centsToDisplay(balance.netBalance, currency)}
              </Text>
              <Text style={styles.balanceLabel}>
                {isPositive ? 'Le deben' : isNegative ? 'Debe' : 'En paz'}
              </Text>
            </View>

            {onMemberPress && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textMuted}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowHighlight: {
    backgroundColor: theme.colors.primary + '08',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  youLabel: {
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  details: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
  },
  balancePositive: {
    color: theme.colors.success,
  },
  balanceNegative: {
    color: theme.colors.error,
  },
  balanceZero: {
    color: theme.colors.textSecondary,
  },
  balanceLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
