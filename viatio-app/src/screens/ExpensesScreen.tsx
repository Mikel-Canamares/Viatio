/**
 * EXPENSES SCREEN
 *
 * Pantalla de gestión de gastos de un viaje.
 * Muestra resumen total, distribución por categoría e historial agrupado.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ExpenseCategoryGroup } from '@/components/ExpenseCategoryGroup';
import { useGastosStore } from '@/store/gastosStore';
import { Gasto, GASTO_CATEGORIAS, CategoriaGasto } from '@/types/gasto';
import { Reserva } from '@/types/reserva';
import { getReservasByViajeId } from '@/services/reservasService';
import { theme } from '@/config';

// ============================================
// TIPOS
// ============================================

type RootStackParamList = {
  Expenses: { viajeId: string };
  AddExpense: { viajeId: string };
};

type ExpensesScreenRouteProp = RouteProp<RootStackParamList, 'Expenses'>;
type ExpensesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ExpensesScreen() {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const route = useRoute<ExpensesScreenRouteProp>();
  const { viajeId } = route.params;

  const { gastos, resumen, loading, fetchGastos, fetchResumen } = useGastosStore();
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Cargar datos al montar
  useEffect(() => {
    fetchGastos(viajeId);
    fetchResumen(viajeId);
    loadReservas();
  }, [viajeId]);

  const loadReservas = async () => {
    try {
      const reservasData = await getReservasByViajeId(viajeId);
      setReservas(reservasData);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  };

  // Calcular porcentaje de presupuesto usado
  const presupuestoPercentage = resumen?.presupuesto
    ? (resumen.total / resumen.presupuesto) * 100
    : 0;

  // Determinar color de la barra según el porcentaje
  const getProgressColor = () => {
    if (presupuestoPercentage < 75) return theme.colors.success;
    if (presupuestoPercentage < 90) return theme.colors.warning;
    return theme.colors.error;
  };

  // Agrupar gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    if (!acc[gasto.categoria]) {
      acc[gasto.categoria] = [];
    }
    acc[gasto.categoria].push(gasto);
    return acc;
  }, {} as Record<CategoriaGasto, Gasto[]>);

  // Ordenar categorías por monto total (mayor a menor)
  const categoriasOrdenadas = Object.keys(gastosPorCategoria)
    .map((cat) => cat as CategoriaGasto)
    .sort((a, b) => {
      const totalA = gastosPorCategoria[a].reduce((sum, g) => sum + g.monto, 0);
      const totalB = gastosPorCategoria[b].reduce((sum, g) => sum + g.monto, 0);
      return totalB - totalA;
    });

  // Handlers
  const handleBack = () => navigation.goBack();
  const handleAddExpense = () => navigation.navigate('AddExpense', { viajeId });

  // Empty state
  if (!loading && gastos.length === 0) {
    return (
      <ScreenContainer>
        <PageHeader title="Gastos" onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No hay gastos registrados</Text>
          <Text style={styles.emptySubtitle}>
            Comienza a registrar tus gastos de viaje
          </Text>
        </View>

        {/* Botón siempre en la parte inferior */}
        <View style={styles.bottomButtonContainer}>
          <PrimaryButton onPress={handleAddExpense}>
            Añadir gasto
          </PrimaryButton>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader title="Gastos" onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 100, // Espacio para el botón fijo
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

  // Historial
  historialHeader: {
    marginBottom: theme.spacing.md,
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
