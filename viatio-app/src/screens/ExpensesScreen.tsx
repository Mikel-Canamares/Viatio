/**
 * EXPENSES SCREEN
 *
 * Pantalla de gestión de gastos de un viaje.
 * Muestra resumen total, distribución por categoría e historial agrupado.
 *
 * NOTA: Soporta tanto viajes individuales (SQLite) como compartidos (Firestore).
 * Detecta automáticamente el modo según viaje.isShared.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useCurrencyStore } from '@/store/currencyStore';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Gasto, CategoriaGasto, GASTO_CATEGORIAS } from '@/types/gasto';
import { Reserva } from '@/types/reserva';
import { Viaje } from '@/types/viaje';
import { centsToDisplay, SharedExpense } from '@/types/shared';
import { getReservasByViajeId } from '@/services/reservasService';
import { getViajeById } from '@/services/viajesService';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [expandedCategories, setExpandedCategories] = useState<Record<CategoriaGasto, boolean>>({} as Record<CategoriaGasto, boolean>);
  const [balancesExpanded, setBalancesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'gastos' | 'saldos'>('gastos');

  // Stores para gastos individuales (SQLite)
  const { gastos, resumen, loading: loadingGastos, fetchGastos, fetchResumen } = useGastosStore();

  // Currency store para conversiones
  const { loadRates, convert } = useCurrencyStore();

  // Configuración del usuario (moneda del perfil)
  const { config } = useConfiguracionStore();
  const userCurrency = config.monedaDefault || 'EUR';

  // Estados para conversiones de moneda
  const [convertedMyExpenses, setConvertedMyExpenses] = useState<number | null>(null);
  const [convertedSharedTotal, setConvertedSharedTotal] = useState<number | null>(null);
  const [convertedCategoryTotals, setConvertedCategoryTotals] = useState<Record<string, number | null>>({});
  const [expenseAmountConversions, setExpenseAmountConversions] = useState<Record<string, number | null>>({});
  const [convertedBalances, setConvertedBalances] = useState<any[]>([]);

  // Stores para gastos compartidos (Firestore)
  const {
    expenses: sharedExpenses,
    balances,
    settlementSuggestions,
    settlements,
    subscribeExpenses,
    subscribeSettlementsRealtime,
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

      // Cargar tasas de cambio para la divisa del perfil del usuario (para conversiones)
      if (userCurrency) {
        loadRates(userCurrency);
      }
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

  // Suscribirse a gastos y settlements cuando hay miembros cargados
  useEffect(() => {
    if (!viaje) return;

    if (isShared && firestoreId && members.length > 0) {
      // Suscribirse a Firestore con los miembros
      const tripCurrency = viaje.moneda || 'EUR';
      subscribeExpenses(firestoreId, members, tripCurrency);
      subscribeSettlementsRealtime(firestoreId, members, tripCurrency);
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

  // Para viajes compartidos - calcular total y mis gastos
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // "Mis Gastos" representa el dinero REAL que salió de mi bolsillo
  // = Lo que pagué - lo que me han devuelto (settlements completados recibidos) + lo que he pagado a otros (settlements completados pagados)
  // Esto se calcula como: totalPaid - (settlements recibidos) + (settlements pagados)
  // O más simple: totalPaid - (settlements recibidos - settlements pagados)
  // Que es equivalente a: totalPaid - (lo que me deben - lo que debo)
  // Y dado que netBalance = totalPaid - totalOwed, podemos calcular:
  // myExpenses = totalPaid - (totalPaid - totalOwed - netBalanceAdjustedBySettlements)
  const myBalance = balances.find(b => b.uid === user?.uid);

  // Calcular cuánto he recibido/pagado en settlements completados
  const completedSettlementsImpact = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => {
      if (s.toUid === user?.uid) {
        // He recibido dinero, reduce mi gasto real
        return sum - s.amount;
      } else if (s.fromUid === user?.uid) {
        // He pagado dinero, aumenta mi gasto real
        return sum + s.amount;
      }
      return sum;
    }, 0);

  const myExpenses = myBalance ? myBalance.totalPaid + completedSettlementsImpact : 0;
  const currency = viaje?.moneda || 'EUR';

  // Mapeo de categorías inglés a español para gastos compartidos
  const categoryToSpanish: Record<string, CategoriaGasto> = useMemo(() => ({
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
  }), []);

  // Agrupar gastos compartidos por categoría (memoizado)
  const sharedExpensesPorCategoria = useMemo(() => {
    return sharedExpenses.reduce((acc, expense) => {
      const spanishCat = categoryToSpanish[expense.category] || 'otros';
      if (!acc[spanishCat]) {
        acc[spanishCat] = [];
      }
      acc[spanishCat].push(expense);
      return acc;
    }, {} as Record<CategoriaGasto, SharedExpense[]>);
  }, [sharedExpenses, categoryToSpanish]);

  const sharedCategoriasOrdenadas = useMemo(() => {
    return Object.keys(sharedExpensesPorCategoria)
      .map((cat) => cat as CategoriaGasto)
      .sort((a, b) => {
        const totalA = sharedExpensesPorCategoria[a].reduce((sum, e) => sum + e.amount, 0);
        const totalB = sharedExpensesPorCategoria[b].reduce((sum, e) => sum + e.amount, 0);
        return totalB - totalA;
      });
  }, [sharedExpensesPorCategoria]);

  // ============================================
  // CONVERSIONES DE MONEDA
  // ============================================

  // Memoizar la función de conversión para evitar re-renders
  const performConvert = useCallback(
    (amount: number, from: string, to: string) => convert(amount, from, to),
    [] // convert es una función del store, no cambia
  );

  // Efecto unificado para todas las conversiones de moneda
  useEffect(() => {
    // Solo ejecutar si es viaje compartido
    if (!isShared || !viaje) return;

    const tripCurrency = viaje.moneda || 'EUR';
    let isCancelled = false;

    const performAllConversions = async () => {
      // Si la moneda del viaje es la misma que la del perfil, usar valores originales
      if (tripCurrency === userCurrency) {
        if (!isCancelled) {
          setConvertedMyExpenses(myExpenses);
          setConvertedSharedTotal(sharedTotal);

          // Totales por categoría
          const categoryConversions: Record<string, number | null> = {};
          for (const categoria of sharedCategoriasOrdenadas) {
            const totalCategoria = sharedExpensesPorCategoria[categoria].reduce((sum, e) => sum + e.amount, 0);
            categoryConversions[categoria] = totalCategoria;
          }
          setConvertedCategoryTotals(categoryConversions);

          // Limpiar conversiones individuales
          setExpenseAmountConversions({});

          // Balances sin conversión
          setConvertedBalances(balances);
        }
        return;
      }

      // Realizar todas las conversiones
      try {
        // 1. Convertir "Mis Gastos" y "Gastos Totales"
        const myExpensesInUnits = myExpenses / 100;
        const sharedTotalInUnits = sharedTotal / 100;

        const [convertedMy, convertedTotal] = await Promise.all([
          performConvert(myExpensesInUnits, tripCurrency, userCurrency),
          performConvert(sharedTotalInUnits, tripCurrency, userCurrency),
        ]);

        if (!isCancelled) {
          setConvertedMyExpenses(convertedMy ? convertedMy.converted * 100 : myExpenses);
          setConvertedSharedTotal(convertedTotal ? convertedTotal.converted * 100 : sharedTotal);
        }

        // 2. Convertir totales por categoría
        const categoryConversions: Record<string, number | null> = {};
        for (const categoria of sharedCategoriasOrdenadas) {
          const totalCategoria = sharedExpensesPorCategoria[categoria].reduce((sum, e) => sum + e.amount, 0);
          const totalInUnits = totalCategoria / 100;
          const converted = await performConvert(totalInUnits, tripCurrency, userCurrency);
          categoryConversions[categoria] = converted ? converted.converted * 100 : totalCategoria;
        }

        if (!isCancelled) {
          setConvertedCategoryTotals(categoryConversions);
        }

        // 3. Convertir montos individuales de gastos
        const expenseConversions: Record<string, number | null> = {};
        for (const expense of sharedExpenses) {
          // Usar monto y moneda originales si existen
          const displayAmount = expense.originalAmount ?? expense.amount;
          const displayCurrency = expense.originalCurrency ?? expense.currency;
          const amountInUnits = displayAmount / 100;
          const converted = await performConvert(amountInUnits, displayCurrency, userCurrency);
          expenseConversions[expense.id] = converted?.converted || null;
        }

        if (!isCancelled) {
          setExpenseAmountConversions(expenseConversions);
        }

        // 4. Convertir balances
        if (balances.length > 0) {
          const convertedBalancesData = await Promise.all(
            balances.map(async (balance) => {
              const totalPaidInUnits = balance.totalPaid / 100;
              const totalOwedInUnits = balance.totalOwed / 100;
              const netBalanceInUnits = balance.netBalance / 100;

              const [convertedPaid, convertedOwed, convertedNet] = await Promise.all([
                performConvert(totalPaidInUnits, tripCurrency, userCurrency),
                performConvert(totalOwedInUnits, tripCurrency, userCurrency),
                performConvert(netBalanceInUnits, tripCurrency, userCurrency),
              ]);

              return {
                ...balance,
                totalPaid: convertedPaid ? convertedPaid.converted * 100 : balance.totalPaid,
                totalOwed: convertedOwed ? convertedOwed.converted * 100 : balance.totalOwed,
                netBalance: convertedNet ? convertedNet.converted * 100 : balance.netBalance,
              };
            })
          );

          if (!isCancelled) {
            setConvertedBalances(convertedBalancesData);
          }
        }
      } catch (error) {
        console.error('Error en conversiones de moneda:', error);
      }
    };

    performAllConversions();

    // Cleanup function para cancelar actualizaciones si el componente se desmonta
    return () => {
      isCancelled = true;
    };
    // Solo disparar cuando cambien valores relevantes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isShared,
    viaje?.moneda,
    userCurrency,
    myExpenses,
    sharedTotal,
    sharedExpenses.length, // Usar length en vez de todo el array
    balances.length,
    sharedCategoriasOrdenadas.length,
  ]);

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

  const handleSettlePress = () => {
    // Por ahora, redirigir a la pantalla de liquidaciones
    handleViewSettlements();
  };

  const toggleCategory = (categoria: CategoriaGasto) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories(prev => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const toggleBalances = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBalancesExpanded(prev => !prev);
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loadingViaje) {
    return (
      <View style={styles.container}>
        <PageHeader title="Gastos" onBack={handleBack} />
        <ScreenContainer>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubtitle}>Cargando...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  const isEmpty = isShared ? sharedExpenses.length === 0 : gastos.length === 0;
  const isLoading = isShared ? false : loadingGastos;

  if (!isLoading && isEmpty) {
    return (
      <View style={styles.container}>
        <PageHeader title="Gastos" onBack={handleBack} />
        <ScreenContainer>
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
      </View>
    );
  }

  // ============================================
  // RENDER - VIAJE COMPARTIDO
  // ============================================

  if (isShared && firestoreId) {
    return (
      <View style={styles.container}>
        <PageHeader title="Gastos compartidos" onBack={handleBack} />
        <ScreenContainer>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Resumen con Mis Gastos y Gastos Totales */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryColumn}>
                <View style={[styles.summaryIconContainer, styles.myExpensesIconContainer]}>
                  <Ionicons name="wallet" size={26} color="#4a87c8" />
                </View>
                <Text style={styles.summaryLabel}>Mis Gastos</Text>
                <Text style={styles.summaryAmount}>
                  {centsToDisplay(convertedMyExpenses !== null ? convertedMyExpenses : myExpenses, userCurrency)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryColumn}>
                <View style={[styles.summaryIconContainer, styles.totalExpensesIconContainer]}>
                  <Ionicons name="receipt" size={26} color="#4a87c8" />
                </View>
                <Text style={styles.summaryLabel}>Gastos Totales</Text>
                <Text style={styles.summaryAmount}>
                  {centsToDisplay(convertedSharedTotal !== null ? convertedSharedTotal : sharedTotal, userCurrency)}
                </Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'gastos' && styles.tabActive]}
              onPress={() => setActiveTab('gastos')}
            >
              <Text style={[styles.tabText, activeTab === 'gastos' && styles.tabTextActive]}>
                Gastos
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'saldos' && styles.tabActive]}
              onPress={() => setActiveTab('saldos')}
            >
              <Text style={[styles.tabText, activeTab === 'saldos' && styles.tabTextActive]}>
                Saldos
              </Text>
            </Pressable>
          </View>

          {/* Tab Content: Gastos */}
          {activeTab === 'gastos' && (
            <>
              <View style={styles.historialHeader}>
                <Text style={styles.historialTitle}>Historial</Text>
                <View style={styles.historialBadge}>
                  <Text style={styles.historialBadgeText}>
                    {sharedExpenses.length}
                  </Text>
                </View>
              </View>

              {sharedCategoriasOrdenadas.map((categoria) => {
            const gastosDeCategoria = sharedExpensesPorCategoria[categoria];
            const totalCategoriaConverted = convertedCategoryTotals[categoria] !== undefined
              ? convertedCategoryTotals[categoria]!
              : gastosDeCategoria.reduce((sum, e) => sum + e.amount, 0);
            const categoriaInfo = GASTO_CATEGORIAS[categoria];
            const isExpanded = expandedCategories[categoria];

            return (
              <View key={categoria} style={styles.categoryGroup}>
                {/* Header de categoría */}
                <Pressable
                  style={({ pressed }) => [
                    styles.categoryHeader,
                    pressed && styles.categoryHeaderPressed,
                  ]}
                  onPress={() => toggleCategory(categoria)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: categoriaInfo.color + '15' }]}>
                    <Ionicons
                      name={categoriaInfo.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={categoriaInfo.color}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryNameRow}>
                      <Text style={styles.categoryName}>{categoriaInfo.label}</Text>
                      <View style={[styles.categoryCountBadge, { backgroundColor: categoriaInfo.color + '20' }]}>
                        <Text style={[styles.categoryCountBadgeText, { color: categoriaInfo.color }]}>
                          {gastosDeCategoria.length}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryTotal}>
                      {centsToDisplay(totalCategoriaConverted, userCurrency)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.textSecondary}
                    style={styles.categoryChevron}
                  />
                </Pressable>

                {/* Lista de gastos de esta categoría - Solo visible cuando está expandido */}
                {isExpanded && gastosDeCategoria.map((expense) => {
                  const isPayer = expense.paidByUid === user?.uid;
                  // Usar monto y moneda originales si existen, sino usar los normalizados
                  const displayAmount = expense.originalAmount ?? expense.amount;
                  const displayCurrency = expense.originalCurrency ?? expense.currency;

                  return (
                    <Pressable
                      key={expense.id}
                      style={({ pressed }) => [
                        styles.expenseItem,
                        pressed && styles.expenseItemPressed,
                      ]}
                      onPress={() => handleExpensePress(expense)}
                    >
                      <View style={styles.expenseLeftContent}>
                        <View style={[styles.expenseDot, { backgroundColor: categoriaInfo.color }]} />
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                          <Text style={styles.expensePaidBy}>
                            {isPayer ? 'Pagaste tú' : `Pagó ${expense.paidByName}`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expenseAmounts}>
                        <Text style={styles.expenseAmount}>
                          {centsToDisplay(displayAmount, displayCurrency)}
                        </Text>
                        {displayCurrency !== userCurrency && expenseAmountConversions[expense.id] !== undefined && expenseAmountConversions[expense.id] !== null && (
                          <Text style={styles.expenseConversion}>
                            ≈ {formatCurrency(expenseAmountConversions[expense.id]!, userCurrency, { decimals: 2 })}
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
            </>
          )}

          {/* Tab Content: Saldos */}
          {activeTab === 'saldos' && (
            <>
              {/* Balances */}
              {convertedBalances.length > 0 && (
                <View style={styles.balancesSection}>
                  <View style={styles.balancesHeader}>
                    <View style={styles.balancesHeaderContent}>
                      <Ionicons
                        name="stats-chart"
                        size={18}
                        color={theme.colors.primary}
                        style={styles.balancesIcon}
                      />
                      <Text style={styles.sectionTitle}>Balances</Text>
                    </View>
                  </View>
                  <View style={styles.balancesContent}>
                    <BalancesList
                      balances={convertedBalances}
                      currency={userCurrency}
                    />
                  </View>
                </View>
              )}

              {/* Botón para ver todas las liquidaciones */}
              <Pressable
                style={({ pressed }) => [
                  styles.settlementsLink,
                  pressed && styles.settlementsLinkPressed,
                ]}
                onPress={handleViewSettlements}
              >
                <Ionicons name="wallet-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.settlementsLinkText}>Ver liquidaciones</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </Pressable>
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <PrimaryButton onPress={handleAddExpense}>
            Añadir gasto
          </PrimaryButton>
        </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER - VIAJE INDIVIDUAL
  // ============================================

  return (
    <View style={styles.container}>
      <PageHeader title="Gastos" onBack={handleBack} />
      <ScreenContainer>

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
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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

  // Resumen unificado
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  myExpensesIconContainer: {
    backgroundColor: '#3B82F615',
  },
  totalExpensesIconContainer: {
    backgroundColor: '#8B5CF615',
  },
  summaryDivider: {
    width: 1,
    height: 80,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Estilos antiguos (mantener para viajes individuales)
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
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

  // Balances y Settlements sections
  balancesSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  settlementsSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  balancesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settlementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  balancesHeaderPressed: {
    backgroundColor: theme.colors.secondary + '80',
  },
  balancesHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  balancesIcon: {
    marginRight: theme.spacing.xs,
  },
  balancesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  settlementsContent: {
    padding: theme.spacing.lg,
  },

  // Historial
  historialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historialBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    padding: theme.spacing.lg,
  },
  categoryHeaderPressed: {
    backgroundColor: theme.colors.secondary + '80',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  categoryChevron: {
    marginLeft: theme.spacing.md,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  expenseItemPressed: {
    backgroundColor: theme.colors.secondary + '60',
  },
  expenseLeftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 3,
  },
  expensePaidBy: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  expenseAmounts: {
    alignItems: 'flex-end',
    marginRight: theme.spacing.sm,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  expenseConversion: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Link a liquidaciones
  settlementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.xs,
    ...theme.shadows.card,
  },
  settlementsLinkPressed: {
    backgroundColor: theme.colors.secondary,
  },
  settlementsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
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
