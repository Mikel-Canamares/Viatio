/**
 * SmartFAB - Floating Action Button Inteligente
 *
 * Botón flotante que sigue al usuario por toda la app y cambia
 * su apariencia según el contexto (color, badge, sugerencia).
 *
 * Features:
 * - Animación de pulso sutil
 * - Badge contextual
 * - Tooltip con sugerencia
 * - Cambio de color según pantalla
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import type { AssistantContext } from '@/hooks/useAssistantContext';

// ============================================
// TIPOS
// ============================================

interface SmartFABProps {
  context: AssistantContext;
  onPress: () => void;
  showTooltip?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SmartFAB({ context, onPress, showTooltip = true }: SmartFABProps) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Animación de pulso continuo
  useEffect(() => {
    const intensity = context.pulseIntensity || 0.3;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1 + intensity * 0.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [context.pulseIntensity, pulseAnim]);

  // Mostrar tooltip brevemente cuando cambia la sugerencia
  useEffect(() => {
    if (showTooltip && context.suggestion) {
      setTooltipVisible(true);
      const timeout = setTimeout(() => setTooltipVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [context.suggestion, showTooltip]);

  return (
    <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
      {/* Tooltip contextual */}
      {tooltipVisible && context.suggestion && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{context.suggestion}</Text>
        </View>
      )}

      {/* FAB principal */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Pressable
          style={[
            styles.fab,
            { backgroundColor: context.color },
            Platform.OS === 'ios' ? theme.shadows.fab : {},
          ]}
          onPress={onPress}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', radius: 30 }}
        >
          <Ionicons name="sparkles" size={28} color="#FFFFFF" />

          {/* Badge */}
          {context.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{context.badge}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    // bottom calculado dinámicamente con insets
    zIndex: 1000,
  },
  fabContainer: {
    position: 'relative',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra para Android
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tooltip: {
    position: 'absolute',
    bottom: 70,
    right: -10,
    minWidth: 180,
    maxWidth: 220,
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.lg,
    // Sombra más pronunciada
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
