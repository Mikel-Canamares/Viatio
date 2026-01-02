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
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, PrimaryButton, Card } from '@/components';
import { MemberChipsSelector, SplitMethodSelector, SharesEditor } from '@/components/shared';
import { DatePickerInput } from '@/components/DatePickerInput';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useAuth } from '@/context/AuthContext';
import {
  SplitMethod,
  CreateExpenseInput,
  ExpenseShare,
  displayToCents,
} from '@/types/shared';
import { GASTO_CATEGORIAS, CategoriaGasto } from '@/types/gasto';
import { theme } from '@/theme';
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

  const { currentTrip, members } = useSharedTripsStore();
  const { addExpense, editExpense, getExpenseById } = useExpensesV2Store();

  // Estado del formulario
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoriaGasto>('food');
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
      setAmount((expense.amount / 100).toFixed(2));
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
      value: splitMethod === 'percentage'
        ? Math.floor(10000 / Math.max(participants.length, 1))
        : 1,
    })));
  }, [participantUids, splitMethod]);

  const handlePaidByToggle = (uid: string) => {
    setPaidByUid(uid);
  };

  const handleParticipantToggle = (uid: string) => {
    setParticipantUids(prev => {
      if (prev.includes(uid)) {
        // No permitir deseleccionar el último
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== uid);
      }
      return [...prev, uid];
    });
  };

  const handleSelectAllParticipants = () => {
    setParticipantUids(activeMembers.map(m => m.uid));
  };

  const handleDeselectAllParticipants = () => {
    // Mantener al menos el pagador
    setParticipantUids([paidByUid]);
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

    if (!paidByUid) {
      newErrors.paidBy = 'Selecciona quién pagó';
    }

    if (participantUids.length === 0) {
      newErrors.participants = 'Selecciona al menos un participante';
    }

    // Validar shares para exact y percentage
    if (splitMethod === 'exact') {
      const totalShares = shares.reduce((sum, s) => sum + s.value, 0);
      const amountCents = displayToCents(amountNum);
      if (totalShares !== amountCents) {
        newErrors.shares = `Los importes deben sumar ${(amountCents / 100).toFixed(2)} €`;
      }
    } else if (splitMethod === 'percentage') {
      const totalPercentage = shares.reduce((sum, s) => sum + s.value, 0);
      if (totalPercentage !== 10000) {
        newErrors.shares = 'Los porcentajes deben sumar 100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const amountInCents = displayToCents(parseFloat(amount.replace(',', '.')));

      const input: CreateExpenseInput = {
        description: description.trim(),
        amount: amountInCents,
        currency: currentTrip?.currency || 'EUR',
        category,
        date,
        paidByUid,
        splitMethod,
        participantUids,
        shares,
        notes: notes.trim() || undefined,
      };

      let success = false;

      if (isEditing && expenseId) {
        success = await editExpense(tripId, expenseId, input, activeMembers);
      } else {
        const expense = await addExpense(tripId, input, activeMembers);
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
              <Text style={styles.currency}>{currentTrip?.currency || 'EUR'}</Text>
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </Card>

          {/* Fecha y categoría */}
          <Card style={styles.card}>
            <DatePickerInput
              label="Fecha"
              value={date}
              onChange={setDate}
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
          </Card>

          {/* Quién pagó */}
          <Card style={styles.card}>
            <MemberChipsSelector
              members={activeMembers}
              selectedUids={[paidByUid]}
              onToggle={handlePaidByToggle}
              singleSelect
              label="¿Quién pagó?"
              error={errors.paidBy}
            />
          </Card>

          {/* Para quién */}
          <Card style={styles.card}>
            <MemberChipsSelector
              members={activeMembers}
              selectedUids={participantUids}
              onToggle={handleParticipantToggle}
              onSelectAll={handleSelectAllParticipants}
              onDeselectAll={handleDeselectAllParticipants}
              label="¿Para quién?"
              error={errors.participants}
            />
          </Card>

          {/* Método de reparto */}
          <Card style={styles.card}>
            <SplitMethodSelector
              selected={splitMethod}
              onSelect={setSplitMethod}
            />

            <SharesEditor
              members={activeMembers}
              participantUids={participantUids}
              splitMethod={splitMethod}
              totalAmount={amountInCents}
              shares={shares}
              onChange={setShares}
              currency={currentTrip?.currency}
            />
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
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    padding: 16,
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
  footer: {
    marginTop: 8,
  },
});
