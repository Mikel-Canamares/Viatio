/**
 * SECTION HEADER
 *
 * Componente de encabezado de sección con título y acción opcional.
 * Usado para separar secciones de contenido con una acción clickeable.
 */

import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { theme } from '@/config';

interface SectionHeaderProps {
  /** Título de la sección */
  title: string;

  /** Acción opcional a la derecha */
  action?: {
    label: string;
    onPress: () => void;
  };

  /** Estilos adicionales */
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      {action && (
        <Pressable onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primaryLight, // #0066CC
  },
});
