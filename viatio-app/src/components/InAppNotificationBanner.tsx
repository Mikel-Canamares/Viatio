/**
 * IN-APP NOTIFICATION BANNER
 *
 * Banner animado que aparece desde arriba cuando llega una notificación
 * mientras la app está en primer plano.
 */

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 80;
const ANIMATION_DURATION = 300;
const AUTO_DISMISS_DELAY = 4000;

export interface BannerNotification {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: any;
}

interface InAppNotificationBannerProps {
  notification: BannerNotification | null;
  onPress?: (notification: BannerNotification) => void;
  onDismiss?: () => void;
}

/**
 * Obtiene el icono según el tipo de notificación
 */
function getNotificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'viaje':
      return 'airplane-outline';
    case 'reserva':
      return 'calendar-outline';
    case 'budget_warning':
      return 'wallet-outline';
    case 'expense_added':
    case 'expense_updated':
    case 'expense_deleted':
      return 'receipt-outline';
    case 'settlement_requested':
    case 'settlement_completed':
      return 'cash-outline';
    case 'trip_invite':
      return 'person-add-outline';
    default:
      return 'notifications-outline';
  }
}

/**
 * Obtiene el color según el tipo de notificación
 */
function getNotificationColor(type?: string): string {
  switch (type) {
    case 'budget_warning':
      return '#F59E0B'; // Amber
    case 'settlement_requested':
      return '#EF4444'; // Red
    case 'settlement_completed':
      return '#10B981'; // Green
    case 'expense_deleted':
      return '#EF4444'; // Red
    default:
      return theme.colors.primaryLight;
  }
}

export function InAppNotificationBanner({
  notification,
  onPress,
  onDismiss,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT - insets.top)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  // Animar entrada/salida cuando cambia la notificación
  useEffect(() => {
    if (notification) {
      // Mostrar banner
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss después de un tiempo
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY);
    } else {
      // Ocultar banner
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -BANNER_HEIGHT - insets.top,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [notification, insets.top]);

  const handleDismiss = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -BANNER_HEIGHT - insets.top,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (notification) {
      handleDismiss();
      onPress?.(notification);
    }
  };

  if (!notification) {
    return null;
  }

  const iconName = getNotificationIcon(notification.type);
  const accentColor = getNotificationColor(notification.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing.sm,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.banner,
          pressed && styles.bannerPressed,
        ]}
      >
        {/* Indicador de color */}
        <View style={[styles.colorIndicator, { backgroundColor: accentColor }]} />

        {/* Icono */}
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name={iconName} size={24} color={accentColor} />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        {/* Botón cerrar */}
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: theme.spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  bannerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  colorIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});
