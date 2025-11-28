/**
 * PRIMARY BUTTON
 *
 * Componente de botón principal reutilizable.
 * Soporta múltiples variantes, estados de loading y disabled.
 */

import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/config';

interface PrimaryButtonProps {
  /** Texto del botón */
  title: string;

  /** Función a ejecutar al presionar */
  onPress: () => void;

  /** Si true, el botón está deshabilitado */
  disabled?: boolean;

  /** Si true, muestra un loading spinner */
  loading?: boolean;

  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'outline';

  /** Si true, el botón ocupa todo el ancho */
  fullWidth?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = true,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  // Estilos base según variante
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
        };

      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary,
        };

      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };

      default:
        return baseStyle;
    }
  };

  // Estilos de texto según variante
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.subtitle,
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: theme.colors.primaryForeground,
        };

      case 'secondary':
        return {
          ...baseStyle,
          color: theme.colors.secondaryForeground,
        };

      case 'outline':
        return {
          ...baseStyle,
          color: theme.colors.primary,
        };

      default:
        return baseStyle;
    }
  };

  // Color del spinner según variante
  const getSpinnerColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primaryForeground;
      case 'secondary':
        return theme.colors.secondaryForeground;
      case 'outline':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <Text style={[getTextStyle(), isDisabled && styles.textDisabled]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
