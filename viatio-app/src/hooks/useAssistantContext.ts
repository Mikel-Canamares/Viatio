/**
 * useAssistantContext
 *
 * Hook que analiza el contexto actual de la pantalla y genera
 * información contextual para el SmartFAB (badge, color, sugerencia).
 *
 * Según dónde esté el usuario, el asistente muestra diferentes hints.
 */

import { useMemo } from 'react';
import { theme } from '@/config/theme';

// ============================================
// TIPOS
// ============================================

export interface AssistantContext {
  badge?: string | null;
  color: string;
  suggestion?: string;
  pulseIntensity?: number; // 0-1, para animar el pulso
}

interface ContextOptions {
  screenName: string;
  viajeId?: string;
  viaje?: any; // TODO: tipar con Viaje cuando esté disponible
  reservasCount?: number;
  emptyDaysCount?: number;
  nearbyPlacesCount?: number;
  budgetPercentage?: number;
}

// ============================================
// HOOK
// ============================================

export function useAssistantContext(options: ContextOptions): AssistantContext {
  const {
    screenName,
    viajeId,
    viaje,
    reservasCount = 0,
    emptyDaysCount = 0,
    nearbyPlacesCount = 0,
    budgetPercentage = 0,
  } = options;

  const context = useMemo(() => {
    // Si no hay viaje activo, contexto por defecto
    if (!viajeId) {
      return {
        color: theme.colors.primary,
        suggestion: '¿Necesitas ayuda para planificar tu viaje?',
        pulseIntensity: 0.3,
      };
    }

    // Analizar contexto según pantalla
    switch (screenName) {
      case 'TripDetail':
        return {
          badge: viaje?.destino ? '💡' : null,
          color: theme.colors.success,
          suggestion: viaje?.destino
            ? `Tengo consejos para tu viaje a ${viaje.destino}`
            : 'Cuéntame sobre tu viaje',
          pulseIntensity: 0.5,
        };

      case 'TripAgenda':
        if (emptyDaysCount > 0) {
          return {
            badge: `${emptyDaysCount}`,
            color: theme.colors.categories.activity, // Púrpura
            suggestion:
              emptyDaysCount === 1
                ? 'Tienes 1 día sin planificar, ¿te ayudo?'
                : `Tienes ${emptyDaysCount} días sin planificar`,
            pulseIntensity: 0.7,
          };
        }
        return {
          badge: '✓',
          color: theme.colors.success,
          suggestion: '¿Quieres optimizar tu itinerario?',
          pulseIntensity: 0.4,
        };

      case 'TripReservations':
        if (reservasCount === 0) {
          return {
            badge: '!',
            color: theme.colors.warning,
            suggestion: '¿Necesitas ayuda para añadir tus reservas?',
            pulseIntensity: 0.6,
          };
        }
        return {
          badge: '✓',
          color: theme.colors.success,
          suggestion: '¿Reviso si falta algo importante?',
          pulseIntensity: 0.4,
        };

      case 'TripMap':
        if (nearbyPlacesCount > 0) {
          return {
            badge: `${nearbyPlacesCount}`,
            color: theme.colors.primaryLight, // Azul cielo
            suggestion: `Encontré ${nearbyPlacesCount} lugares interesantes cerca`,
            pulseIntensity: 0.6,
          };
        }
        return {
          badge: '🗺️',
          color: theme.colors.primaryLight,
          suggestion: '¿Busco lugares de interés en el mapa?',
          pulseIntensity: 0.5,
        };

      case 'Expenses':
        if (budgetPercentage > 100) {
          return {
            badge: '💰',
            color: theme.colors.error,
            suggestion: `Llevas ${budgetPercentage}% del presupuesto, ¿hablamos?`,
            pulseIntensity: 0.8,
          };
        } else if (budgetPercentage > 80) {
          return {
            badge: '⚠️',
            color: theme.colors.warning,
            suggestion: 'Vas cerca del límite del presupuesto',
            pulseIntensity: 0.6,
          };
        }
        return {
          badge: '💰',
          color: theme.colors.success,
          suggestion: '¿Necesitas ayuda con el presupuesto?',
          pulseIntensity: 0.4,
        };

      case 'TripDocuments':
        return {
          badge: '📄',
          color: theme.colors.primary,
          suggestion: '¿Qué documentos necesitas para viajar?',
          pulseIntensity: 0.5,
        };

      default:
        return {
          badge: null,
          color: theme.colors.primary,
          suggestion: '¿En qué puedo ayudarte?',
          pulseIntensity: 0.3,
        };
    }
  }, [
    screenName,
    viajeId,
    viaje?.destino,
    reservasCount,
    emptyDaysCount,
    nearbyPlacesCount,
    budgetPercentage,
  ]);

  return context;
}
