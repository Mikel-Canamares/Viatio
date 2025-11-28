/**
 * CARD
 *
 * Componente de tarjeta reutilizable.
 * Puede ser interactivo (touchable) si se proporciona onPress.
 */

import { ReactNode } from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  /** Contenido de la tarjeta */
  children: ReactNode;

  /** Estilos personalizados adicionales */
  style?: ViewStyle;

  /** Si se proporciona, la tarjeta será touchable */
  onPress?: () => void;

  /** Padding interno de la tarjeta (default: 16) */
  padding?: number;
}

export function Card({ children, style, onPress, padding = 16 }: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Sombra Android
    elevation: 2,
  };

  // Si tiene onPress, renderiza como Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  // Si no tiene onPress, renderiza como View simple
  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});
