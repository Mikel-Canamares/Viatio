/**
 * CATEGORY BADGE
 *
 * Badge para mostrar categorías de gastos con icono y color.
 * Soporta diferentes tamaños y categorías predefinidas.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CategoryType = 'transport' | 'accommodation' | 'food' | 'activity' | 'other';

interface CategoryConfig {
  bg: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface CategoryBadgeProps {
  /** Tipo de categoría */
  category: CategoryType;

  /** Tamaño del badge */
  size?: 'small' | 'medium';

  /** Si true, muestra el icono */
  showIcon?: boolean;

  /** Texto personalizado (override del label por defecto) */
  label?: string;
}

// Configuración de colores e iconos por categoría
export const CATEGORY_COLORS: Record<CategoryType, CategoryConfig> = {
  transport: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    icon: 'airplane',
    label: 'Transporte',
  },
  accommodation: {
    bg: '#DCFCE7',
    text: '#166534',
    icon: 'bed',
    label: 'Alojamiento',
  },
  food: {
    bg: '#FFEDD5',
    text: '#9A3412',
    icon: 'restaurant',
    label: 'Comida',
  },
  activity: {
    bg: '#F3E8FF',
    text: '#6B21A8',
    icon: 'ticket',
    label: 'Actividad',
  },
  other: {
    bg: '#F3F4F6',
    text: '#374151',
    icon: 'ellipsis-horizontal',
    label: 'Otro',
  },
};

// Helper para obtener configuración de categoría
export function getCategoryConfig(category: CategoryType): CategoryConfig {
  return CATEGORY_COLORS[category];
}

export function CategoryBadge({
  category,
  size = 'medium',
  showIcon = true,
  label,
}: CategoryBadgeProps) {
  const config = getCategoryConfig(category);
  const displayLabel = label || config.label;

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg },
        isSmall ? styles.containerSmall : styles.containerMedium,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={isSmall ? 10 : 12}
          color={config.text}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 9999,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  text: {
    fontWeight: '500',
  },
  textMedium: {
    fontSize: 12,
  },
  textSmall: {
    fontSize: 10,
  },
});
