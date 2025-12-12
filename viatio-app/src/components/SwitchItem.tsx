/**
 * SWITCH ITEM
 *
 * Componente reutilizable para mostrar un switch con label y descripción.
 * Usado típicamente en pantallas de configuración.
 */

import { View, Text, StyleSheet, Switch } from 'react-native';
import { theme } from '@/config';

interface SwitchItemProps {
  /** Etiqueta principal */
  label: string;

  /** Descripción opcional debajo del label */
  description?: string;

  /** Valor actual del switch */
  value: boolean;

  /** Callback cuando cambia el valor */
  onValueChange: (value: boolean) => void;

  /** Si está deshabilitado */
  disabled?: boolean;
}

export function SwitchItem({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: SwitchItemProps) {
  return (
    <View style={styles.container}>
      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {/* Switch */}
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: '#D1D5DB', // Gris cuando está off
          true: theme.colors.primaryLight, // Azul cuando está on
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
