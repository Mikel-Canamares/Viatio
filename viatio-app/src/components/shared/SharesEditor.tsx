import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import { TripMember, SplitMethod, ExpenseShare, centsToDisplay } from '@/types/shared';
import { theme } from '@/config/theme';

interface SharesEditorProps {
  members: TripMember[];
  participantUids: string[];
  splitMethod: SplitMethod;
  totalAmount: number; // en céntimos
  shares: Omit<ExpenseShare, 'calculatedAmount'>[];
  onChange: (shares: Omit<ExpenseShare, 'calculatedAmount'>[]) => void;
  currency?: string;
}

export function SharesEditor({
  members,
  participantUids,
  splitMethod,
  totalAmount,
  shares,
  onChange,
  currency = 'EUR',
}: SharesEditorProps) {
  const participants = members.filter(m => participantUids.includes(m.uid));

  // Auto-inicializar shares si están vacíos
  useEffect(() => {
    if (shares.length === 0 && participants.length > 0) {
      const initialShares = participants.map(m => ({
        uid: m.uid,
        displayName: m.displayName,
        value: splitMethod === 'percentage' ? Math.floor(10000 / participants.length) : 1,
      }));
      onChange(initialShares);
    }
  }, [participantUids, splitMethod]);

  // Si es reparto igualitario, solo mostrar info
  if (splitMethod === 'equal') {
    const perPerson = participants.length > 0
      ? Math.floor(totalAmount / participants.length)
      : 0;
    return (
      <View style={styles.container}>
        <Text style={styles.equalText}>
          {centsToDisplay(perPerson, currency)} por persona
        </Text>
      </View>
    );
  }

  const handleValueChange = (uid: string, value: string) => {
    const numValue = parseFloat(value.replace(',', '.')) || 0;

    let finalValue: number;
    switch (splitMethod) {
      case 'exact':
        // Convertir euros a céntimos
        finalValue = Math.round(numValue * 100);
        break;
      case 'percentage':
        // Convertir porcentaje a centésimas (50% = 5000)
        finalValue = Math.round(numValue * 100);
        break;
      case 'shares':
        // Número entero de partes
        finalValue = Math.max(0, Math.round(numValue));
        break;
      default:
        finalValue = 0;
    }

    const updated = shares.map(s =>
      s.uid === uid ? { ...s, value: finalValue } : s
    );
    onChange(updated);
  };

  const getDisplayValue = (share: Omit<ExpenseShare, 'calculatedAmount'>): string => {
    switch (splitMethod) {
      case 'exact':
        return (share.value / 100).toFixed(2);
      case 'percentage':
        return (share.value / 100).toFixed(1);
      case 'shares':
        return share.value.toString();
      default:
        return '';
    }
  };

  const getPlaceholder = (): string => {
    switch (splitMethod) {
      case 'exact': return '0.00';
      case 'percentage': return '0';
      case 'shares': return '1';
      default: return '';
    }
  };

  const getSuffix = (): string => {
    switch (splitMethod) {
      case 'exact': return '€';
      case 'percentage': return '%';
      case 'shares': return 'partes';
      default: return '';
    }
  };

  // Calcular total para validación
  const getTotal = (): { value: number; expected: number; isValid: boolean } => {
    const total = shares.reduce((sum, s) => sum + s.value, 0);

    switch (splitMethod) {
      case 'exact':
        return { value: total, expected: totalAmount, isValid: total === totalAmount };
      case 'percentage':
        return { value: total, expected: 10000, isValid: total === 10000 };
      case 'shares':
        return { value: total, expected: 0, isValid: total > 0 };
      default:
        return { value: 0, expected: 0, isValid: true };
    }
  };

  const totals = getTotal();

  return (
    <View style={styles.container}>
      {participants.map((member) => {
        const share = shares.find(s => s.uid === member.uid);
        if (!share) return null;

        return (
          <View key={member.uid} style={styles.row}>
            <View style={styles.memberInfo}>
              {member.photoURL ? (
                <Image source={{ uri: member.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {member.displayName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.memberName} numberOfLines={1}>
                {member.displayName}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={getDisplayValue(share)}
                onChangeText={(text) => handleValueChange(member.uid, text)}
                keyboardType="decimal-pad"
                placeholder={getPlaceholder()}
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.suffix}>{getSuffix()}</Text>
            </View>
          </View>
        );
      })}

      {/* Mostrar total y validación */}
      {splitMethod !== 'shares' && (
        <View style={[styles.totalRow, !totals.isValid && styles.totalRowError]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={[styles.totalValue, !totals.isValid && styles.totalValueError]}>
            {splitMethod === 'exact'
              ? centsToDisplay(totals.value, currency)
              : `${(totals.value / 100).toFixed(1)}%`
            }
          </Text>
          {!totals.isValid && (
            <Text style={styles.totalHint}>
              {splitMethod === 'exact'
                ? `(debe ser ${centsToDisplay(totals.expected, currency)})`
                : '(debe ser 100%)'
              }
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  equalText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  memberName: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    width: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    fontSize: 15,
    textAlign: 'right',
    color: theme.colors.text,
  },
  suffix: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 50,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    gap: 8,
  },
  totalRowError: {
    backgroundColor: theme.colors.error + '10',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalValueError: {
    color: theme.colors.error,
  },
  totalHint: {
    fontSize: 12,
    color: theme.colors.error,
  },
});
