/**
 * CATEGORY BADGE
 *
 * Badge para mostrar categorías con icono y color.
 * Usa el sistema centralizado de categorías para mantener consistencia.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBase, BASE_CATEGORIES } from '@/config/categories';

export type CategoryType = CategoryBase;

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

/**
 * Configuración de colores e iconos por categoría
 * Importada del sistema centralizado
 */
export const CATEGORY_COLORS: Record<CategoryType, CategoryConfig> = {
  transport: {
    bg: BASE_CATEGORIES.transport.lightBg,
    text: BASE_CATEGORIES.transport.color,
    icon: BASE_CATEGORIES.transport.icon,
    label: BASE_CATEGORIES.transport.label,
  },
  accommodation: {
    bg: BASE_CATEGORIES.accommodation.lightBg,
    text: BASE_CATEGORIES.accommodation.color,
    icon: BASE_CATEGORIES.accommodation.icon,
    label: BASE_CATEGORIES.accommodation.label,
  },
  food: {
    bg: BASE_CATEGORIES.food.lightBg,
    text: BASE_CATEGORIES.food.color,
    icon: BASE_CATEGORIES.food.icon,
    label: BASE_CATEGORIES.food.label,
  },
  activity: {
    bg: BASE_CATEGORIES.activity.lightBg,
    text: BASE_CATEGORIES.activity.color,
    icon: BASE_CATEGORIES.activity.icon,
    label: BASE_CATEGORIES.activity.label,
  },
  shopping: {
    bg: BASE_CATEGORIES.shopping.lightBg,
    text: BASE_CATEGORIES.shopping.color,
    icon: BASE_CATEGORIES.shopping.icon,
    label: BASE_CATEGORIES.shopping.label,
  },
  other: {
    bg: BASE_CATEGORIES.other.lightBg,
    text: BASE_CATEGORIES.other.color,
    icon: BASE_CATEGORIES.other.icon,
    label: BASE_CATEGORIES.other.label,
  },
};

/**
 * Helper para obtener configuración de categoría
 */
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
