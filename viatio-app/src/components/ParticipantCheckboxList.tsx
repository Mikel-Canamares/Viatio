import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { NumericInput } from './NumericInput';
import { ConvertedAmount } from './ConvertedAmount';

interface Participant {
  uid: string;
  displayName: string;
}

interface ParticipantCheckboxListProps {
  participants: Participant[];
  selectedIds: string[];
  onToggle: (uid: string) => void;
  showAmounts?: boolean;
  amounts?: Record<string, number>;  // uid -> amount en cents
  currency?: string;
  userCurrency?: string;  // Moneda del perfil del usuario
  editable?: boolean;  // Si los montos son editables
  onAmountChange?: (uid: string, amount: number) => void;  // Callback para cambios
}

export function ParticipantCheckboxList({
  participants,
  selectedIds,
  onToggle,
  showAmounts = false,
  amounts,
  currency = 'EUR',
  userCurrency = 'EUR',
  editable = false,
  onAmountChange,
}: ParticipantCheckboxListProps) {
  const handleAmountChange = (uid: string, value: number | null) => {
    if (!onAmountChange) return;

    // Convertir euros a céntimos (0 si null)
    const amountInCents = value !== null ? Math.round(value * 100) : 0;
    onAmountChange(uid, amountInCents);
  };

  return (
    <View style={styles.container}>
      {participants.map((participant, index) => {
        const isSelected = selectedIds.includes(participant.uid);
        const amount = amounts?.[participant.uid] || 0;
        // Si es 0, pasar null para que muestre el placeholder
        const amountInEuros = amount > 0 ? amount / 100 : null;

        return (
          <Pressable
            key={participant.uid}
            style={({ pressed }) => [
              styles.row,
              pressed && !editable && styles.rowPressed,
              index === participants.length - 1 && styles.rowLast,
            ]}
            onPress={() => !editable && onToggle(participant.uid)}
            disabled={editable}
          >
            {/* Checkbox */}
            <Pressable
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
              onPress={() => onToggle(participant.uid)}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={theme.colors.accentForeground} />
              )}
            </Pressable>

            {/* Nombre */}
            <Text style={styles.name}>{participant.displayName}</Text>

            {/* Cantidad (opcional) */}
            {showAmounts && !editable && (
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>
                  {amountInEuros !== null ? amountInEuros.toFixed(2) : '0.00'} {currency === 'EUR' ? '€' : currency}
                </Text>
                {amountInEuros !== null && amountInEuros > 0 && currency !== userCurrency && (
                  <ConvertedAmount
                    amount={amountInEuros}
                    currency={currency}
                    targetCurrency={userCurrency}
                    showOriginal={false}
                    convertedStyle={styles.conversion}
                  />
                )}
              </View>
            )}

            {/* Input editable para montos exactos */}
            {showAmounts && editable && isSelected && (
              <View style={styles.inputContainer}>
                <NumericInput
                  style={styles.input}
                  value={amountInEuros}
                  onValueChange={(value) => handleAmountChange(participant.uid, value)}
                  mode="decimal"
                  maxDecimals={2}
                  min={0}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Text style={styles.currency}>{currency === 'EUR' ? '€' : currency}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowPressed: {
    backgroundColor: theme.colors.secondary + '40',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  conversion: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'right',
    color: theme.colors.text,
    backgroundColor: '#FFFFFF',
  },
  currency: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    width: 30,
  },
});
