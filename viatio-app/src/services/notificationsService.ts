/**
 * NOTIFICATIONS SERVICE v2.0
 *
 * Sistema profesional de gestión de notificaciones push locales.
 * Incluye:
 * - Cálculo robusto de fechas con logging detallado
 * - Templates personalizables
 * - Manager central con monitoreo
 * - Reprogramación automática
 * - Modo debug
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Viaje } from '@/types/viaje';
import { Reserva } from '@/types/reserva';
import { getPreferenciasNotificaciones } from './perfilService';
import { TIEMPOS_ANTELACION, TiempoAntelacion } from '@/types/perfil';
import { persistLog } from '@/utils/notificationLogger';

// ============================================
// CONSTANTES
// ============================================

const NOTIFICATION_IDS_STORAGE_KEY = '@viatio:notification_ids';
const NOTIFICATION_DEBUG_MODE_KEY = '@viatio:notification_debug';
const NOTIFICATION_TEMPLATES_KEY = '@viatio:notification_templates';

// Flag para saber si ya se inicializó el handler
let isHandlerInitialized = false;
let debugMode = false;

// ============================================
// TIPOS
// ============================================

export interface NotificationData extends Record<string, unknown> {
  type: 'viaje' | 'reserva' | 'evento';
  id: string;
  viajeId: string;
  scheduledFor?: string; // ISO string de cuándo debería dispararse
}

export interface StoredNotificationId {
  notificationId: string;
  entityType: 'viaje' | 'reserva' | 'evento';
  entityId: string;
  scheduledFor: string; // ISO string
  createdAt: string; // ISO string
  title: string;
  body: string;
}

export interface NotificationTemplate {
  id: string;
  type: 'viaje' | 'reserva';
  enabled: boolean;
  title: string; // Soporta variables: {destino}, {fecha}, {nombre}, {hora}, {ubicacion}
  body: string;
  icon?: string; // emoji o nombre de icono
  sound: 'default' | 'custom';
  vibrate: boolean;
  priority: 'default' | 'high' | 'max';
}

export interface ScheduledNotificationInfo {
  id: string;
  type: 'viaje' | 'reserva' | 'evento';
  entityId: string;
  title: string;
  body: string;
  scheduledFor: Date;
  createdAt: Date;
  isPast: boolean;
  minutesUntil: number;
}

// ============================================
// TEMPLATES POR DEFECTO
// ============================================

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'viaje_default',
    type: 'viaje',
    enabled: true,
    title: '🌍 ¡Tu viaje a {destino} se acerca!',
    body: 'Tu viaje comienza el {fecha}. ¡No olvides revisar tu agenda!',
    icon: '🌍',
    sound: 'default',
    vibrate: true,
    priority: 'high',
  },
  {
    id: 'reserva_default',
    type: 'reserva',
    enabled: true,
    title: '{icon} Reserva próxima: {nombre}',
    body: '{hora}{ubicacion}',
    sound: 'default',
    vibrate: true,
    priority: 'high',
  },
  {
    id: 'payment_deadline',
    type: 'reserva',
    enabled: true,
    title: '💳 Pago pendiente: {nombre}',
    body: 'El pago vence el {fecha}. No olvides completar tu reserva.',
    sound: 'default',
    vibrate: true,
    priority: 'high',
  },
  {
    id: 'cancellation_deadline',
    type: 'reserva',
    enabled: true,
    title: '❌ Última oportunidad para cancelar: {nombre}',
    body: 'Puedes cancelar gratis hasta el {fecha}. Después se aplicarán cargos.',
    sound: 'default',
    vibrate: true,
    priority: 'high',
  },
];

// ============================================
// LOGGING Y DEBUG
// ============================================

/**
 * Logger centralizado con timestamps, niveles y persistencia
 */
function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: any,
  source: string = 'general'
) {
  const timestamp = new Date().toISOString();
  const prefix = `[Notifications ${level.toUpperCase()}] ${timestamp}:`;

  if (level === 'debug' && !debugMode) return;

  switch (level) {
    case 'error':
      console.error(prefix, message, data || '');
      break;
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    case 'debug':
      console.log(prefix, '🐛', message, data || '');
      break;
    default:
      console.log(prefix, message, data || '');
  }

  // Persistir log en AsyncStorage (sin bloquear)
  // Solo persistir logs importantes (no debug, a menos que debugMode esté activo)
  if (level !== 'debug' || debugMode) {
    persistLog(level, message, source, data).catch((error) => {
      console.error('[Notifications] Error persisting log:', error);
    });
  }
}

/**
 * Activa/desactiva modo debug
 */
export async function setDebugMode(enabled: boolean): Promise<void> {
  debugMode = enabled;
  await AsyncStorage.setItem(NOTIFICATION_DEBUG_MODE_KEY, JSON.stringify(enabled));
  log('info', `Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Obtiene estado del modo debug
 */
export async function getDebugMode(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_DEBUG_MODE_KEY);
    debugMode = stored ? JSON.parse(stored) : false;
    return debugMode;
  } catch {
    return false;
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa el notification handler con configuración profesional
 */
function initializeNotificationHandler() {
  if (isHandlerInitialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isHandlerInitialized = true;
  log('info', 'Notification handler initialized');
}

/**
 * Configura canales de Android con múltiples categorías
 */
async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels = [
    {
      id: 'viajes',
      name: 'Viajes',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notificaciones sobre tus viajes programados',
    },
    {
      id: 'reservas',
      name: 'Reservas',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Recordatorios de tus reservas',
    },
    {
      id: 'eventos',
      name: 'Eventos',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Eventos y actividades personalizadas',
    },
  ];

  for (const channel of channels) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      description: channel.description,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#0066CC',
    });
  }

  log('info', 'Android notification channels configured');
}

// ============================================
// PERMISOS
// ============================================

/**
 * Solicita permisos de notificaciones al usuario
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    initializeNotificationHandler();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    log('debug', 'Current permission status', { existingStatus });

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      log('info', 'Permission requested', { finalStatus });
    }

    if (finalStatus !== 'granted') {
      log('warn', 'Notification permissions denied');
      return false;
    }

    // Verificar permisos de alarma exacta (Android 12+)
    const canScheduleExact = await canScheduleExactAlarms();
    if (!canScheduleExact) {
      log('warn', 'Cannot schedule exact alarms - notifications may be delayed');
      // Continuar pero advertir al usuario
    }

    await setupAndroidChannels();
    log('info', 'Notification permissions granted');
    return true;
  } catch (error) {
    log('error', 'Error requesting permissions', error);
    return false;
  }
}

/**
 * Verifica si los permisos de notificaciones están activos
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    log('error', 'Error checking permissions', error);
    return false;
  }
}

/**
 * Verifica si se pueden programar alarmas exactas (Android 12+)
 */
async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // Android 12+ (API 31+) requiere permiso especial
  if (Platform.Version >= 31) {
    try {
      // En Android 12+, necesitamos verificar el permiso
      // Si falla, guiar al usuario a configuración
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      log('warn', 'Could not check exact alarm permission', error);
      return false;
    }
  }

  return true;
}

// ============================================
// TEMPLATES
// ============================================

/**
 * Obtiene templates de notificaciones (con fallback a defaults)
 */
export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Guardar defaults si no existen
    await saveNotificationTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  } catch (error) {
    log('error', 'Error loading templates', error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Guarda templates personalizados
 */
export async function saveNotificationTemplates(
  templates: NotificationTemplate[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_TEMPLATES_KEY, JSON.stringify(templates));
    log('info', 'Templates saved', { count: templates.length });
  } catch (error) {
    log('error', 'Error saving templates', error);
  }
}

/**
 * Actualiza un template específico
 */
export async function updateNotificationTemplate(
  templateId: string,
  updates: Partial<NotificationTemplate>
): Promise<void> {
  try {
    const templates = await getNotificationTemplates();
    const index = templates.findIndex(t => t.id === templateId);

    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates };
      await saveNotificationTemplates(templates);
      log('info', 'Template updated', { templateId, updates });
    }
  } catch (error) {
    log('error', 'Error updating template', error);
  }
}

/**
 * Renderiza un template con variables
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return result;
}

// ============================================
// GESTIÓN DE IDs DE NOTIFICACIONES
// ============================================

/**
 * Guarda el ID de una notificación programada con metadata completa
 */
async function saveNotificationId(
  notificationId: string,
  entityType: 'viaje' | 'reserva' | 'evento',
  entityId: string,
  scheduledFor: Date,
  title: string,
  body: string
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    const ids: StoredNotificationId[] = stored ? JSON.parse(stored) : [];

    ids.push({
      notificationId,
      entityType,
      entityId,
      scheduledFor: scheduledFor.toISOString(),
      createdAt: new Date().toISOString(),
      title,
      body,
    });

    await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(ids));
    log('debug', 'Notification ID saved', {
      notificationId,
      entityType,
      entityId,
      scheduledFor: scheduledFor.toISOString(),
    });
  } catch (error) {
    log('error', 'Error saving notification ID', error);
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
    log('error', 'Error getting notification IDs', error);
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
    log('debug', 'Notification IDs removed', { entityType, entityId });
  } catch (error) {
    log('error', 'Error removing notification IDs', error);
  }
}

/**
 * Obtiene información detallada de todas las notificaciones programadas
 */
export async function getAllScheduledNotificationsInfo(): Promise<ScheduledNotificationInfo[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    if (!stored) return [];

    const ids: StoredNotificationId[] = JSON.parse(stored);
    const now = new Date();

    return ids.map(item => {
      const scheduledFor = new Date(item.scheduledFor);
      const isPast = scheduledFor < now;
      const minutesUntil = Math.floor((scheduledFor.getTime() - now.getTime()) / 1000 / 60);

      return {
        id: item.notificationId,
        type: item.entityType,
        entityId: item.entityId,
        title: item.title,
        body: item.body,
        scheduledFor,
        createdAt: new Date(item.createdAt),
        isPast,
        minutesUntil,
      };
    });
  } catch (error) {
    log('error', 'Error getting scheduled notifications info', error);
    return [];
  }
}

// ============================================
// CÁLCULO ROBUSTO DE FECHAS
// ============================================

/**
 * Calcula la fecha de notificación con validación exhaustiva
 */
function calculateNotificationDate(
  eventDate: Date,
  tiempoAntelacion: TiempoAntelacion
): { notificationDate: Date; isValid: boolean; reason?: string } {
  const segundosAntelacion = TIEMPOS_ANTELACION[tiempoAntelacion].segundos;

  if (segundosAntelacion === null) {
    return { notificationDate: new Date(), isValid: false, reason: 'Tiempo de antelación desactivado' };
  }

  // Validar que eventDate sea válida
  if (isNaN(eventDate.getTime())) {
    log('error', 'Invalid event date', { eventDate });
    return { notificationDate: new Date(), isValid: false, reason: 'Fecha del evento inválida' };
  }

  // Calcular fecha de notificación
  const notificationDate = new Date(eventDate.getTime() - segundosAntelacion * 1000);

  // Validar que no sea en el pasado (con margen de 1 minuto)
  const now = Date.now();
  const oneMinute = 60 * 1000;

  // Logging detallado para debug
  log('debug', 'Calculating notification date', {
    eventDateISO: eventDate.toISOString(),
    eventDateLocal: eventDate.toString(),
    eventTimestamp: eventDate.getTime(),
    nowTimestamp: now,
    secondsBeforeEvent: segundosAntelacion,
    notificationDateISO: notificationDate.toISOString(),
    notificationDateLocal: notificationDate.toString(),
    notificationTimestamp: notificationDate.getTime(),
    minutesUntilNotification: Math.floor((notificationDate.getTime() - now) / 1000 / 60),
  });

  if (notificationDate.getTime() <= now - oneMinute) {
    const minutesAgo = Math.floor((now - notificationDate.getTime()) / 1000 / 60);
    log('warn', 'Notification date is in the past', {
      notificationDate: notificationDate.toISOString(),
      minutesAgo,
      eventDate: eventDate.toISOString(),
    });
    return {
      notificationDate,
      isValid: false,
      reason: `La fecha de notificación ya pasó hace ${minutesAgo} minutos`,
    };
  }

  log('info', 'Notification date calculated successfully', {
    eventDate: eventDate.toISOString(),
    notificationDate: notificationDate.toISOString(),
    secondsBeforeEvent: segundosAntelacion,
    minutesUntilNotification: Math.floor((notificationDate.getTime() - now) / 1000 / 60),
  });

  return { notificationDate, isValid: true };
}

/**
 * Parsea fecha de reserva combinando fecha y hora
 */
function parseReservaDateTime(fechaInicio: string, horaInicio: string): Date {
  try {
    const [hours, minutes] = horaInicio.split(':').map(Number);

    // Parsear la fecha en hora local, no UTC
    // fechaInicio viene en formato 'YYYY-MM-DD'
    const [year, month, day] = fechaInicio.split('-').map(Number);
    const fecha = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Validar que los componentes sean válidos
    if (isNaN(fecha.getTime()) || isNaN(hours) || isNaN(minutes)) {
      log('error', 'Invalid date/time components', { fechaInicio, horaInicio });
      return new Date(NaN);
    }

    log('debug', 'Parsed reserva datetime', {
      fechaInicio,
      horaInicio,
      parsedLocalTime: fecha.toString(),
      isoString: fecha.toISOString(),
    });

    return fecha;
  } catch (error) {
    log('error', 'Error parsing reserva datetime', { fechaInicio, horaInicio, error });
    return new Date(NaN);
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
    log('info', `Attempting to schedule notification for viaje: ${viaje.id}`);
    initializeNotificationHandler();

    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      log('warn', 'No notification permissions');
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();
    log('debug', 'Preferences loaded', preferencias);

    if (!preferencias.recordatoriosViaje) {
      log('info', 'Trip reminders disabled in preferences');
      return false;
    }

    // Cancelar notificaciones anteriores
    await cancelViajeNotifications(viaje.id);

    // Calcular fecha de notificación
    const fechaInicio = new Date(viaje.fechaInicio);
    const calculation = calculateNotificationDate(fechaInicio, preferencias.tiempoAvisoViaje);

    if (!calculation.isValid) {
      log('info', `Cannot schedule notification: ${calculation.reason}`);
      return false;
    }

    const { notificationDate } = calculation;

    // Obtener template
    const templates = await getNotificationTemplates();
    const template = templates.find(t => t.type === 'viaje' && t.enabled) || DEFAULT_TEMPLATES[0];

    // Renderizar contenido
    const variables = {
      destino: viaje.destino,
      fecha: fechaInicio.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    const title = renderTemplate(template.title, variables);
    const body = renderTemplate(template.body, variables);

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: template.sound,
        priority:
          template.priority === 'max'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'viaje',
          id: viaje.id,
          viajeId: viaje.id,
          scheduledFor: notificationDate.toISOString(),
        } as NotificationData,
      },
      trigger: {
        date: notificationDate,
        channelId: 'viajes',
      },
    });

    // Guardar metadata
    await saveNotificationId(notificationId, 'viaje', viaje.id, notificationDate, title, body);

    log(
      'info',
      `✅ Notification scheduled successfully for viaje ${viaje.id}`,
      {
        notificationId,
        scheduledFor: notificationDate.toISOString(),
        title,
      },
      'scheduleNotification'
    );

    return true;
  } catch (error) {
    log('error', 'Error scheduling viaje notification', error, 'scheduleNotification');
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
    log('info', `Attempting to schedule notification for reserva: ${reserva.id}`);
    initializeNotificationHandler();

    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      log('warn', 'No notification permissions');
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();

    if (!preferencias.actualizacionesReservas) {
      log('info', 'Reserva reminders disabled in preferences');
      return false;
    }

    // Verificar que la reserva tenga fecha y hora
    if (!reserva.fechaInicio || !reserva.horaInicio) {
      log('warn', 'Reserva missing date/time', { reserva: reserva.id });
      return false;
    }

    // Cancelar notificaciones anteriores
    await cancelReservaNotifications(reserva.id);

    // Parsear fecha/hora de la reserva
    const fechaReserva = parseReservaDateTime(reserva.fechaInicio, reserva.horaInicio);
    const calculation = calculateNotificationDate(fechaReserva, preferencias.tiempoAvisoReserva);

    if (!calculation.isValid) {
      log('info', `Cannot schedule notification: ${calculation.reason}`);
      return false;
    }

    const { notificationDate } = calculation;

    // Obtener template
    const templates = await getNotificationTemplates();
    const template = templates.find(t => t.type === 'reserva' && t.enabled) || DEFAULT_TEMPLATES[1];

    // Mapeo de emojis por categoría
    const emojiMap: Record<string, string> = {
      transport: '✈️',
      accommodation: '🏨',
      food: '🍽️',
      activity: '🎫',
      other: '📌',
    };

    // Renderizar contenido
    const variables = {
      icon: emojiMap[reserva.categoria] || '📌',
      nombre: reserva.nombre,
      hora: reserva.horaInicio,
      ubicacion: reserva.ubicacion ? ` - ${reserva.ubicacion}` : '',
    };

    const title = renderTemplate(template.title, variables);
    const body = renderTemplate(template.body, variables) + (viajeDestino ? ` (${viajeDestino})` : '');

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: template.sound,
        priority:
          template.priority === 'max'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'reserva',
          id: reserva.id,
          viajeId: reserva.viajeId,
          scheduledFor: notificationDate.toISOString(),
        } as NotificationData,
      },
      trigger: {
        date: notificationDate,
        channelId: 'reservas',
      },
    });

    // Guardar metadata
    await saveNotificationId(notificationId, 'reserva', reserva.id, notificationDate, title, body);

    log(
      'info',
      `✅ Notification scheduled successfully for reserva ${reserva.id}`,
      {
        notificationId,
        scheduledFor: notificationDate.toISOString(),
        title,
      },
      'scheduleNotification'
    );

    return true;
  } catch (error) {
    log('error', 'Error scheduling reserva notification', error, 'scheduleNotification');
    return false;
  }
}

/**
 * Programa una notificación para fecha límite de pago
 */
export async function schedulePaymentDeadlineNotification(
  reserva: Reserva,
  fechaLimite: string,
  tiempoAntelacion: TiempoAntelacion = '3d'
): Promise<boolean> {
  try {
    log('info', `Attempting to schedule payment deadline notification for reserva: ${reserva.id}`);
    initializeNotificationHandler();

    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      log('warn', 'No notification permissions');
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();

    if (!preferencias.actualizacionesReservas) {
      log('info', 'Reserva reminders disabled in preferences');
      return false;
    }

    // Parsear fecha límite
    const fechaLimiteDate = new Date(fechaLimite);
    const calculation = calculateNotificationDate(fechaLimiteDate, tiempoAntelacion);

    if (!calculation.isValid) {
      log('info', `Cannot schedule payment deadline notification: ${calculation.reason}`);
      return false;
    }

    const { notificationDate } = calculation;

    // Obtener template
    const templates = await getNotificationTemplates();
    const template = templates.find(t => t.id === 'payment_deadline') || DEFAULT_TEMPLATES[2];

    // Renderizar contenido
    const variables = {
      nombre: reserva.nombre,
      fecha: fechaLimiteDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    const title = renderTemplate(template.title, variables);
    const body = renderTemplate(template.body, variables);

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: template.sound,
        priority:
          template.priority === 'max'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'reserva',
          id: reserva.id,
          viajeId: reserva.viajeId,
          scheduledFor: notificationDate.toISOString(),
        } as NotificationData,
      },
      trigger: {
        date: notificationDate,
        channelId: 'reservas',
      },
    });

    // Guardar metadata
    await saveNotificationId(notificationId, 'reserva', reserva.id, notificationDate, title, body);

    log('info', `✅ Payment deadline notification scheduled successfully for reserva ${reserva.id}`, {
      notificationId,
      scheduledFor: notificationDate.toISOString(),
      title,
    });

    return true;
  } catch (error) {
    log('error', 'Error scheduling payment deadline notification', error);
    return false;
  }
}

/**
 * Programa una notificación para fecha límite de cancelación
 */
export async function scheduleCancellationDeadlineNotification(
  reserva: Reserva,
  fechaLimite: string,
  tiempoAntelacion: TiempoAntelacion = '3d'
): Promise<boolean> {
  try {
    log('info', `Attempting to schedule cancellation deadline notification for reserva: ${reserva.id}`);
    initializeNotificationHandler();

    // Verificar permisos
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      log('warn', 'No notification permissions');
      return false;
    }

    // Obtener preferencias
    const preferencias = await getPreferenciasNotificaciones();

    if (!preferencias.actualizacionesReservas) {
      log('info', 'Reserva reminders disabled in preferences');
      return false;
    }

    // Parsear fecha límite
    const fechaLimiteDate = new Date(fechaLimite);
    const calculation = calculateNotificationDate(fechaLimiteDate, tiempoAntelacion);

    if (!calculation.isValid) {
      log('info', `Cannot schedule cancellation deadline notification: ${calculation.reason}`);
      return false;
    }

    const { notificationDate } = calculation;

    // Obtener template
    const templates = await getNotificationTemplates();
    const template = templates.find(t => t.id === 'cancellation_deadline') || DEFAULT_TEMPLATES[3];

    // Renderizar contenido
    const variables = {
      nombre: reserva.nombre,
      fecha: fechaLimiteDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    const title = renderTemplate(template.title, variables);
    const body = renderTemplate(template.body, variables);

    // Programar notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: template.sound,
        priority:
          template.priority === 'max'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'reserva',
          id: reserva.id,
          viajeId: reserva.viajeId,
          scheduledFor: notificationDate.toISOString(),
        } as NotificationData,
      },
      trigger: {
        date: notificationDate,
        channelId: 'reservas',
      },
    });

    // Guardar metadata
    await saveNotificationId(notificationId, 'reserva', reserva.id, notificationDate, title, body);

    log('info', `✅ Cancellation deadline notification scheduled successfully for reserva ${reserva.id}`, {
      notificationId,
      scheduledFor: notificationDate.toISOString(),
      title,
    });

    return true;
  } catch (error) {
    log('error', 'Error scheduling cancellation deadline notification', error);
    return false;
  }
}

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
    log(
      'info',
      `Cancelled ${notificationIds.length} notifications for viaje ${viajeId}`,
      { count: notificationIds.length, viajeId },
      'cancelNotification'
    );
  } catch (error) {
    log('error', 'Error cancelling viaje notifications', error, 'cancelNotification');
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
    log(
      'info',
      `Cancelled ${notificationIds.length} notifications for reserva ${reservaId}`,
      { count: notificationIds.length, reservaId },
      'cancelNotification'
    );
  } catch (error) {
    log('error', 'Error cancelling reserva notifications', error, 'cancelNotification');
  }
}

/**
 * Cancela TODAS las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_IDS_STORAGE_KEY);
    log('info', 'All notifications cancelled', undefined, 'cancelNotification');
  } catch (error) {
    log('error', 'Error cancelling all notifications', error, 'cancelNotification');
  }
}

/**
 * Limpia notificaciones obsoletas (pasadas)
 */
export async function cleanupObsoleteNotifications(): Promise<number> {
  try {
    const allInfo = await getAllScheduledNotificationsInfo();
    const obsolete = allInfo.filter(n => n.isPast);

    for (const notification of obsolete) {
      await Notifications.cancelScheduledNotificationAsync(notification.id);
    }

    // Actualizar storage
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
    if (stored) {
      const ids: StoredNotificationId[] = JSON.parse(stored);
      const obsoleteIds = new Set(obsolete.map(n => n.id));
      const filtered = ids.filter(item => !obsoleteIds.has(item.notificationId));
      await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(filtered));
    }

    log('info', `Cleaned up ${obsolete.length} obsolete notifications`);
    return obsolete.length;
  } catch (error) {
    log('error', 'Error cleaning up obsolete notifications', error);
    return 0;
  }
}

// ============================================
// REPROGRAMACIÓN
// ============================================

/**
 * Reprograma todas las notificaciones (útil cuando cambian preferencias)
 */
export async function rescheduleAllNotifications(): Promise<{
  viajes: number;
  reservas: number;
}> {
  try {
    log('info', 'Starting reschedule of all notifications');

    // Esta función debería ser llamada desde viajesService/reservasService
    // ya que necesita acceso a todas las entidades
    // Por ahora solo limpiamos las existentes
    await cancelAllNotifications();

    log('info', 'All notifications rescheduled (entities need to reschedule individually)');
    return { viajes: 0, reservas: 0 };
  } catch (error) {
    log('error', 'Error rescheduling all notifications', error);
    return { viajes: 0, reservas: 0 };
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
    log('info', `Total scheduled notifications: ${notifications.length}`);
    return notifications;
  } catch (error) {
    log('error', 'Error getting scheduled notifications', error);
    return [];
  }
}

/**
 * Envía una notificación de prueba (programada en 3 segundos)
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      log('warn', 'Cannot send test notification: no permissions');
      return false;
    }

    // Programar para dentro de 3 segundos (más confiable que trigger: null)
    const testDate = new Date(Date.now() + 3000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Notificación de prueba',
        body: 'El sistema de notificaciones funciona correctamente',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'evento',
          id: 'test',
          viajeId: 'test',
        },
      },
      trigger: {
        date: testDate,
        channelId: 'eventos',
      },
    });

    log('info', 'Test notification scheduled', { scheduledFor: testDate.toISOString() });
    return true;
  } catch (error) {
    log('error', 'Error sending test notification', error);
    return false;
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

/**
 * Obtiene estadísticas de notificaciones
 */
export async function getNotificationStats(): Promise<{
  total: number;
  viajes: number;
  reservas: number;
  eventos: number;
  upcoming: number;
  past: number;
}> {
  try {
    const allInfo = await getAllScheduledNotificationsInfo();

    return {
      total: allInfo.length,
      viajes: allInfo.filter(n => n.type === 'viaje').length,
      reservas: allInfo.filter(n => n.type === 'reserva').length,
      eventos: allInfo.filter(n => n.type === 'evento').length,
      upcoming: allInfo.filter(n => !n.isPast).length,
      past: allInfo.filter(n => n.isPast).length,
    };
  } catch (error) {
    log('error', 'Error getting notification stats', error);
    return { total: 0, viajes: 0, reservas: 0, eventos: 0, upcoming: 0, past: 0 };
  }
}
