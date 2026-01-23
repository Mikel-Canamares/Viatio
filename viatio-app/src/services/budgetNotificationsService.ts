/**
 * BUDGET NOTIFICATIONS SERVICE
 *
 * Servicio para gestionar alertas de presupuesto.
 * Verifica umbrales y programa notificaciones locales cuando se superan.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Viaje } from '@/types/viaje';
import {
  getPreferenciasNotificaciones,
  getUltimoUmbralNotificado,
  setUltimoUmbralNotificado,
  shouldSendNotification,
} from './perfilService';

// Umbrales de alerta disponibles (ordenados)
const UMBRALES = [50, 75, 90, 100] as const;

// Storage key para evitar alertas repetidas
const STORAGE_KEY_PREFIX = '@viatio:budget_alert_';

interface BudgetAlertData {
  viajeId: string;
  destino: string;
  porcentaje: number;
  gastado: number;
  presupuesto: number;
  moneda: string;
}

/**
 * Formatea un número como moneda
 */
function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    MXN: '$',
    ARS: '$',
    COP: '$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Obtiene el emoji según el porcentaje de presupuesto
 */
function getBudgetEmoji(porcentaje: number): string {
  if (porcentaje >= 100) return '🚨';
  if (porcentaje >= 90) return '⚠️';
  if (porcentaje >= 75) return '📊';
  return '💰';
}

/**
 * Obtiene el título de la notificación según el umbral
 */
function getBudgetTitle(porcentaje: number): string {
  if (porcentaje >= 100) return 'Presupuesto superado';
  if (porcentaje >= 90) return 'Presupuesto al 90%';
  if (porcentaje >= 75) return 'Presupuesto al 75%';
  return 'Presupuesto al 50%';
}

/**
 * Verifica si ya se envió una alerta para este umbral en este viaje
 */
async function hasAlertBeenSent(viajeId: string, umbral: number): Promise<boolean> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${viajeId}_${umbral}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Marca que se ha enviado una alerta para este umbral
 */
async function markAlertAsSent(viajeId: string, umbral: number): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${viajeId}_${umbral}`;
    await AsyncStorage.setItem(key, 'true');
  } catch (error) {
    console.error('[BudgetNotif] Error marcando alerta como enviada:', error);
  }
}

/**
 * Limpia las alertas de presupuesto para un viaje (cuando se resetea el presupuesto)
 */
export async function clearBudgetAlerts(viajeId: string): Promise<void> {
  try {
    const keys = UMBRALES.map(u => `${STORAGE_KEY_PREFIX}${viajeId}_${u}`);
    await AsyncStorage.multiRemove(keys);
    console.log(`[BudgetNotif] Alertas limpiadas para viaje ${viajeId}`);
  } catch (error) {
    console.error('[BudgetNotif] Error limpiando alertas:', error);
  }
}

/**
 * Programa una notificación local de alerta de presupuesto
 */
async function scheduleBudgetNotification(data: BudgetAlertData): Promise<string | null> {
  try {
    const { viajeId, destino, porcentaje, gastado, presupuesto, moneda } = data;

    const emoji = getBudgetEmoji(porcentaje);
    const title = `${emoji} ${getBudgetTitle(porcentaje)}`;
    const body = `Has gastado ${formatCurrency(gastado, moneda)} de ${formatCurrency(presupuesto, moneda)} en tu viaje a ${destino}`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'budget_warning',
          viajeId,
          porcentaje,
          gastado,
          presupuesto,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Inmediata
    });

    console.log(`[BudgetNotif] Notificación enviada: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('[BudgetNotif] Error programando notificación:', error);
    return null;
  }
}

/**
 * Verifica el presupuesto y envía alertas si corresponde
 * Debe llamarse después de añadir un gasto
 */
export async function checkBudgetAndNotify(
  viaje: Viaje,
  totalGastado: number
): Promise<void> {
  try {
    // 1. Verificar que el viaje tenga presupuesto definido
    if (!viaje.presupuesto || viaje.presupuesto <= 0) {
      console.log('[BudgetNotif] Viaje sin presupuesto, omitiendo check');
      return;
    }

    // 2. Verificar preferencias del usuario
    const canSend = await shouldSendNotification('presupuesto');
    if (!canSend) {
      console.log('[BudgetNotif] Notificaciones de presupuesto desactivadas');
      return;
    }

    const prefs = await getPreferenciasNotificaciones();
    if (!prefs.alertasPresupuesto) {
      return;
    }

    // 3. Calcular porcentaje actual
    const porcentaje = (totalGastado / viaje.presupuesto) * 100;
    console.log(`[BudgetNotif] Porcentaje de presupuesto: ${porcentaje.toFixed(1)}%`);

    // 4. Obtener el umbral configurado por el usuario
    const umbralUsuario = prefs.umbralAlertaPresupuesto; // 50, 75 o 90

    // 5. Determinar qué umbrales se han superado
    const umbralesSuperados = UMBRALES.filter(u => porcentaje >= u && u >= umbralUsuario);

    if (umbralesSuperados.length === 0) {
      console.log('[BudgetNotif] No se ha superado ningún umbral configurado');
      return;
    }

    // 6. Enviar alerta para el umbral más alto no notificado aún
    for (const umbral of umbralesSuperados.reverse()) {
      const alreadySent = await hasAlertBeenSent(viaje.id, umbral);

      if (!alreadySent) {
        console.log(`[BudgetNotif] Enviando alerta para umbral ${umbral}%`);

        await scheduleBudgetNotification({
          viajeId: viaje.id,
          destino: viaje.destino,
          porcentaje: Math.round(porcentaje),
          gastado: totalGastado,
          presupuesto: viaje.presupuesto,
          moneda: viaje.moneda,
        });

        await markAlertAsSent(viaje.id, umbral);

        // Solo enviar una alerta por vez (la del umbral más alto)
        break;
      }
    }
  } catch (error) {
    console.error('[BudgetNotif] Error en checkBudgetAndNotify:', error);
  }
}

/**
 * Obtiene el estado de alertas de un viaje (para debugging)
 */
export async function getBudgetAlertStatus(viajeId: string): Promise<Record<number, boolean>> {
  const status: Record<number, boolean> = {};

  for (const umbral of UMBRALES) {
    status[umbral] = await hasAlertBeenSent(viajeId, umbral);
  }

  return status;
}
