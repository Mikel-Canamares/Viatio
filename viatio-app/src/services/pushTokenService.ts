/**
 * PUSH TOKEN SERVICE
 *
 * Servicio para gestionar tokens de Expo Push Notifications.
 * Permite obtener y registrar tokens de dispositivos para recibir notificaciones push.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logError } from '@/utils/errorHandler';

/**
 * Obtiene el Expo Push Token del dispositivo actual
 * @returns Token de Expo o null si no es posible obtenerlo
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Solo funciona en dispositivos físicos, no en simuladores/emuladores
    if (!Device.isDevice) {
      console.log('[PushToken] Push notifications only work on physical devices');
      return null;
    }

    // Verificar que tenemos el projectId de EAS
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('[PushToken] No EAS project ID found in app.config.js');
      console.error('[PushToken] Make sure app.config.js has: extra.eas.projectId');
      return null;
    }

    // Obtener permisos de notificaciones
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushToken] Notification permissions not granted');
      return null;
    }

    // Obtener token de Expo
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('[PushToken] Token obtained:', token.substring(0, 30) + '...');

    return token;
  } catch (error) {
    logError(error, 'pushTokenService.getExpoPushToken');
    console.error('[PushToken] Error getting push token:', error);
    return null;
  }
}

/**
 * Registra el push token en Firestore para el usuario actual
 * @returns true si se registró exitosamente, false en caso contrario
 */
export async function registerPushToken(): Promise<boolean> {
  try {
    console.log('[PushToken] Starting push token registration...');

    const token = await getExpoPushToken();
    if (!token) {
      console.log('[PushToken] No token to register');
      return false;
    }

    // Importar dinámicamente para evitar ciclos de dependencias
    const { savePushToken } = await import('@/services/firestore/usersService');
    await savePushToken(token);

    console.log('[PushToken] Token registered successfully');
    return true;
  } catch (error) {
    logError(error, 'pushTokenService.registerPushToken');
    console.error('[PushToken] Error registering push token:', error);
    return false;
  }
}

/**
 * Elimina el push token del usuario actual en Firestore
 * Útil cuando el usuario hace logout
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    console.log('[PushToken] Unregistering push token...');

    // Importar dinámicamente para evitar ciclos de dependencias
    const { removePushToken } = await import('@/services/firestore/usersService');
    await removePushToken();

    console.log('[PushToken] Token unregistered successfully');
  } catch (error) {
    logError(error, 'pushTokenService.unregisterPushToken');
    console.error('[PushToken] Error unregistering push token:', error);
  }
}

/**
 * Verifica si el dispositivo actual puede recibir push notifications
 * @returns true si es un dispositivo físico, false si es simulador/emulador
 */
export function canReceivePushNotifications(): boolean {
  return Device.isDevice;
}

/**
 * Obtiene información del dispositivo para debugging
 */
export function getDeviceInfo(): {
  isDevice: boolean;
  platform: string;
  osVersion: string | undefined;
  manufacturer: string | null;
  modelName: string | null;
} {
  return {
    isDevice: Device.isDevice,
    platform: Platform.OS,
    osVersion: Platform.Version?.toString(),
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
  };
}
