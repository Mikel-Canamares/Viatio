/**
 * SECTION TITLE
 *
 * Componente de título de sección para agrupar configuraciones o listas.
 * Muestra un título con estilo consistente y opcional margen superior.
 */

import { Text, StyleSheet, View } from 'react-native';
import { theme } from '@/config';

interface SectionTitleProps {
  /** Texto del título */
  title: string;

  /** Margen superior adicional (default: true) */
  marginTop?: boolean;
}

export function SectionTitle({ title, marginTop = true }: SectionTitleProps) {
  return (
    <View style={[styles.container, marginTop && styles.marginTop]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  marginTop: {
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
