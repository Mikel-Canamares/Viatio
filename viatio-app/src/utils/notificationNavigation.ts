/**
 * NOTIFICATION NAVIGATION
 *
 * Maneja la navegación cuando el usuario toca una notificación.
 * Soporta deep linking a diferentes pantallas según el tipo de notificación.
 */

import { NotificationResponse } from 'expo-notifications';

// Tipos de notificación soportados
export type NotificationType =
  | 'viaje'
  | 'reserva'
  | 'evento'
  | 'budget_warning'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_requested'
  | 'settlement_completed'
  | 'trip_invite';

// Datos de notificación extendidos
export interface ExtendedNotificationData {
  type: NotificationType;
  viajeId?: string;
  id?: string;
  tripId?: string; // Firestore ID para viajes compartidos
  expenseId?: string;
  settlementId?: string;
  porcentaje?: number;
  gastado?: number;
  presupuesto?: number;
}

// Referencia de navegación (se configura en App.tsx)
let navigationRef: any = null;

/**
 * Configura la referencia de navegación
 */
export function setNavigationRef(ref: any) {
  navigationRef = ref;
}

/**
 * Obtiene la referencia de navegación actual
 */
export function getNavigationRef() {
  return navigationRef;
}

/**
 * Navega a una pantalla específica de forma segura
 */
function safeNavigate(route: string, params?: any) {
  if (!navigationRef) {
    console.warn('[NotificationNav] Navigation ref not ready');
    return false;
  }

  try {
    navigationRef.navigate(route, params);
    return true;
  } catch (error) {
    console.error('[NotificationNav] Navigation error:', error);
    return false;
  }
}

/**
 * Maneja la respuesta cuando el usuario toca una notificación
 */
export function handleNotificationResponse(response: NotificationResponse) {
  const rawData = response.notification.request.content.data;

  if (!rawData || typeof rawData !== 'object') {
    console.log('[NotificationNav] No data in notification');
    return;
  }

  // Validar que tenga el campo type
  const data = rawData as Partial<ExtendedNotificationData>;
  if (!data.type) {
    console.log('[NotificationNav] No type in notification data');
    return;
  }

  console.log('[NotificationNav] Handling notification tap:', data.type, data);

  // Esperar a que la navegación esté lista
  setTimeout(() => {
    navigateByType(data as ExtendedNotificationData);
  }, 500);
}

/**
 * Navega según el tipo de notificación
 */
export function navigateByType(data: ExtendedNotificationData) {
  if (!navigationRef) {
    console.warn('[NotificationNav] Navigation ref not ready');
    return;
  }

  try {
    switch (data.type) {
      // === VIAJES Y RESERVAS ===
      case 'viaje':
        safeNavigate('Home', {
          screen: 'TripDetail',
          params: { viajeId: data.viajeId || data.id },
        });
        break;

      case 'reserva':
        safeNavigate('Home', {
          screen: 'TripDetail',
          params: {
            viajeId: data.viajeId,
            initialTab: 'Agenda',
          },
        });
        break;

      case 'evento':
        safeNavigate('Home', {
          screen: 'TripList',
        });
        break;

      // === PRESUPUESTO ===
      case 'budget_warning':
        safeNavigate('Home', {
          screen: 'TripDetail',
          params: {
            viajeId: data.viajeId,
            initialTab: 'Expenses',
          },
        });
        break;

      // === GASTOS COMPARTIDOS ===
      case 'expense_added':
      case 'expense_updated':
      case 'expense_deleted':
        if (data.tripId && data.expenseId) {
          // Navegar al detalle del gasto si existe
          safeNavigate('Home', {
            screen: 'ExpenseDetail',
            params: {
              tripId: data.tripId,
              expenseId: data.expenseId,
            },
          });
        } else if (data.viajeId) {
          // Fallback: ir a la pestaña de gastos del viaje
          safeNavigate('Home', {
            screen: 'TripDetail',
            params: {
              viajeId: data.viajeId,
              initialTab: 'Expenses',
            },
          });
        }
        break;

      // === LIQUIDACIONES ===
      case 'settlement_requested':
      case 'settlement_completed':
        if (data.tripId) {
          safeNavigate('Home', {
            screen: 'TripSettlements',
            params: {
              tripId: data.tripId,
              settlementId: data.settlementId,
            },
          });
        } else if (data.viajeId) {
          safeNavigate('Home', {
            screen: 'TripDetail',
            params: {
              viajeId: data.viajeId,
              initialTab: 'Expenses',
            },
          });
        }
        break;

      // === INVITACIONES ===
      case 'trip_invite':
        safeNavigate('Profile', {
          screen: 'Notifications',
        });
        break;

      default:
        console.log('[NotificationNav] Unknown notification type:', data.type);
        // Fallback: ir a la lista de viajes
        safeNavigate('Home', {
          screen: 'TripList',
        });
    }
  } catch (error) {
    console.error('[NotificationNav] Error navigating:', error);
  }
}

/**
 * Navega directamente a una notificación específica (para uso en-app)
 */
export function navigateToNotification(data: ExtendedNotificationData) {
  navigateByType(data);
}
