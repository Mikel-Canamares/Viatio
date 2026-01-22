import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettlementSuggestion, centsToDisplay } from '@/types/shared';
import { theme } from '@/config/theme';

interface SettlementSuggestionsProps {
  suggestions: SettlementSuggestion[];
  currency?: string;
  currentUserId?: string;
  onSettlePress: (suggestion: SettlementSuggestion) => void;
}

export function SettlementSuggestions({
  suggestions,
  currency = 'EUR',
  currentUserId,
  onSettlePress,
}: SettlementSuggestionsProps) {

  // Filtrar sugerencias con importes insignificantes (< 0.10 en cualquier moneda)
  const MINIMUM_AMOUNT = 10; // 10 céntimos
  const validSuggestions = suggestions.filter(s => s.amount >= MINIMUM_AMOUNT);

  // Si no hay sugerencias válidas, todo está cuadrado
  if (validSuggestions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Text style={styles.emptyTitle}>¡Todo cuadrado!</Text>
        <Text style={styles.emptyText}>No hay deudas pendientes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quién debe a quién</Text>
      <Text style={styles.subtitle}>
        {validSuggestions.length} {validSuggestions.length === 1 ? 'pago' : 'pagos'} para saldar cuentas
      </Text>

      {validSuggestions.map((suggestion, index) => {
        const isFromCurrentUser = suggestion.fromUid === currentUserId;
        const isToCurrentUser = suggestion.toUid === currentUserId;

        return (
          <View key={index} style={styles.suggestionCard}>
            <View style={styles.suggestionContent}>
              {/* Persona que debe */}
              <View style={styles.personColumn}>
                <View style={[styles.initialsCircle, styles.debtorCircle]}>
                  <Text style={styles.initialsText}>
                    {suggestion.fromName.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {isFromCurrentUser ? 'Tú' : suggestion.fromName}
                </Text>
              </View>

              {/* Flecha y cantidad */}
              <View style={styles.arrowContainer}>
                <View style={styles.arrowLine} />
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>
                    {centsToDisplay(suggestion.amount, currency)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
              </View>

              {/* Persona que recibe */}
              <View style={styles.personColumn}>
                <View style={[styles.initialsCircle, styles.creditorCircle]}>
                  <Text style={styles.initialsText}>
                    {suggestion.toName.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {isToCurrentUser ? 'Tú' : suggestion.toName}
                </Text>
              </View>
            </View>

            {/* Botón de acción */}
            <Pressable
              style={[
                styles.settleButton,
                isFromCurrentUser && styles.settleButtonHighlight,
              ]}
              onPress={() => onSettlePress(suggestion)}
            >
              <Text
                style={[
                  styles.settleButtonText,
                  isFromCurrentUser && styles.settleButtonTextHighlight,
                ]}
              >
                {isFromCurrentUser ? 'Registrar pago' : 'Marcar como pagado'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: theme.colors.success + '10',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  personColumn: {
    alignItems: 'center',
    width: 80,
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  debtorCircle: {
    backgroundColor: theme.colors.error + '20',
  },
  creditorCircle: {
    backgroundColor: theme.colors.success + '20',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  personName: {
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center',
  },
  arrowContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  arrowLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  amountColumn: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  amountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  conversion: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  tripCurrencyHint: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  settleButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  settleButtonHighlight: {
    backgroundColor: theme.colors.primary,
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  settleButtonTextHighlight: {
    color: '#FFFFFF',
  },
});
