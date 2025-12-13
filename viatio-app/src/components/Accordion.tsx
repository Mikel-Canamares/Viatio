/**
 * ACCORDION
 *
 * Componente de acordeón reutilizable con animación.
 * Puede ser controlado (con expanded/onToggle) o no controlado (maneja su propio estado).
 */

import { ReactNode, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
  /** Título del acordeón */
  title: string;

  /** Contenido expandible */
  children: ReactNode;

  /** Estado expandido (para componente controlado) */
  expanded?: boolean;

  /** Callback al alternar (para componente controlado) */
  onToggle?: () => void;

  /** Estilo del título */
  titleStyle?: object;
}

export function Accordion({
  title,
  children,
  expanded,
  onToggle,
  titleStyle,
}: AccordionProps) {
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
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
          style={[
            styles.icon,
            isExpanded && styles.iconExpanded,
          ]}
        />
      </Pressable>

      {/* Contenido expandible */}
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerCollapsed: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  icon: {
    // La animación de rotación se maneja con LayoutAnimation
  },
  iconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
});
