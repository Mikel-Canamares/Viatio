/**
 * SECONDARY BUTTON
 *
 * Componente de botón secundario con borde.
 * Usado para acciones secundarias o alternativas.
 */

import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/config';

interface SecondaryButtonProps {
  /** Contenido del botón (texto, iconos, etc.) */
  children: ReactNode;

  /** Función a ejecutar al presionar */
  onPress: () => void;

  /** Si true, el botón está deshabilitado */
  disabled?: boolean;

  /** Estilos adicionales */
  style?: ViewStyle;
}

export function SecondaryButton({
  children,
  onPress,
  disabled = false,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  pressed: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  text: {
    color: theme.colors.primary, // #003580
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  textDisabled: {
    opacity: 0.5,
  },
});
