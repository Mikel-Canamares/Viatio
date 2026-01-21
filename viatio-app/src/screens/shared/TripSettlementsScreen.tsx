import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer, PageHeader } from '@/components';
import { SettlementSuggestions, SettlementsList } from '@/components/shared';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useAuth } from '@/context/AuthContext';
import { Settlement, SettlementSuggestion } from '@/types/shared';
import { theme } from '@/theme';
import { showToast } from '@/utils/toast';
import { getViajeById } from '@/services/viajesService';

type RouteParams = {
  TripSettlements: { viajeId: string; firestoreId: string };
};

export default function TripSettlementsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'TripSettlements'>>();
  const { viajeId, firestoreId } = route.params;
  // Usamos firestoreId como tripId para las operaciones de Firestore
  const tripId = firestoreId;
  const { user } = useAuth();

  const { currentTrip, members } = useSharedTripsStore();
  const {
    settlementSuggestions,
    settlements,
    fetchSettlements,
    markSettlementComplete,
  } = useExpensesV2Store();

  const { config } = useConfiguracionStore();
  const { convert } = useCurrencyStore();
  const userCurrency = config.monedaDefault || 'EUR';

  const [refreshing, setRefreshing] = useState(false);
  const [viaje, setViaje] = useState<any>(null);
  const [convertedSuggestions, setConvertedSuggestions] = useState<SettlementSuggestion[]>([]);
  const [convertedSettlements, setConvertedSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetchSettlements(tripId);
    loadViaje();
  }, [tripId]);

  const loadViaje = async () => {
    try {
      const viajeData = await getViajeById(viajeId);
      setViaje(viajeData);
    } catch (error) {
      console.error('Error cargando viaje:', error);
    }
  };

  // Convertir sugerencias de liquidación
  useEffect(() => {
    const convertSuggestions = async () => {
      if (!viaje || settlementSuggestions.length === 0) return;

      const tripCurrency = viaje.moneda || 'EUR';

      if (tripCurrency === userCurrency) {
        setConvertedSuggestions(settlementSuggestions);
        return;
      }

      const converted = await Promise.all(
        settlementSuggestions.map(async (suggestion) => {
          const amountInUnits = suggestion.amount / 100;
          const convertedAmount = await convert(amountInUnits, tripCurrency, userCurrency);

          return {
            ...suggestion,
            amount: convertedAmount ? convertedAmount.converted * 100 : suggestion.amount,
          };
        })
      );

      setConvertedSuggestions(converted);
    };

    convertSuggestions();
  }, [viaje, settlementSuggestions, userCurrency, convert]);

  // Convertir settlements
  useEffect(() => {
    const convertSettlementsData = async () => {
      if (!viaje || settlements.length === 0) return;

      const tripCurrency = viaje.moneda || 'EUR';

      if (tripCurrency === userCurrency) {
        setConvertedSettlements(settlements);
        return;
      }

      const converted = await Promise.all(
        settlements.map(async (settlement) => {
          const amountInUnits = settlement.amount / 100;
          const convertedAmount = await convert(amountInUnits, tripCurrency, userCurrency);

          return {
            ...settlement,
            amount: convertedAmount ? convertedAmount.converted * 100 : settlement.amount,
          };
        })
      );

      setConvertedSettlements(converted);
    };

    convertSettlementsData();
  }, [viaje, settlements, userCurrency, convert]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSettlements(tripId);
    await loadViaje();
    setRefreshing(false);
  };

  const handleSettlePress = (suggestion: SettlementSuggestion) => {
    navigation.navigate('RecordSettlement', {
      viajeId: route.params.viajeId,
      firestoreId,
      fromUid: suggestion.fromUid,
      toUid: suggestion.toUid,
      amount: suggestion.amount,
    });
  };

  const handleMarkComplete = (settlement: Settlement) => {
    Alert.alert(
      'Completar pago',
      '¿Confirmas que este pago se ha realizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const success = await markSettlementComplete(tripId, settlement.id, members);
            if (success) {
              showToast.success('Pago completado', 'Los balances se han actualizado');
            }
          },
        },
      ]
    );
  };

  const pendingSettlements = convertedSettlements.filter(s => s.status === 'pending');
  const completedSettlements = convertedSettlements.filter(s => s.status === 'completed');

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader title="Liquidaciones" onBack={() => navigation.goBack()} />

      <FlatList
        data={[]}
        keyExtractor={() => 'content'}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Sugerencias de liquidación */}
            <View style={styles.section}>
              <SettlementSuggestions
                suggestions={convertedSuggestions}
                currency={userCurrency}
                currentUserId={user?.uid}
                onSettlePress={handleSettlePress}
              />
            </View>

            {/* Pagos pendientes */}
            {pendingSettlements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pagos pendientes</Text>
                <SettlementsList
                  settlements={pendingSettlements}
                  currency={userCurrency}
                  currentUserId={user?.uid}
                  onMarkComplete={handleMarkComplete}
                />
              </View>
            )}

            {/* Historial de pagos completados */}
            {completedSettlements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historial de pagos</Text>
                <SettlementsList
                  settlements={completedSettlements}
                  currency={userCurrency}
                  currentUserId={user?.uid}
                />
              </View>
            )}
          </View>
        }
        renderItem={() => null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
});
