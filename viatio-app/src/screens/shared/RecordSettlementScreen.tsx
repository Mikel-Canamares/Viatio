import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, PrimaryButton, Card } from '@/components';
import { DatePickerInput } from '@/components/DatePickerInput';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { centsToDisplay, displayToCents } from '@/types/shared';
import { theme } from '@/theme';
import { format } from 'date-fns';
import { showToast } from '@/utils/toast';

type RouteParams = {
  RecordSettlement: {
    viajeId: string;
    firestoreId: string;
    fromUid: string;
    toUid: string;
    amount: number;
  };
};

export default function RecordSettlementScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'RecordSettlement'>>();
  const { firestoreId, fromUid, toUid, amount: suggestedAmount } = route.params;
  // Usamos firestoreId como tripId para las operaciones de Firestore
  const tripId = firestoreId;

  const { currentTrip, members } = useSharedTripsStore();
  const { addSettlement } = useExpensesV2Store();
  const { config } = useConfiguracionStore();

  // Moneda del viaje (para conversión interna)
  const tripCurrency = currentTrip?.currency || 'EUR';

  // Moneda del usuario (para mostrar al usuario)
  const userCurrency = config.monedaDefault || 'EUR';
  const [currency, setCurrency] = useState(userCurrency);

  const [amount, setAmount] = useState((suggestedAmount / 100).toFixed(2));
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fromMember = members.find(m => m.uid === fromUid);
  const toMember = members.find(m => m.uid === toUid);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast.error('Error', 'Introduce un importe válido');
      return;
    }

    setLoading(true);

    try {
      const settlement = await addSettlement(
        tripId,
        {
          fromUid,
          toUid,
          amount: displayToCents(amountNum),
          currency, // Moneda seleccionada por el usuario
          date,
          notes: notes.trim() || undefined,
        },
        members,
        tripCurrency // Moneda de referencia del viaje
      );

      if (settlement) {
        showToast.success('Pago registrado', 'El pago ha sido registrado correctamente');
        navigation.goBack();
      } else {
        showToast.error('Error', 'No se pudo registrar el pago');
      }
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!fromMember || !toMember) {
    return (
      <ScreenContainer>
        <PageHeader title="Error" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text>No se encontraron los miembros</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader title="Registrar pago" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Visualización de quién paga a quién */}
        <Card style={styles.card}>
          <View style={styles.transferVisualization}>
            <View style={styles.personColumn}>
              {fromMember.photoURL ? (
                <Image source={{ uri: fromMember.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {fromMember.displayName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.personName}>{fromMember.displayName}</Text>
              <Text style={styles.personRole}>Paga</Text>
            </View>

            <View style={styles.arrowContainer}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowIcon}>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.arrowLine} />
            </View>

            <View style={styles.personColumn}>
              {toMember.photoURL ? (
                <Image source={{ uri: toMember.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {toMember.displayName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.personName}>{toMember.displayName}</Text>
              <Text style={styles.personRole}>Recibe</Text>
            </View>
          </View>
        </Card>

        {/* Importe */}
        <Card style={styles.card}>
          <Text style={styles.inputLabel}>Importe</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={styles.currency}>{currency}</Text>
          </View>

          <Text style={styles.suggestedText}>
            Sugerido: {centsToDisplay(suggestedAmount, currency)}
          </Text>
        </Card>

        {/* Fecha */}
        <Card style={styles.card}>
          <DatePickerInput
            label="Fecha del pago"
            value={date}
            onChange={setDate}
          />
        </Card>

        {/* Notas */}
        <Card style={styles.card}>
          <Text style={styles.inputLabel}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: Bizum, efectivo, transferencia..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Botón */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Registrar pago"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  transferVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  personColumn: {
    alignItems: 'center',
    width: 100,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  personRole: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  arrowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
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
  suggestedText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 16,
  },
});
