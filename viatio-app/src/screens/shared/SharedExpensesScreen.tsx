import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, FloatingActionButton } from '@/components';
import { ExpenseCard, BalancesList, SettlementSuggestions } from '@/components/shared';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useAuth } from '@/context/AuthContext';
import { SharedExpense, centsToDisplay, SettlementSuggestion, MemberBalance, hasPermission } from '@/types/shared';
import { theme } from '@/theme';

type RouteParams = {
  SharedExpenses: { tripId: string };
};

type TabType = 'expenses' | 'balances';

export default function SharedExpensesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'SharedExpenses'>>();
  const { tripId } = route.params;
  const { user } = useAuth();

  const { currentTrip, members } = useSharedTripsStore();
  const {
    expenses,
    balances,
    settlementSuggestions,
    summary,
    loading,
    fetchExpenses,
    subscribeExpenses,
    unsubscribeExpenses,
  } = useExpensesV2Store();

  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [refreshing, setRefreshing] = useState(false);
  const [convertedSuggestions, setConvertedSuggestions] = useState<SettlementSuggestion[]>([]);
  const [convertedBalances, setConvertedBalances] = useState<MemberBalance[]>([]);
  const [convertedTotalAmount, setConvertedTotalAmount] = useState(0);

  const { config } = useConfiguracionStore();
  const { convert } = useCurrencyStore();
  const userCurrency = config.monedaDefault || 'EUR';

  const canCreateExpense = hasPermission(currentTrip?.currentUserRole, 'canCreateExpense');

  useEffect(() => {
    if (members.length > 0) {
      subscribeExpenses(tripId, members, currentTrip?.currency);
    }

    return () => {
      unsubscribeExpenses();
    };
  }, [tripId, members, currentTrip?.currency]);

  // Convertir sugerencias de liquidación de moneda del viaje a moneda del perfil
  useEffect(() => {
    const convertSuggestions = async () => {
      if (!currentTrip || settlementSuggestions.length === 0) {
        setConvertedSuggestions([]);
        return;
      }

      const tripCurrency = currentTrip.currency || 'EUR';

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
            amount: convertedAmount ? Math.round(convertedAmount.converted * 100) : suggestion.amount,
          };
        })
      );

      setConvertedSuggestions(converted);
    };

    convertSuggestions();
  }, [settlementSuggestions, currentTrip, userCurrency]);

  // Convertir balances de moneda del viaje a moneda del perfil
  useEffect(() => {
    const convertBalancesData = async () => {
      if (!currentTrip || balances.length === 0) {
        setConvertedBalances([]);
        return;
      }

      const tripCurrency = currentTrip.currency || 'EUR';

      if (tripCurrency === userCurrency) {
        setConvertedBalances(balances);
        return;
      }

      const converted = await Promise.all(
        balances.map(async (balance) => {
          const totalPaidInUnits = balance.totalPaid / 100;
          const totalOwedInUnits = balance.totalOwed / 100;
          const netBalanceInUnits = balance.netBalance / 100;

          const convertedPaid = await convert(totalPaidInUnits, tripCurrency, userCurrency);
          const convertedOwed = await convert(totalOwedInUnits, tripCurrency, userCurrency);
          const convertedNet = await convert(netBalanceInUnits, tripCurrency, userCurrency);

          return {
            ...balance,
            totalPaid: convertedPaid ? Math.round(convertedPaid.converted * 100) : balance.totalPaid,
            totalOwed: convertedOwed ? Math.round(convertedOwed.converted * 100) : balance.totalOwed,
            netBalance: convertedNet ? Math.round(convertedNet.converted * 100) : balance.netBalance,
          };
        })
      );

      setConvertedBalances(converted);
    };

    convertBalancesData();
  }, [balances, currentTrip, userCurrency]);

  // Convertir total amount del resumen
  useEffect(() => {
    const convertTotalAmount = async () => {
      if (!currentTrip || !summary) {
        setConvertedTotalAmount(0);
        return;
      }

      const tripCurrency = currentTrip.currency || 'EUR';

      if (tripCurrency === userCurrency) {
        setConvertedTotalAmount(summary.totalAmount);
        return;
      }

      const totalInUnits = summary.totalAmount / 100;
      const converted = await convert(totalInUnits, tripCurrency, userCurrency);

      setConvertedTotalAmount(converted ? Math.round(converted.converted * 100) : summary.totalAmount);
    };

    convertTotalAmount();
  }, [summary, currentTrip, userCurrency]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses(tripId, members);
    setRefreshing(false);
  };

  const handleExpensePress = (expense: SharedExpense) => {
    navigation.navigate('ExpenseDetail', { tripId, expenseId: expense.id });
  };

  const handleAddExpense = () => {
    navigation.navigate('AddSharedExpense', { tripId });
  };

  const handleSettlePress = (suggestion: SettlementSuggestion) => {
    navigation.navigate('RecordSettlement', {
      tripId,
      fromUid: suggestion.fromUid,
      toUid: suggestion.toUid,
      amount: suggestion.amount,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Resumen total */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Gasto total del viaje</Text>
        <Text style={styles.summaryAmount}>
          {centsToDisplay(convertedTotalAmount, userCurrency)}
        </Text>
        <Text style={styles.summarySubtext}>
          {summary?.expenseCount || 0} gastos · {members.length} personas
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={activeTab === 'expenses' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
            Gastos
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'balances' && styles.tabActive]}
          onPress={() => setActiveTab('balances')}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={20}
            color={activeTab === 'balances' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'balances' && styles.tabTextActive]}>
            Balances
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderExpensesList = () => (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ExpenseCard
          expense={item}
          currentUserId={user?.uid}
          userCurrency={userCurrency}
          onPress={() => handleExpensePress(item)}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sin gastos</Text>
          <Text style={styles.emptyText}>
            Añade el primer gasto del viaje
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );

  const renderBalancesTab = () => (
    <FlatList
      data={[]}
      keyExtractor={() => 'balances'}
      ListHeaderComponent={
        <>
          {renderHeader()}

          <View style={styles.balancesContent}>
            <Text style={styles.sectionTitle}>Balances por persona</Text>
            <BalancesList
              balances={convertedBalances}
              currency={userCurrency}
              currentUserId={user?.uid}
            />

            <View style={styles.settlementSection}>
              <SettlementSuggestions
                suggestions={convertedSuggestions}
                currency={userCurrency}
                currentUserId={user?.uid}
                onSettlePress={handleSettlePress}
              />
            </View>
          </View>
        </>
      }
      renderItem={() => null}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader
        title="Gastos"
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable onPress={() => navigation.navigate('TripMembers', { tripId })}>
            <Ionicons name="people" size={24} color="#FFFFFF" />
          </Pressable>
        }
      />

      {activeTab === 'expenses' ? renderExpensesList() : renderBalancesTab()}

      {canCreateExpense && (
        <FloatingActionButton icon="add" onPress={handleAddExpense} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  summarySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  balancesContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  settlementSection: {
    marginTop: 24,
  },
});
