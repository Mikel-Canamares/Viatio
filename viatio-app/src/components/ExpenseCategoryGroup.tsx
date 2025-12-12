/**
 * EXPENSE CATEGORY GROUP COMPONENT
 *
 * Componente desplegable que agrupa gastos de una misma categoría.
 * Muestra el resumen de la categoría y permite expandir para ver el detalle.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gasto, GASTO_CATEGORIAS, CategoriaGasto } from '@/types/gasto';
import { theme } from '@/config';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================
// TIPOS
// ============================================

interface ExpenseCategoryGroupProps {
  categoria: CategoriaGasto;
  gastos: Gasto[];
  moneda: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Formatea fecha para mostrar
 */
const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
};

/**
 * Calcula el total de una lista de gastos
 */
const calcularTotal = (gastos: Gasto[]): number => {
  return gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ExpenseCategoryGroup({ categoria, gastos, moneda }: ExpenseCategoryGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const categoriaInfo = GASTO_CATEGORIAS[categoria];
  const total = calcularTotal(gastos);
  const cantidadGastos = gastos.length;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      {/* Header - Siempre visible */}
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        onPress={toggleExpand}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoriaInfo.color}15` }]}>
            <Ionicons name={categoriaInfo.icon as any} size={20} color={categoriaInfo.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.categoriaLabel}>{categoriaInfo.label}</Text>
            <Text style={styles.cantidadText}>
              {cantidadGastos} {cantidadGastos === 1 ? 'gasto' : 'gastos'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.totalText}>
            {moneda} {total.toFixed(2)}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Lista de gastos - Solo visible cuando está expandido */}
      {expanded && (
        <View style={styles.gastosContainer}>
          {gastos.map((gasto, index) => {
            const esDeReserva = !!gasto.reservaId;
            const isLast = index === gastos.length - 1;

            return (
              <View
                key={gasto.id}
                style={[
                  styles.gastoItem,
                  !isLast && styles.gastoItemBorder,
                ]}
              >
                <View style={styles.gastoLeft}>
                  <View style={styles.gastoInfo}>
                    <View style={styles.descripcionRow}>
                      <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                      {esDeReserva && (
                        <View style={styles.reservaBadge}>
                          <Ionicons name="link-outline" size={10} color={theme.colors.primaryLight} />
                          <Text style={styles.reservaBadgeText}>Reserva</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.gastoFecha}>{formatFecha(gasto.fecha)}</Text>
                  </View>
                </View>
                <Text style={styles.gastoMonto}>
                  {gasto.moneda} {gasto.monto.toFixed(2)}
                </Text>
              </View>
            );
          })}
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
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  headerPressed: {
    backgroundColor: theme.colors.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  categoriaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cantidadText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Lista de gastos
  gastosContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  gastoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  gastoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  gastoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gastoInfo: {
    flex: 1,
  },
  descripcionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  gastoDescripcion: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  reservaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${theme.colors.primaryLight}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reservaBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.primaryLight,
    textTransform: 'uppercase',
  },
  gastoFecha: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  gastoMonto: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
});
