/**
 * FLOATING ACTION BUTTON (FAB)
 *
 * Botón circular flotante con icono.
 * Usado para acciones principales de la pantalla (añadir, crear, etc.)
 */

import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface FloatingActionButtonProps {
  /** Callback al presionar el botón */
  onPress: () => void;

  /** Nombre del icono de Ionicons (default: 'add') */
  icon?: keyof typeof Ionicons.glyphMap;

  /** Estilos adicionales */
  style?: ViewStyle;
}

export function FloatingActionButton({
  onPress,
  icon = 'add',
  style,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
        style,
      ]}
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 96, // Sobre el bottom navigation
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent, // #FFC043
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra iOS
    shadowColor: '#FFC043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Sombra Android
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: theme.colors.accentHover, // #FFB400
    transform: [{ scale: 0.95 }],
  },
});
