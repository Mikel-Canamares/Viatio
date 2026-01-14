/**
 * PAGE HEADER
 *
 * Componente de encabezado para pantallas.
 * Incluye título, botón de retroceso opcional y elemento a la derecha opcional.
 */

import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/config';
import { useNotificationsStore } from '@/store/notificationsStore';

interface PageHeaderProps {
  /** Título del encabezado */
  title: string;

  /** Callback para el botón de retroceso */
  onBack?: () => void;

  /** Elemento opcional a la derecha del encabezado */
  rightElement?: ReactNode;

  /** Mostrar badge de notificaciones */
  showNotificationBadge?: boolean;
}

export function PageHeader({
  title,
  onBack,
  rightElement,
  showNotificationBadge = false,
}: PageHeaderProps) {
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Título centrado */}
        <Text
          style={[
            styles.title,
            onBack ? styles.titleCentered : styles.titleLeft,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Badge de notificaciones */}
        {showNotificationBadge && (
          <Pressable
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Elemento derecho */}
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}

        {/* Botón de retroceso (absoluto para evitar superposición) */}
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    position: 'relative',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 10,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 0.96 }],
  },
  title: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: '600',
  },
  titleCentered: {
    textAlign: 'center',
    paddingHorizontal: 60, // Espacio para botones a los lados
  },
  titleLeft: {
    flex: 1,
    paddingLeft: 60, // Espacio para el botón de retroceso
  },
  rightElement: {
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 10,
  },
  notificationButton: {
    position: 'absolute',
    right: theme.spacing.lg + 48,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
