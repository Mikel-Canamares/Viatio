/**
 * PREFERENCES UTILITIES
 *
 * Utilidades para obtener y verificar preferencias de notificaciones de usuarios
 */

import * as admin from 'firebase-admin';

// Helper para obtener Firestore instance (lazy initialization)
const getDb = () => admin.firestore();

export interface UserPreferences {
  notificacionesActivas: boolean;
  recordatoriosViaje: boolean;
  tiempoAvisoViaje: string;
  actualizacionesReservas: boolean;
  tiempoAvisoReserva: string;
  modoSilencio: 'off' | 'urgent_only' | 'all';
  horarioSilencio: {
    activo: boolean;
    inicio: string; // "HH:mm"
    fin: string; // "HH:mm"
  };
  gastosCompartidos: {
    nuevoGasto: boolean;
    gastoEditado: boolean;
    gastoEliminado: boolean;
    liquidacionSolicitada: boolean;
    liquidacionCompletada: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notificacionesActivas: true,
  recordatoriosViaje: true,
  tiempoAvisoViaje: '1d',
  actualizacionesReservas: true,
  tiempoAvisoReserva: '3h',
  modoSilencio: 'off',
  horarioSilencio: {
    activo: false,
    inicio: '22:00',
    fin: '08:00',
  },
  gastosCompartidos: {
    nuevoGasto: true,
    gastoEditado: true,
    gastoEliminado: true,
    liquidacionSolicitada: true,
    liquidacionCompletada: true,
  },
};

/**
 * Obtiene las preferencias de notificaciones de un usuario
 */
export async function getUserNotificationPreferences(userId: string): Promise<UserPreferences> {
  try {
    const userDoc = await getDb().doc(`users/${userId}/settings/notifications`).get();

    if (!userDoc.exists) {
      console.log(`[Preferences] User ${userId} has no preferences, using defaults`);
      return DEFAULT_PREFERENCES;
    }

    const data = userDoc.data();
    return {
      ...DEFAULT_PREFERENCES,
      ...data,
    } as UserPreferences;
  } catch (error) {
    console.error(`[Preferences] Error getting preferences for ${userId}:`, error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Verifica si el usuario está en periodo de silencio
 */
export function isInSilentPeriod(prefs: UserPreferences): boolean {
  // Si modo silencio está en "all", bloquear todas las notificaciones
  if (prefs.modoSilencio === 'all') {
    return true;
  }

  // Si horario de silencio no está activo, permitir
  if (!prefs.horarioSilencio?.activo) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const inicio = prefs.horarioSilencio.inicio;
  const fin = prefs.horarioSilencio.fin;

  // Caso 1: Horario no cruza medianoche (ej: 09:00 - 18:00)
  if (inicio < fin) {
    return currentTime >= inicio && currentTime <= fin;
  }

  // Caso 2: Horario cruza medianoche (ej: 22:00 - 08:00)
  return currentTime >= inicio || currentTime <= fin;
}

/**
 * Verifica si un tipo de notificación debe enviarse según preferencias
 */
export function shouldSendNotificationType(
  prefs: UserPreferences,
  notificationType: string
): boolean {
  // Master switch
  if (!prefs.notificacionesActivas) {
    return false;
  }

  // Verificar periodo de silencio
  if (isInSilentPeriod(prefs)) {
    // Solo permitir notificaciones urgentes si el modo es "urgent_only"
    if (prefs.modoSilencio === 'urgent_only') {
      const urgentTypes = ['reservation_reminder', 'event_reminder'];
      return urgentTypes.includes(notificationType);
    }
    return false;
  }

  // Verificar preferencias específicas por tipo
  switch (notificationType) {
    case 'reservation_added':
    case 'reservation_updated':
    case 'reservation_reminder':
      return prefs.actualizacionesReservas;

    case 'event_added':
    case 'event_updated':
    case 'event_reminder':
      return prefs.recordatoriosViaje;

    case 'expense_added':
      return prefs.gastosCompartidos.nuevoGasto;
    case 'expense_updated':
      return prefs.gastosCompartidos.gastoEditado;
    case 'expense_deleted':
      return prefs.gastosCompartidos.gastoEliminado;

    case 'settlement_created':
      return prefs.gastosCompartidos.liquidacionSolicitada;
    case 'settlement_updated':
      return prefs.gastosCompartidos.liquidacionCompletada;

    default:
      return true;
  }
}
