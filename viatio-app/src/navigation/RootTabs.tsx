/**
 * ROOT TABS NAVIGATOR
 *
 * Bottom Tab Navigator principal de la aplicación.
 * Define las 3 tabs principales: Inicio, Calendario, Perfil.
 *
 * NOTA: El tab "Shared" fue eliminado. La funcionalidad de viajes compartidos
 * ahora está integrada en el flujo normal de viajes (desde TripDetailScreen).
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripCalendarScreen } from '@/screens';
import { HomeStackNavigator } from './HomeStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useNotificationsStore } from '@/store/notificationsStore';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

// ============================================
// ROOT TABS NAVIGATOR
// ============================================

export function RootTabs() {
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#003580', // Azul Booking.com
        tabBarInactiveTintColor: '#8E8E93', // Gris iOS estándar
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          height: 60 + insets.bottom, // Ajustar altura según el safe area inferior
          paddingBottom: insets.bottom, // Padding inferior dinámico
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={TripCalendarScreen}
        options={{
          tabBarLabel: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tab "Shared" eliminado - funcionalidad integrada en TripDetailScreen */}

      {/* COPILOT TEMPORALMENTE DESACTIVADO - Mantener implementación pero ocultar acceso
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          tabBarLabel: 'Asistente',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      */}

      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
