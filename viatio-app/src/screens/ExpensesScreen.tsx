/**
 * EXPENSES SCREEN
 *
 * Pantalla de gestión de gastos de un viaje.
 * Muestra resumen total, distribución por categoría e historial agrupado.
 *
 * NOTA: Soporta tanto viajes individuales (SQLite) como compartidos (Firestore).
 * Detecta automáticamente el modo según viaje.isShared.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Card } from '@/components/Card';
import { ExpenseCategoryGroup } from '@/components/ExpenseCategoryGroup';
import { BalancesList, SettlementSuggestions } from '@/components/shared';
import { useGastosStore } from '@/store/gastosStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useAuth } from '@/context/AuthContext';
import { Gasto, CategoriaGasto, GASTO_CATEGORIAS } from '@/types/gasto';
import { Reserva } from '@/types/reserva';
import { Viaje } from '@/types/viaje';
import { centsToDisplay, SharedExpense } from '@/types/shared';
import { getReservasByViajeId } from '@/services/reservasService';
import { getViajeById } from '@/services/viajesService';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';

// ============================================
// TIPOS
// ============================================

type ExpensesScreenRouteProp = RouteProp<HomeStackParamList, 'Expenses'>;
type ExpensesScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ExpensesScreen() {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const route = useRoute<ExpensesScreenRouteProp>();
  const { viajeId } = route.params;
  const { user } = useAuth();

  // Estado local
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingViaje, setLoadingViaje] = useState(true);

  // Stores para gastos individuales (SQLite)
  const { gastos, resumen, loading: loadingGastos, fetchGastos, fetchResumen } = useGastosStore();

  // Stores para gastos compartidos (Firestore)
  const {
    expenses: sharedExpenses,
    balances,
    settlementSuggestions,
    subscribeExpenses,
  } = useExpensesV2Store();
  const { members, fetchMembers } = useSharedTripsStore();

  // Determinar si es viaje compartido
  const isShared = viaje?.isShared === 1;
  const firestoreId = viaje?.firestoreId;

  // ============================================
  // CARGA DE DATOS
  // ============================================

  // Cargar viaje primero para saber si es compartido
  useEffect(() => {
    loadViaje();
  }, [viajeId]);

  const loadViaje = async () => {
    try {
      setLoadingViaje(true);
      const viajeData = await getViajeById(viajeId);
      setViaje(viajeData);
    } catch (error) {
      console.error('Error cargando viaje:', error);
    } finally {
      setLoadingViaje(false);
    }
  };

  // Cargar miembros cuando es viaje compartido
  useEffect(() => {
    if (isShared && firestoreId) {
      fetchMembers(firestoreId);
    }
  }, [isShared, firestoreId]);

  // Suscribirse a gastos cuando hay miembros cargados
  useEffect(() => {
    if (!viaje) return;

    if (isShared && firestoreId && members.length > 0) {
      // Suscribirse a Firestore con los miembros
      subscribeExpenses(firestoreId, members);
    } else if (!isShared) {
      // Cargar de SQLite
      fetchGastos(viajeId);
      fetchResumen(viajeId);
    }
  }, [viaje, firestoreId, isShared, members.length]);

  // Recargar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      if (viaje && !isShared) {
        fetchGastos(viajeId);
        fetchResumen(viajeId);
      }
      loadReservas();
    }, [viaje, isShared, viajeId])
  );

  const loadReservas = async () => {
    try {
      const reservasData = await getReservasByViajeId(viajeId);
      setReservas(reservasData);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadViaje();
    if (!isShared) {
      await Promise.all([fetchGastos(viajeId), fetchResumen(viajeId)]);
    }
    setRefreshing(false);
  };

  // ============================================
  // CÁLCULOS
  // ============================================

  // Para viajes individuales
  const presupuestoPercentage = resumen?.presupuesto
    ? (resumen.total / resumen.presupuesto) * 100
    : 0;

  const getProgressColor = () => {
    if (presupuestoPercentage < 75) return theme.colors.success;
    if (presupuestoPercentage < 90) return theme.colors.warning;
    return theme.colors.error;
  };

  // Agrupar gastos por categoría (viajes individuales)
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    if (!acc[gasto.categoria]) {
      acc[gasto.categoria] = [];
    }
    acc[gasto.categoria].push(gasto);
    return acc;
  }, {} as Record<CategoriaGasto, Gasto[]>);

  const categoriasOrdenadas = Object.keys(gastosPorCategoria)
    .map((cat) => cat as CategoriaGasto)
    .sort((a, b) => {
      const totalA = gastosPorCategoria[a].reduce((sum, g) => sum + g.monto, 0);
      const totalB = gastosPorCategoria[b].reduce((sum, g) => sum + g.monto, 0);
      return totalB - totalA;
    });

  // Para viajes compartidos - calcular total
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = viaje?.moneda || 'EUR';

  // Mapeo de categorías inglés a español para gastos compartidos
  const categoryToSpanish: Record<string, CategoriaGasto> = {
    transport: 'transporte',
    accommodation: 'alojamiento',
    food: 'comida',
    activity: 'actividades',
    shopping: 'compras',
    other: 'otros',
    transporte: 'transporte',
    alojamiento: 'alojamiento',
    comida: 'comida',
    actividades: 'actividades',
    compras: 'compras',
    otros: 'otros',
  };

  // Agrupar gastos compartidos por categoría
  const sharedExpensesPorCategoria = sharedExpenses.reduce((acc, expense) => {
    const spanishCat = categoryToSpanish[expense.category] || 'otros';
    if (!acc[spanishCat]) {
      acc[spanishCat] = [];
    }
    acc[spanishCat].push(expense);
    return acc;
  }, {} as Record<CategoriaGasto, SharedExpense[]>);

  const sharedCategoriasOrdenadas = Object.keys(sharedExpensesPorCategoria)
    .map((cat) => cat as CategoriaGasto)
    .sort((a, b) => {
      const totalA = sharedExpensesPorCategoria[a].reduce((sum, e) => sum + e.amount, 0);
      const totalB = sharedExpensesPorCategoria[b].reduce((sum, e) => sum + e.amount, 0);
      return totalB - totalA;
    });

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => navigation.goBack();

  const handleExpensePress = (expense: SharedExpense) => {
    if (firestoreId) {
      navigation.navigate('ExpenseDetail', { tripId: firestoreId, expenseId: expense.id });
    }
  };

  const handleAddExpense = () => {
    // Navegar a la pantalla correcta según si el viaje es compartido
    if (isShared && firestoreId) {
      navigation.navigate('AddSharedExpense', { tripId: firestoreId });
    } else {
      navigation.navigate('AddExpense', { viajeId });
    }
  };

  const handleViewSettlements = () => {
    if (firestoreId) {
      navigation.navigate('TripSettlements', { viajeId, firestoreId });
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loadingViaje) {
    return (
      <ScreenContainer>
        <PageHeader title="Gastos" onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySubtitle}>Cargando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  const isEmpty = isShared ? sharedExpenses.length === 0 : gastos.length === 0;
  const isLoading = isShared ? false : loadingGastos;

  if (!isLoading && isEmpty) {
    return (
      <ScreenContainer>
        <PageHeader title="Gastos" onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No hay gastos registrados</Text>
          <Text style={styles.emptySubtitle}>
            {isShared
              ? 'Comienza a registrar los gastos compartidos del viaje'
              : 'Comienza a registrar tus gastos de viaje'}
          </Text>
        </View>

        <View style={styles.bottomButtonContainer}>
          <PrimaryButton onPress={handleAddExpense}>
            Añadir gasto
          </PrimaryButton>
        </View>
      </ScreenContainer>
    );
  }

  // ============================================
  // RENDER - VIAJE COMPARTIDO
  // ============================================

  if (isShared && firestoreId) {
    return (
      <ScreenContainer>
        <PageHeader title="Gastos compartidos" onBack={handleBack} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Resumen Total */}
          <View style={styles.card}>
            <Text style={styles.totalLabel}>Total del grupo</Text>
            <Text style={styles.totalAmount}>
              {centsToDisplay(sharedTotal, currency)}
            </Text>
            <Text style={styles.memberCount}>
              {members.length} {members.length === 1 ? 'persona' : 'personas'}
            </Text>
          </View>

          {/* Balances */}
          {balances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Balances</Text>
              <BalancesList
                balances={balances}
                currency={currency}
              />
            </View>
          )}

          {/* Sugerencias de liquidación */}
          {settlementSuggestions.length > 0 && (
            <View style={styles.section}>
              <SettlementSuggestions
                suggestions={settlementSuggestions}
                currency={currency}
                onSettlePress={(suggestion) => {
                  navigation.navigate('RecordSettlement', {
                    viajeId,
                    firestoreId,
                    fromUid: suggestion.fromUid,
                    toUid: suggestion.toUid,
                    amount: suggestion.amount,
                  });
                }}
              />
            </View>
          )}

          {/* Botón para ver todas las liquidaciones */}
          <Pressable style={styles.settlementsLink} onPress={handleViewSettlements}>
            <Text style={styles.settlementsLinkText}>Ver liquidaciones</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </Pressable>

          {/* Historial de gastos agrupados por categoría */}
          <View style={styles.historialHeader}>
            <Text style={styles.historialTitle}>Historial</Text>
          </View>

          {sharedCategoriasOrdenadas.map((categoria) => {
            const gastosDeCategoria = sharedExpensesPorCategoria[categoria];
            const totalCategoria = gastosDeCategoria.reduce((sum, e) => sum + e.amount, 0);
            const categoriaInfo = GASTO_CATEGORIAS[categoria];

            return (
              <View key={categoria} style={styles.categoryGroup}>
                {/* Header de categoría */}
                <Pressable style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: categoriaInfo.color + '20' }]}>
                    <Ionicons
                      name={categoriaInfo.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={categoriaInfo.color}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{categoriaInfo.label}</Text>
                    <Text style={styles.categoryCount}>
                      {gastosDeCategoria.length} {gastosDeCategoria.length === 1 ? 'gasto' : 'gastos'}
                    </Text>
                  </View>
                  <Text style={styles.categoryTotal}>
                    {centsToDisplay(totalCategoria, currency)}
                  </Text>
                </Pressable>

                {/* Lista de gastos de esta categoría */}
                {gastosDeCategoria.map((expense) => {
                  const isPayer = expense.paidByUid === user?.uid;
                  const myShare = expense.shares.find(s => s.uid === user?.uid);
                  let myImpact = 0;
                  if (myShare) {
                    myImpact = isPayer
                      ? expense.amount - myShare.calculatedAmount
                      : -myShare.calculatedAmount;
                  }

                  return (
                    <Pressable
                      key={expense.id}
                      style={styles.expenseItem}
                      onPress={() => handleExpensePress(expense)}
                    >
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseDescription}>{expense.description}</Text>
                        <Text style={styles.expensePaidBy}>
                          {isPayer ? 'Pagaste tú' : `Pagó ${expense.paidByName}`}
                        </Text>
                      </View>
                      <View style={styles.expenseAmounts}>
                        <Text style={styles.expenseAmount}>
                          {centsToDisplay(expense.amount, expense.currency)}
                        </Text>
                        {myShare && myImpact !== 0 && (
                          <Text style={[
                            styles.expenseImpact,
                            myImpact > 0 ? styles.impactPositive : styles.impactNegative,
                          ]}>
                            {myImpact > 0 ? '+' : ''}{centsToDisplay(myImpact, expense.currency)}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>
            );
          })}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <PrimaryButton onPress={handleAddExpense}>
            Añadir gasto
          </PrimaryButton>
        </View>
      </ScreenContainer>
    );
  }

  // ============================================
  // RENDER - VIAJE INDIVIDUAL
  // ============================================

  return (
    <ScreenContainer>
      <PageHeader title="Gastos" onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Card 1 - Resumen Total */}
        <View style={styles.card}>
          <Text style={styles.totalLabel}>Total gastado</Text>
          <Text style={styles.totalAmount}>
            {resumen?.moneda || 'EUR'} {resumen?.total.toFixed(2) || '0.00'}
          </Text>

          {/* Barra de progreso del presupuesto */}
          {resumen?.presupuesto && (
            <View style={styles.presupuestoContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(presupuestoPercentage, 100)}%`,
                      backgroundColor: getProgressColor(),
                    },
                  ]}
                />
              </View>
              <Text style={styles.presupuestoText}>
                {resumen.moneda} {resumen.total.toFixed(2)} de{' '}
                {resumen.moneda} {resumen.presupuesto.toFixed(2)}
              </Text>
            </View>
          )}

          {!resumen?.presupuesto && (
            <Text style={styles.sinPresupuesto}>Sin presupuesto definido</Text>
          )}
        </View>

        {/* Sección de Historial con título */}
        <View style={styles.historialHeader}>
          <Text style={styles.historialTitle}>Historial</Text>
        </View>

        {/* Grupos de gastos por categoría */}
        {categoriasOrdenadas.map((categoria) => (
          <ExpenseCategoryGroup
            key={categoria}
            categoria={categoria}
            gastos={gastosPorCategoria[categoria]}
            reservas={reservas}
            moneda={resumen?.moneda || 'EUR'}
          />
        ))}

        {/* Espaciado para el botón fijo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botón fijo en la parte inferior */}
      <View style={styles.bottomButtonContainer}>
        <PrimaryButton onPress={handleAddExpense}>
          Añadir gasto
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },

  // Resumen total
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  presupuestoContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  presupuestoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sinPresupuesto: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  // Secciones
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Historial
  historialHeader: {
    marginBottom: theme.spacing.md,
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Gastos compartidos - Agrupación por categoría
  categoryGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  expenseInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  expensePaidBy: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  expenseAmounts: {
    alignItems: 'flex-end',
    marginRight: theme.spacing.xs,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  expenseImpact: {
    fontSize: 11,
    marginTop: 2,
  },
  impactPositive: {
    color: theme.colors.success,
  },
  impactNegative: {
    color: theme.colors.error,
  },

  // Link a liquidaciones
  settlementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  settlementsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 4,
  },

  // Espaciador para el botón
  bottomSpacer: {
    height: theme.spacing.lg,
  },

  // Botón fijo en la parte inferior
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary,
    ...theme.shadows.card,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
