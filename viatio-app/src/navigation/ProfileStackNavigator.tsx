/**
 * PROFILE STACK NAVIGATOR
 *
 * Stack Navigator para el flujo de perfil.
 * Incluye perfil, configuración y ayuda.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ProfileScreen,
  EditProfileScreen,
  SettingsScreen,
  HelpScreen,
} from '@/screens';
import NotificationsSettingsScreen from '@/screens/NotificationSettingsScreen';
import NotificationsManagementScreen from '@/screens/NotificationsManagementScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// ============================================
// PROFILE STACK NAVIGATOR
// ============================================

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="NotificationsManagement" component={NotificationsManagementScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
