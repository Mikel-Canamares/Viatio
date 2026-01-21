/**
 * FLOATING ACTION BUTTON (FAB)
 *
 * Botón flotante rectangular con icono.
 * Usado para acciones principales de la pantalla (añadir, crear, etc.)
 */

import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: 96 + insets.bottom }, // 96px sobre el bottom navigation + safe area
        pressed && styles.fabPressed,
        style,
      ]}
    >
      <Ionicons name={icon} size={24} color="#1A1A1A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    // bottom calculado dinámicamente con insets
    right: 24,
    minWidth: 120,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.accent, // #FFC043
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
