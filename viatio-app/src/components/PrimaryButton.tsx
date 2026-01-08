/**
 * PRIMARY BUTTON
 *
 * Componente de botón principal reutilizable.
 * Soporta estados de loading, disabled y variante small.
 */

import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { theme } from '@/config';

interface PrimaryButtonProps {
  /** Texto del botón (preferido) */
  children?: string;

  /** Texto del botón (alias para retrocompatibilidad) */
  title?: string;

  /** Función a ejecutar al presionar */
  onPress: () => void;

  /** Si true, el botón está deshabilitado */
  disabled?: boolean;

  /** Si true, muestra un loading spinner */
  loading?: boolean;

  /** Variante del tamaño del botón */
  variant?: 'primary' | 'small';

  /** Estilos adicionales */
  style?: ViewStyle;
}

export function PrimaryButton({
  children,
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  // Soportar tanto children como title para retrocompatibilidad
  const buttonText = children || title || '';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'small' ? styles.buttonSmall : styles.buttonPrimary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.text}>{buttonText}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent, // #FFC043
    paddingVertical: 16,
  },
  buttonSmall: {
    backgroundColor: theme.colors.accent, // #FFC043
    paddingVertical: 12,
  },
  pressed: {
    backgroundColor: theme.colors.accentHover, // #FFB400
  },
  disabled: {
    backgroundColor: '#D1D5DB',
  },
  text: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
