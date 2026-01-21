/**
 * CATEGORY ACCORDION
 *
 * Acordeón especializado para categorías de FAQs.
 * Incluye ícono, color personalizado y contador de items.
 */

import { ReactNode, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategoryAccordionProps {
  /** Título de la categoría */
  title: string;

  /** Nombre del ícono de Ionicons */
  icon: string;

  /** Color del ícono y accentos */
  color?: string;

  /** Número de items en la categoría (para el badge) */
  itemCount?: number;

  /** Contenido expandible */
  children: ReactNode;

  /** Estado expandido (para componente controlado) */
  expanded?: boolean;

  /** Callback al alternar (para componente controlado) */
  onToggle?: () => void;
}

export function CategoryAccordion({
  title,
  icon,
  color = theme.colors.primary,
  itemCount,
  children,
  expanded,
  onToggle,
}: CategoryAccordionProps) {
  // Estado interno para modo no controlado
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Determinar si es controlado o no controlado
  const isControlled = expanded !== undefined && onToggle !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  // Handler de toggle
  const handleToggle = () => {
    // Configurar animación suave
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.header,
          !isExpanded && styles.headerCollapsed,
          pressed && styles.headerPressed,
        ]}
      >
        {/* Ícono de categoría */}
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        {/* Título y contador */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {itemCount !== undefined && (
            <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.badgeText, { color }]}>{itemCount}</Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
          style={[styles.chevron, isExpanded && styles.chevronExpanded]}
        />
      </Pressable>

      {/* Contenido expandible */}
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerCollapsed: {
    // Sin borde cuando está colapsado (se ve mejor con el border del container)
  },
  headerPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: theme.spacing.xs,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
