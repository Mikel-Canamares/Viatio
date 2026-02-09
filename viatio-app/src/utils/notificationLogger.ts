/**
 * NOTIFICATION LOGGER
 *
 * Servicio de logging persistente para debugging de notificaciones.
 * Almacena los últimos 100 eventos en AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_LOGS_KEY = '@viatio:notification_logs';
const MAX_LOGS = 100;

export interface NotificationLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source: string; // e.g., 'scheduleNotification', 'cancelNotification'
}

export interface NotificationStats {
  totalScheduled: number;
  totalCancelled: number;
  totalFailed: number;
  totalDelivered: number;
  successRate: number; // 0-100
}

/**
 * Guarda un evento de log en AsyncStorage
 */
export async function persistLog(
  level: NotificationLogEntry['level'],
  message: string,
  source: string,
  data?: any
): Promise<void> {
  try {
    const entry: NotificationLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source,
    };

    // Obtener logs existentes
    const existing = await getLogs();

    // Agregar nuevo log al principio (más reciente primero)
    const updated = [entry, ...existing].slice(0, MAX_LOGS);

    // Guardar
    await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[NotificationLogger] Error persisting log:', error);
  }
}

/**
 * Obtiene todos los logs persistidos
 */
export async function getLogs(): Promise<NotificationLogEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[NotificationLogger] Error getting logs:', error);
    return [];
  }
}

/**
 * Limpia todos los logs
 */
export async function clearLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_LOGS_KEY);
  } catch (error) {
    console.error('[NotificationLogger] Error clearing logs:', error);
  }
}

/**
 * Exporta logs como string (para compartir/debugging)
 */
export async function exportLogs(): Promise<string> {
  try {
    const logs = await getLogs();

    if (logs.length === 0) {
      return 'No hay logs disponibles';
    }

    const lines = logs.map((log) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const data = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      return `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}]\n  ${log.message}${data}`;
    });

    return lines.join('\n\n');
  } catch (error) {
    console.error('[NotificationLogger] Error exporting logs:', error);
    return 'Error al exportar logs';
  }
}

/**
 * Calcula estadísticas de notificaciones basadas en logs
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const logs = await getLogs();

    const scheduled = logs.filter((log) => log.source === 'scheduleNotification').length;
    const cancelled = logs.filter((log) => log.source === 'cancelNotification').length;
    const failed = logs.filter((log) => log.level === 'error').length;
    const delivered = logs.filter((log) => log.source === 'notificationReceived').length;

    const successRate =
      scheduled > 0 ? Math.round(((scheduled - failed) / scheduled) * 100) : 0;

    return {
      totalScheduled: scheduled,
      totalCancelled: cancelled,
      totalFailed: failed,
      totalDelivered: delivered,
      successRate,
    };
  } catch (error) {
    console.error('[NotificationLogger] Error calculating stats:', error);
    return {
      totalScheduled: 0,
      totalCancelled: 0,
      totalFailed: 0,
      totalDelivered: 0,
      successRate: 0,
    };
  }
}

/**
 * Filtra logs por nivel
 */
export async function getLogsByLevel(
  level: NotificationLogEntry['level']
): Promise<NotificationLogEntry[]> {
  const logs = await getLogs();
  return logs.filter((log) => log.level === level);
}

/**
 * Filtra logs por source
 */
export async function getLogsBySource(source: string): Promise<NotificationLogEntry[]> {
  const logs = await getLogs();
  return logs.filter((log) => log.source === source);
}

/**
 * Obtiene logs de las últimas N horas
 */
export async function getRecentLogs(hours: number = 24): Promise<NotificationLogEntry[]> {
  const logs = await getLogs();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  return logs.filter((log) => new Date(log.timestamp) >= cutoff);
}
