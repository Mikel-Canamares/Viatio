/**
 * CARD
 *
 * Componente de tarjeta reutilizable.
 * Puede ser interactivo (touchable) si se proporciona onPress.
 */

import { ReactNode } from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/config';

interface CardProps {
  /** Contenido de la tarjeta */
  children: ReactNode;

  /** Si se proporciona, la tarjeta será touchable */
  onPress?: () => void;

  /** Estilos personalizados adicionales */
  style?: ViewStyle;
}

export function Card({ children, onPress, style }: CardProps) {
  const cardStyle = [styles.card, style];

  // Si tiene onPress, renderiza como Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  // Si no tiene onPress, renderiza como View simple
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
