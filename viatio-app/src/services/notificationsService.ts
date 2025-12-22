/**
 * NOTIFICATIONS SERVICE
 *
 * Servicio para gestionar notificaciones push locales.
 * Maneja permisos, programación y cancelación de notificaciones
 * para viajes, reservas y eventos personalizados.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Viaje } from '@/types/viaje';
import { Reserva } from '@/types/reserva';
import { getPreferenciasNotificaciones } from './perfilService';
import { TIEMPOS_ANTELACION } from '@/types/perfil';

// ============================================
// CONSTANTES
// ============================================

const NOTIFICATION_IDS_STORAGE_KEY = '@viatio:notification_ids';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// TIPOS
// ============================================

interface NotificationData extends Record<string, unknown> {
  type: 'viaje' | 'reserva' | 'evento';
  id: string;
  viajeId: string;
}

interface StoredNotificationId {
  notificationId: string;
  entityType: 'viaje' | 'reserva' | 'evento';
  entityId: string;
}

// ============================================
// PERMISOS
// ============================================

/**
 * Solicita permisos de notificaciones al usuario
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permisos de notificaciones denegados');
    return false;
  }

  // Configurar canal de notificaciones en Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('viajes', {
      name: 'Viajes y Reservas',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#0066CC',
    });
  }

  return true;
}

/**
 * Verifica si los permisos de notificaciones están activos
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ============================================
// GESTIÓN DE IDs DE NOTIFICACIONES
// ============================================

/**
 * Guarda el ID de una notificación programada
 */
async function saveNotificationId(
  notificationId: string,
  entityType: 'viaje' | 'reserva' | 'evento',
  entityId: string
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    const ids: StoredNotificationId[] = stored ? JSON.parse(stored) : [];

    ids.push({ notificationId, entityType, entityId });

    await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error guardando notification ID:', error);
  }
}

/**
 * Obtiene todas las notificaciones programadas para una entidad
 */
async function getNotificationIdsForEntity(
  entityType: 'viaje' | 'reserva' | 'evento',
  entityId: string
): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    if (!stored) return [];

    const ids: StoredNotificationId[] = JSON.parse(stored);
    return ids
      .filter(item => item.entityType === entityType && item.entityId === entityId)
      .map(item => item.notificationId);
  } catch (error) {
    console.error('Error obteniendo notification IDs:', error);
    return [];
  }
}

/**
 * Elimina los IDs de notificación de una entidad
 */
async function removeNotificationIdsForEntity(
  entityType: 'viaje' | 'reserva' | 'evento',
  entityId: string
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    if (!stored) return;

    const ids: StoredNotificationId[] = JSON.parse(stored);
    const filtered = ids.filter(
      item => !(item.entityType === entityType && item.entityId === entityId)
    );

    await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error eliminando notification IDs:', error);
  }
}

// ============================================
// PROGRAMAR NOTIFICACIONES
// ============================================

/**
 * Programa una notificación para el inicio de un viaje
 */
export async function scheduleViajeNotification(viaje: Viaje): Promise<boolean> {
  try {
    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      console.log('No hay permisos de notificaciones');
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();

    if (!preferencias.recordatoriosViaje) {
      console.log('Recordatorios de viaje desactivados');
      return false;
    }

    const tiempoAntelacion = preferencias.tiempoAvisoViaje;
    const segundosAntelacion = TIEMPOS_ANTELACION[tiempoAntelacion].segundos;

    if (segundosAntelacion === null) {
      console.log('Tiempo de antelación desactivado para viajes');
      return false;
    }

    // Cancelar notificaciones anteriores de este viaje
    await cancelViajeNotifications(viaje.id);

    // Calcular fecha/hora de la notificación
    const fechaInicio = new Date(viaje.fechaInicio);
    const fechaNotificacion = new Date(fechaInicio.getTime() - segundosAntelacion * 1000);

    // No programar si la fecha ya pasó
    if (fechaNotificacion.getTime() <= Date.now()) {
      console.log('Fecha de notificación ya pasó');
      return false;
    }

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌍 ¡Tu viaje a ${viaje.destino} se acerca!`,
        body: `Tu viaje comienza el ${new Date(viaje.fechaInicio).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}. ¡No olvides revisar tu agenda!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'viaje',
          id: viaje.id,
          viajeId: viaje.id,
        } as NotificationData,
      },
      trigger: {
        date: fechaNotificacion,
        channelId: 'viajes',
      },
    });

    // Guardar el ID de la notificación
    await saveNotificationId(notificationId, 'viaje', viaje.id);

    console.log(`Notificación programada para viaje ${viaje.id}:`, fechaNotificacion);
    return true;
  } catch (error) {
    console.error('Error programando notificación de viaje:', error);
    return false;
  }
}

/**
 * Programa una notificación para una reserva
 */
export async function scheduleReservaNotification(
  reserva: Reserva,
  viajeDestino?: string
): Promise<boolean> {
  try {
    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();

    if (!preferencias.actualizacionesReservas) {
      return false;
    }

    const tiempoAntelacion = preferencias.tiempoAvisoReserva;
    const segundosAntelacion = TIEMPOS_ANTELACION[tiempoAntelacion].segundos;

    if (segundosAntelacion === null) {
      return false;
    }

    // Verificar que la reserva tenga fecha y hora
    if (!reserva.fechaInicio || !reserva.horaInicio) {
      console.log('Reserva sin fecha/hora, no se programa notificación');
      return false;
    }

    // Cancelar notificaciones anteriores de esta reserva
    await cancelReservaNotifications(reserva.id);

    // Calcular fecha/hora de la notificación
    const [hours, minutes] = reserva.horaInicio.split(':').map(Number);
    const fechaReserva = new Date(reserva.fechaInicio);
    fechaReserva.setHours(hours, minutes, 0, 0);

    const fechaNotificacion = new Date(fechaReserva.getTime() - segundosAntelacion * 1000);

    // No programar si la fecha ya pasó
    if (fechaNotificacion.getTime() <= Date.now()) {
      return false;
    }

    // Determinar emoji según categoría
    const emojiMap = {
      transport: '✈️',
      accommodation: '🏨',
      food: '🍽️',
      activity: '🎫',
      other: '📌',
    };
    const emoji = emojiMap[reserva.categoria];

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Reserva próxima: ${reserva.nombre}`,
        body: `${reserva.horaInicio}${reserva.ubicacion ? ` - ${reserva.ubicacion}` : ''}${
          viajeDestino ? ` (${viajeDestino})` : ''
        }`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'reserva',
          id: reserva.id,
          viajeId: reserva.viajeId,
        } as NotificationData,
      },
      trigger: {
        date: fechaNotificacion,
        channelId: 'viajes',
      },
    });

    // Guardar el ID de la notificación
    await saveNotificationId(notificationId, 'reserva', reserva.id);

    console.log(`Notificación programada para reserva ${reserva.id}:`, fechaNotificacion);
    return true;
  } catch (error) {
    console.error('Error programando notificación de reserva:', error);
    return false;
  }
}

// Función scheduleEventoNotification eliminada temporalmente
// Se implementará cuando se cree el sistema de eventos personalizados

// ============================================
// CANCELAR NOTIFICACIONES
// ============================================

/**
 * Cancela todas las notificaciones de un viaje
 */
export async function cancelViajeNotifications(viajeId: string): Promise<void> {
  try {
    const notificationIds = await getNotificationIdsForEntity('viaje', viajeId);

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    await removeNotificationIdsForEntity('viaje', viajeId);
    console.log(`Canceladas ${notificationIds.length} notificaciones del viaje ${viajeId}`);
  } catch (error) {
    console.error('Error cancelando notificaciones de viaje:', error);
  }
}

/**
 * Cancela todas las notificaciones de una reserva
 */
export async function cancelReservaNotifications(reservaId: string): Promise<void> {
  try {
    const notificationIds = await getNotificationIdsForEntity('reserva', reservaId);

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    await removeNotificationIdsForEntity('reserva', reservaId);
    console.log(`Canceladas ${notificationIds.length} notificaciones de la reserva ${reservaId}`);
  } catch (error) {
    console.error('Error cancelando notificaciones de reserva:', error);
  }
}

// Función cancelEventoNotifications eliminada temporalmente
// Se implementará cuando se cree el sistema de eventos personalizados

/**
 * Cancela TODAS las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_IDS_STORAGE_KEY);
    console.log('Todas las notificaciones han sido canceladas');
  } catch (error) {
    console.error('Error cancelando todas las notificaciones:', error);
  }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtiene todas las notificaciones programadas (para debugging)
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Total notificaciones programadas: ${notifications.length}`);
    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Listener para notificaciones recibidas
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener para cuando el usuario toca una notificación
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
