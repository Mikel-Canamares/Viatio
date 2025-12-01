/**
 * ROOT TABS NAVIGATOR
 *
 * Bottom Tab Navigator principal de la aplicación.
 * Define las 3 tabs principales: Inicio, Calendario, Perfil.
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarScreen, ProfileScreen } from '@/screens';
import { HomeStackNavigator } from './HomeStackNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

// ============================================
// ROOT TABS NAVIGATOR
// ============================================

export function RootTabs() {
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
          height: 60,
          paddingBottom: 8,
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
          // TODO: Añadir icon cuando se configure el sistema de iconos
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendario',
          // TODO: Añadir icon cuando se configure el sistema de iconos
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          // TODO: Añadir icon cuando se configure el sistema de iconos
        }}
      />
    </Tab.Navigator>
  );
}
