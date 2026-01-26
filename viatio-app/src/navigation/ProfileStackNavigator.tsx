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
  NotificationDebugScreen,
  SettingsScreen,
  HelpScreen,
} from '@/screens';
import NotificationsSettingsScreen from '@/screens/NotificationSettingsScreen';
import NotificationsManagementScreen from '@/screens/NotificationsManagementScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import CopilotSettingsScreen from '@/screens/CopilotSettingsScreen';
import DiagnosticoPushScreen from '@/screens/DiagnosticoPushScreen';
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
      <Stack.Screen name="NotificationDebug" component={NotificationDebugScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="DiagnosticoPush" component={DiagnosticoPushScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CopilotSettings" component={CopilotSettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
