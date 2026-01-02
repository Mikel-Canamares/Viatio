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
import { useAuth } from '@/context/AuthContext';
import { Settlement, SettlementSuggestion } from '@/types/shared';
import { theme } from '@/theme';
import { showToast } from '@/utils/toast';

type RouteParams = {
  TripSettlements: { tripId: string };
};

export default function TripSettlementsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'TripSettlements'>>();
  const { tripId } = route.params;
  const { user } = useAuth();

  const { currentTrip, members } = useSharedTripsStore();
  const {
    settlementSuggestions,
    settlements,
    fetchSettlements,
    markSettlementComplete,
  } = useExpensesV2Store();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSettlements(tripId);
  }, [tripId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSettlements(tripId);
    setRefreshing(false);
  };

  const handleSettlePress = (suggestion: SettlementSuggestion) => {
    navigation.navigate('RecordSettlement', {
      tripId,
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
            const success = await markSettlementComplete(tripId, settlement.id);
            if (success) {
              showToast.success('Pago completado');
            }
          },
        },
      ]
    );
  };

  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const completedSettlements = settlements.filter(s => s.status === 'completed');

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
                suggestions={settlementSuggestions}
                currency={currentTrip?.currency}
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
                  currency={currentTrip?.currency}
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
                  currency={currentTrip?.currency}
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
