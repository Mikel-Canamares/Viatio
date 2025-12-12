/**
 * EXPENSES SUMMARY COMPONENT
 *
 * Componente para mostrar resumen visual de gastos con:
 * - Total gastado
 * - Barra de progreso del presupuesto (si existe)
 * - Distribución por categorías con barras proporcionales
 *
 * Variantes:
 * - Normal: Vista completa con todas las categorías
 * - Compact: Vista reducida con total + top 3 categorías
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResumenGastos, CategoriaGasto, GASTO_CATEGORIAS } from '@/types/gasto';
import { theme } from '@/config';

// ============================================
// TIPOS
// ============================================

interface ExpensesSummaryProps {
  resumen: ResumenGastos;
  compact?: boolean;
}

interface BudgetProgressBarProps {
  total: number;
  presupuesto: number;
  moneda: string;
  compact?: boolean;
}

interface CategoryBarProps {
  categoria: CategoriaGasto;
  monto: number;
  porcentaje: number;
  moneda: string;
  compact?: boolean;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula el color de la barra de progreso según el porcentaje gastado
 */
const getBudgetColor = (porcentaje: number): string => {
  if (porcentaje < 75) return '#16A34A'; // Verde
  if (porcentaje <= 90) return '#F59E0B'; // Amarillo
  return '#DC2626'; // Rojo
};

/**
 * Formatea un número como moneda
 */
const formatCurrency = (monto: number, moneda: string): string => {
  return `${monto.toFixed(2)} ${moneda}`;
};

/**
 * Ordena y filtra categorías por monto (mayor a menor)
 */
const getTopCategorias = (
  porCategoria: Record<CategoriaGasto, number>,
  limit?: number
): Array<{ categoria: CategoriaGasto; monto: number }> => {
  const categorias = Object.entries(porCategoria)
    .filter(([_, monto]) => monto > 0)
    .map(([cat, monto]) => ({
      categoria: cat as CategoriaGasto,
      monto,
    }))
    .sort((a, b) => b.monto - a.monto);

  return limit ? categorias.slice(0, limit) : categorias;
};

// ============================================
// SUB-COMPONENTES
// ============================================

/**
 * Barra de progreso del presupuesto
 */
function BudgetProgressBar({ total, presupuesto, moneda, compact }: BudgetProgressBarProps) {
  const porcentaje = Math.min((total / presupuesto) * 100, 100);
  const color = getBudgetColor(porcentaje);
  const restante = Math.max(presupuesto - total, 0);

  return (
    <View style={styles.budgetSection}>
      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${porcentaje}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Labels */}
      {!compact && (
        <View style={styles.budgetLabels}>
          <View style={styles.budgetLabelItem}>
            <Text style={styles.budgetLabelText}>Presupuesto</Text>
            <Text style={styles.budgetLabelValue}>{formatCurrency(presupuesto, moneda)}</Text>
          </View>
          <View style={[styles.budgetLabelItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.budgetLabelText}>Restante</Text>
            <Text style={[styles.budgetLabelValue, { color }]}>
              {formatCurrency(restante, moneda)}
            </Text>
          </View>
        </View>
      )}

      {compact && (
        <View style={styles.compactBudgetRow}>
          <Text style={styles.compactBudgetText}>
            Restante: <Text style={{ color }}>{formatCurrency(restante, moneda)}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Barra de categoría individual
 */
function CategoryBar({ categoria, monto, porcentaje, moneda, compact }: CategoryBarProps) {
  const categoriaInfo = GASTO_CATEGORIAS[categoria];

  if (compact) {
    return (
      <View style={styles.compactCategoryItem}>
        <View style={styles.compactCategoryHeader}>
          <View style={styles.categoryIconLabel}>
            <Ionicons name={categoriaInfo.icon as any} size={14} color={categoriaInfo.color} />
            <Text style={styles.compactCategoryName}>{categoriaInfo.label}</Text>
          </View>
          <Text style={styles.compactCategoryAmount}>{formatCurrency(monto, moneda)}</Text>
        </View>
        {/* Mini barra */}
        <View style={styles.compactCategoryBar}>
          <View
            style={[
              styles.compactCategoryBarFill,
              {
                width: `${porcentaje}%`,
                backgroundColor: categoriaInfo.color,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIconLabel}>
          <Ionicons name={categoriaInfo.icon as any} size={20} color={categoriaInfo.color} />
          <Text style={styles.categoryName}>{categoriaInfo.label}</Text>
        </View>
        <Text style={styles.categoryAmount}>{formatCurrency(monto, moneda)}</Text>
      </View>

      {/* Barra proporcional */}
      <View style={styles.categoryBarContainer}>
        <View
          style={[
            styles.categoryBarFill,
            {
              width: `${porcentaje}%`,
              backgroundColor: categoriaInfo.color,
            },
          ]}
        />
      </View>

      {/* Porcentaje */}
      <Text style={styles.categoryPercentage}>{porcentaje.toFixed(1)}%</Text>
    </View>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ExpensesSummary({ resumen, compact = false }: ExpensesSummaryProps) {
  const { total, porCategoria, presupuesto, moneda } = resumen;

  // Obtener categorías ordenadas
  const topCategorias = getTopCategorias(porCategoria, compact ? 3 : undefined);

  // Calcular porcentajes
  const categoriasConPorcentaje = topCategorias.map(({ categoria, monto }) => ({
    categoria,
    monto,
    porcentaje: total > 0 ? (monto / total) * 100 : 0,
  }));

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Total */}
      <View style={styles.totalSection}>
        <Text style={[styles.totalLabel, compact && styles.totalLabelCompact]}>Total gastado</Text>
        <Text style={[styles.totalAmount, compact && styles.totalAmountCompact]}>
          {formatCurrency(total, moneda)}
        </Text>
      </View>

      {/* Barra de presupuesto (si existe) */}
      {presupuesto && presupuesto > 0 && (
        <BudgetProgressBar
          total={total}
          presupuesto={presupuesto}
          moneda={moneda}
          compact={compact}
        />
      )}

      {/* Categorías */}
      {categoriasConPorcentaje.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={[styles.categoriesTitle, compact && styles.categoriesTitleCompact]}>
            {compact ? 'Top categorías' : 'Distribución por categoría'}
          </Text>

          {categoriasConPorcentaje.map(({ categoria, monto, porcentaje }) => (
            <CategoryBar
              key={categoria}
              categoria={categoria}
              monto={monto}
              porcentaje={porcentaje}
              moneda={moneda}
              compact={compact}
            />
          ))}
        </View>
      )}

      {/* Mensaje si no hay gastos */}
      {total === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyStateText}>
            {compact ? 'Sin gastos' : 'Aún no hay gastos registrados'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  containerCompact: {
    padding: theme.spacing.md,
  },

  // Total
  totalSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  totalLabelCompact: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalAmountCompact: {
    fontSize: 24,
  },

  // Presupuesto
  budgetSection: {
    marginBottom: theme.spacing.lg,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabelItem: {
    flex: 1,
  },
  budgetLabelText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  budgetLabelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  compactBudgetRow: {
    alignItems: 'center',
  },
  compactBudgetText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Categorías
  categoriesSection: {
    gap: theme.spacing.md,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  categoriesTitleCompact: {
    fontSize: 12,
  },

  // Categoría normal
  categoryItem: {
    gap: theme.spacing.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.text,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryBarContainer: {
    height: 8,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  categoryPercentage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },

  // Categoría compact
  compactCategoryItem: {
    gap: 4,
  },
  compactCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactCategoryName: {
    fontSize: 12,
    color: theme.colors.text,
  },
  compactCategoryAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  compactCategoryBar: {
    height: 4,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  compactCategoryBarFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
