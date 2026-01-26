import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, PrimaryButton, Card, Dropdown, DropdownOption, ParticipantCheckboxList } from '@/components';
import { ReservationCurrencyPicker } from '@/components/ReservationCurrencyPicker';
import { ConvertedAmount } from '@/components/ConvertedAmount';
import { SharesEditor } from '@/components/shared';
import { DatePickerInput } from '@/components/DatePickerInput';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useCurrencyStore } from '@/store/currencyStore';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { useAuth } from '@/context/AuthContext';
import {
  SplitMethod,
  CreateExpenseInput,
  ExpenseShare,
  displayToCents,
} from '@/types/shared';
import { GASTO_CATEGORIAS, CategoriaGasto } from '@/types/gasto';
import { theme } from '@/config/theme';
import { showToast } from '@/utils/toast';
import { format } from 'date-fns';

type RouteParams = {
  AddSharedExpense: { tripId: string; expenseId?: string };
};

export default function AddSharedExpenseScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddSharedExpense'>>();
  const { tripId, expenseId } = route.params;
  const { user } = useAuth();
  const isEditing = !!expenseId;
  const insets = useSafeAreaInsets();

  const { currentTrip, members, fetchMembers, selectTrip } = useSharedTripsStore();
  const { addExpense, editExpense, getExpenseById } = useExpensesV2Store();
  const { loadRates, convert } = useCurrencyStore();
  const { config } = useConfiguracionStore();

  // Estado del formulario
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [category, setCategory] = useState<CategoriaGasto | undefined>(undefined);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paidByUid, setPaidByUid] = useState<string>(user?.uid || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [participantUids, setParticipantUids] = useState<string[]>([]);
  const [shares, setShares] = useState<Omit<ExpenseShare, 'calculatedAmount'>[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeMembers = members.filter(m => m.status === 'active');

  // Opciones para dropdowns
  const paidByOptions: DropdownOption[] = activeMembers.length > 0
    ? activeMembers.map(member => ({
        label: member.displayName + (member.uid === user?.uid ? ' (Yo)' : ''),
        value: member.uid,
      }))
    : [];

  const splitMethodOptions: DropdownOption<SplitMethod>[] = [
    { label: 'Igualmente', value: 'equal', icon: 'git-compare-outline' },
    { label: 'Partes', value: 'shares', icon: 'grid-outline' },
    { label: 'Como montos', value: 'exact', icon: 'cash-outline' },
  ];

  // Cargar viaje y miembros al montar
  useEffect(() => {
    // Si currentTrip no existe o no coincide con el tripId, cargarlo
    if (!currentTrip || currentTrip.id !== tripId) {
      selectTrip(tripId);
    } else {
      // Solo cargar miembros si el viaje ya está cargado
      fetchMembers(tripId);
    }
  }, [tripId, currentTrip?.id]);

  // Cargar divisa del viaje y tasas de cambio
  useEffect(() => {
    if (currentTrip?.currency && !isEditing) {
      setCurrency(currentTrip.currency);
      loadRates(currentTrip.currency);
    }
  }, [currentTrip]);

  // Convertir amount cuando cambia la divisa
  useEffect(() => {
    const convertCurrency = async () => {
      if (!currency || !currentTrip?.currency) return;

      // No convertir si no hay amount o es la primera carga
      const currentAmount = parseFloat(amount.replace(',', '.'));
      if (!amount || isNaN(currentAmount) || currentAmount <= 0) return;

      // Cargar tasas para la nueva divisa
      await loadRates(currency);
    };

    convertCurrency();
  }, [currency]);

  // Cargar gasto existente si es edición
  useEffect(() => {
    if (isEditing && expenseId) {
      loadExpense();
    }
  }, [expenseId]);

  const loadExpense = async () => {
    if (!expenseId) return;

    setLoadingExpense(true);
    const expense = await getExpenseById(tripId, expenseId);

    if (expense) {
      setDescription(expense.description);
      // Usar monto y moneda original si existe, sino usar el normalizado
      const displayAmount = expense.originalAmount ?? expense.amount;
      const displayCurrency = expense.originalCurrency ?? expense.currency;
      setAmount((displayAmount / 100).toFixed(2));
      setCurrency(displayCurrency);
      setCategory(expense.category as CategoriaGasto);
      setDate(expense.date);
      setPaidByUid(expense.paidByUid);
      setSplitMethod(expense.splitMethod);
      setParticipantUids(expense.participantUids);
      setShares(expense.shares.map(s => ({
        uid: s.uid,
        displayName: s.displayName,
        value: s.value,
      })));
      setNotes(expense.notes || '');
    }
    setLoadingExpense(false);
  };

  // Inicializar participantes con todos los miembros
  useEffect(() => {
    if (activeMembers.length > 0 && participantUids.length === 0 && !isEditing) {
      setParticipantUids(activeMembers.map(m => m.uid));
    }
  }, [activeMembers]);

  // Actualizar shares cuando cambian participantes o método
  useEffect(() => {
    const participants = activeMembers.filter(m => participantUids.includes(m.uid));
    setShares(participants.map(m => ({
      uid: m.uid,
      displayName: m.displayName,
      // Para 'exact' iniciar en 0, para 'shares' en 1
      value: splitMethod === 'exact' ? 0 : 1,
    })));
  }, [participantUids, splitMethod]);

  // Toggle participante
  const handleToggleParticipant = (uid: string) => {
    if (participantUids.includes(uid)) {
      // Deseleccionar (mantener al menos uno)
      if (participantUids.length > 1) {
        setParticipantUids(participantUids.filter(id => id !== uid));
      }
    } else {
      // Seleccionar
      setParticipantUids([...participantUids, uid]);
    }
  };

  // Manejar cambio de monto individual (para método 'exact')
  const handleAmountChange = (uid: string, amountInCents: number) => {
    const updated = shares.map(s =>
      s.uid === uid ? { ...s, value: amountInCents } : s
    );
    setShares(updated);
  };

  // Calcular montos por participante
  const calculateAmounts = (): Record<string, number> => {
    const amounts: Record<string, number> = {};

    if (splitMethod === 'equal') {
      const equalAmount = Math.floor(amountInCents / participantUids.length);
      participantUids.forEach(uid => {
        amounts[uid] = equalAmount;
      });
    } else if (splitMethod === 'shares') {
      // Calcular proporcionalmente basado en partes
      const totalShares = shares.reduce((sum, s) => sum + s.value, 0);
      if (totalShares > 0) {
        shares.forEach(share => {
          amounts[share.uid] = Math.floor((amountInCents * share.value) / totalShares);
        });
      } else {
        shares.forEach(share => {
          amounts[share.uid] = 0;
        });
      }
    } else {
      // Para 'exact' y 'percentage', usar shares calculados directamente
      shares.forEach(share => {
        amounts[share.uid] = share.value;
      });
    }

    return amounts;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Describe el gasto';
    }

    const amountNum = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Introduce un importe válido';
    }

    if (!category) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (!paidByUid) {
      newErrors.paidBy = 'Selecciona quién pagó';
    }

    if (participantUids.length === 0) {
      newErrors.participants = 'Selecciona al menos un participante';
    }

    // Validar shares para exact
    if (splitMethod === 'exact') {
      const totalShares = shares.reduce((sum, s) => sum + s.value, 0);
      const amountCents = displayToCents(amountNum);
      if (totalShares !== amountCents) {
        newErrors.shares = `Los importes deben sumar ${(amountCents / 100).toFixed(2)} €`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Guard: category debe estar definida después de la validación
    if (!category) return;

    setLoading(true);

    try {
      const amountInCents = displayToCents(parseFloat(amount.replace(',', '.')));

      const input: CreateExpenseInput = {
        description: description.trim(),
        amount: amountInCents,
        currency,
        category,
        date,
        paidByUid,
        splitMethod,
        participantUids,
        shares,
        notes: notes.trim() || undefined,
      };

      let success = false;

      const tripCurrency = currentTrip?.currency || 'EUR';

      if (isEditing && expenseId) {
        success = await editExpense(tripId, expenseId, input, activeMembers, tripCurrency);
      } else {
        const expense = await addExpense(tripId, input, activeMembers, tripCurrency);
        success = !!expense;
      }

      if (success) {
        showToast.success(
          isEditing ? 'Gasto actualizado' : 'Gasto añadido',
          description
        );
        navigation.goBack();
      } else {
        showToast.error('Error', 'No se pudo guardar el gasto');
      }
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const amountInCents = displayToCents(parseFloat(amount.replace(',', '.')) || 0);

  if (loadingExpense) {
    return (
      <ScreenContainer>
        <PageHeader title="Cargando..." onBack={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader
        title={isEditing ? 'Editar gasto' : 'Nuevo gasto'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 } // 80px para el botón + espacio
          ]}
        >
          {/* Descripción e importe */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>¿Qué pagaste?</Text>

            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Cena en restaurante"
              placeholderTextColor={theme.colors.textTertiary}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}

            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, errors.amount && styles.inputError]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.colors.textTertiary}
              />
              <Text style={styles.currency}>{currency}</Text>
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

            {/* Conversión en tiempo real */}
            {amount && parseFloat(amount) > 0 && currency !== config.monedaDefault && config.monedaDefault && (
              <View style={styles.conversionContainer}>
                <ConvertedAmount
                  amount={parseFloat(amount.replace(',', '.'))}
                  currency={currency}
                  targetCurrency={config.monedaDefault}
                  showOriginal={false}
                />
              </View>
            )}

            {/* Selector de divisa (solo moneda del viaje y moneda del usuario) */}
            <ReservationCurrencyPicker
              value={currency}
              onChange={setCurrency}
              tripCurrency={currentTrip?.currency || 'EUR'}
              userCurrency={config.monedaDefault}
              label="Divisa"
            />

            <Text style={styles.inputLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {(Object.entries(GASTO_CATEGORIAS) as [CategoriaGasto, typeof GASTO_CATEGORIAS[CategoriaGasto]][]).map(
                  ([key, config]) => (
                    <Pressable
                      key={key}
                      style={[
                        styles.categoryChip,
                        category === key && {
                          backgroundColor: config.color + '20',
                          borderColor: config.color,
                        },
                      ]}
                      onPress={() => setCategory(key)}
                    >
                      <Ionicons
                        name={config.icon as any}
                        size={18}
                        color={category === key ? config.color : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          category === key && { color: config.color },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </Card>

          {/* Pagado por + Cuando (misma fila) */}
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Dropdown
                  label="Pagado por"
                  options={paidByOptions}
                  value={paidByUid}
                  onChange={setPaidByUid}
                  error={errors.paidBy}
                />
              </View>
              <View style={styles.halfColumn}>
                <DatePickerInput
                  label="Cuando"
                  value={date}
                  onChange={setDate}
                />
              </View>
            </View>
          </Card>

          {/* Dividir + Lista de participantes */}
          <Card style={styles.card}>
            <Dropdown<SplitMethod>
              label="Dividir"
              options={splitMethodOptions}
              value={splitMethod}
              onChange={setSplitMethod}
            />

            <ParticipantCheckboxList
              participants={activeMembers}
              selectedIds={participantUids}
              onToggle={handleToggleParticipant}
              showAmounts={true}
              amounts={calculateAmounts()}
              currency={currency}
              userCurrency={config.monedaDefault}
              editable={splitMethod === 'exact'}
              onAmountChange={handleAmountChange}
            />
            {errors.participants && <Text style={styles.errorText}>{errors.participants}</Text>}

            {/* Validación de total para método 'exact' */}
            {splitMethod === 'exact' && (
              <View style={[
                styles.validationRow,
                shares.reduce((sum, s) => sum + s.value, 0) !== amountInCents && styles.validationRowError
              ]}>
                <Text style={styles.validationLabel}>Total:</Text>
                <Text style={[
                  styles.validationValue,
                  shares.reduce((sum, s) => sum + s.value, 0) !== amountInCents && styles.validationValueError
                ]}>
                  {(shares.reduce((sum, s) => sum + s.value, 0) / 100).toFixed(2)} {currency}
                </Text>
                {shares.reduce((sum, s) => sum + s.value, 0) !== amountInCents && (
                  <Text style={styles.validationHint}>
                    (debe ser {(amountInCents / 100).toFixed(2)} {currency})
                  </Text>
                )}
              </View>
            )}

            {/* SharesEditor solo para 'shares' y 'percentage' */}
            {(splitMethod === 'shares' || splitMethod === 'percentage') && (
              <SharesEditor
                members={activeMembers}
                participantUids={participantUids}
                splitMethod={splitMethod}
                totalAmount={amountInCents}
                shares={shares}
                onChange={setShares}
                currency={currency}
              />
            )}
            {errors.shares && <Text style={styles.errorText}>{errors.shares}</Text>}
          </Card>

          {/* Notas */}
          <Card style={styles.card}>
            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Añade detalles..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </Card>

          {/* Botón guardar */}
          <View style={styles.footer}>
            <PrimaryButton
              title={isEditing ? 'Guardar cambios' : 'Guardar gasto'}
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: -8,
    marginBottom: 8,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  validationRowError: {
    backgroundColor: theme.colors.error + '10',
    marginHorizontal: -16,
    paddingHorizontal: 28,
    paddingBottom: 12,
    borderRadius: 8,
  },
  validationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  validationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  validationValueError: {
    color: theme.colors.error,
  },
  validationHint: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
  },
  conversionContainer: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
});
