/**
 * COPILOT FAB
 *
 * Floating Action Button para acceder al Copilot desde cualquier pantalla.
 * Muestra un botón flotante con el icono del asistente.
 */

import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/config/theme';

// ============================================
// TIPOS
// ============================================

interface CopilotFABProps {
  onPress: () => void;
  style?: ViewStyle;
  /** Posición del FAB */
  position?: 'bottom-right' | 'bottom-left';
  /** Ocultar temporalmente */
  hidden?: boolean;
}

// ============================================
// COMPONENT
// ============================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CopilotFAB({
  onPress,
  style,
  position = 'bottom-right',
  hidden = false,
}: CopilotFABProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: hidden ? 0 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  if (hidden) return null;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        position === 'bottom-right' ? styles.positionRight : styles.positionLeft,
        { bottom: insets.bottom + 16 },
        animatedStyle,
        style,
      ]}
    >
      <Ionicons name="sparkles" size={24} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.fab,
  },
  positionRight: {
    right: 16,
  },
  positionLeft: {
    left: 16,
  },
});
