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
import { useAuth } from '@/context/AuthContext';
import { SharedExpense, centsToDisplay, SettlementSuggestion, hasPermission } from '@/types/shared';
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

  const canCreateExpense = hasPermission(currentTrip?.currentUserRole, 'canCreateExpense');

  useEffect(() => {
    if (members.length > 0) {
      subscribeExpenses(tripId, members);
    }

    return () => {
      unsubscribeExpenses();
    };
  }, [tripId, members]);

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
          {centsToDisplay(summary?.totalAmount || 0, currentTrip?.currency)}
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
              balances={balances}
              currency={currentTrip?.currency}
              currentUserId={user?.uid}
            />

            <View style={styles.settlementSection}>
              <SettlementSuggestions
                suggestions={settlementSuggestions}
                currency={currentTrip?.currency}
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
