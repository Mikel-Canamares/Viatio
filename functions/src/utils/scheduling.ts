/**
 * SCHEDULING UTILITIES
 *
 * Utilidades para calcular cuándo enviar notificaciones programadas
 */

/**
 * Convierte TiempoAntelacion a milisegundos
 */
function getAdvanceTimeMs(tiempoAviso: string): number {
  switch (tiempoAviso) {
    case '1h': return 1 * 60 * 60 * 1000;
    case '3h': return 3 * 60 * 60 * 1000;
    case '1d': return 1 * 24 * 60 * 60 * 1000;
    case '3d': return 3 * 24 * 60 * 60 * 1000;
    case '1w': return 7 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

/**
 * Calcula cuándo enviar una notificación basándose en fecha, hora y tiempo de aviso
 *
 * @param fecha Fecha del evento (YYYY-MM-DD)
 * @param hora Hora del evento (HH:MM) opcional
 * @param tiempoAviso Tiempo de antelación ('1h', '3h', '1d', '3d', '1w')
 * @returns Date cuándo enviar la notificación, o null si no es válido
 */
export function calculateNotificationTime(
  fecha: string,
  hora: string | undefined,
  tiempoAviso: string
): Date | null {
  if (tiempoAviso === 'disabled') {
    return null;
  }

  try {
    // Parsear fecha (formato YYYY-MM-DD)
    const [year, month, day] = fecha.split('-').map(Number);
    if (!year || !month || !day) {
      console.error(`[Scheduling] Invalid date format: ${fecha}`);
      return null;
    }

    // Crear fecha del evento
    let eventDate: Date;

    if (hora) {
      // Si hay hora, crear fecha con hora específica
      const [hours, minutes] = hora.split(':').map(Number);
      if (hours === undefined || minutes === undefined) {
        console.error(`[Scheduling] Invalid time format: ${hora}`);
        return null;
      }
      eventDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    } else {
      // Si no hay hora, usar las 09:00 como hora por defecto
      eventDate = new Date(year, month - 1, day, 9, 0, 0, 0);
    }

    // Calcular tiempo de antelación
    const advanceMs = getAdvanceTimeMs(tiempoAviso);
    if (advanceMs === 0) {
      console.error(`[Scheduling] Invalid advance time: ${tiempoAviso}`);
      return null;
    }

    // Calcular cuándo enviar la notificación
    const notificationTime = new Date(eventDate.getTime() - advanceMs);

    return notificationTime;
  } catch (error) {
    console.error(`[Scheduling] Error calculating notification time:`, error);
    return null;
  }
}

/**
 * Verifica si una notificación debería enviarse (no está en el pasado)
 *
 * @param notificationTime Cuándo se debe enviar la notificación
 * @returns true si la notificación es válida y debe programarse
 */
export function shouldSendNotification(notificationTime: Date): boolean {
  const now = new Date();

  // Verificar que no sea en el pasado (con margen de 5 minutos)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  if (notificationTime < fiveMinutesAgo) {
    console.log(`[Scheduling] Notification time ${notificationTime.toISOString()} is in the past`);
    return false;
  }

  return true;
}

/**
 * Formatea una fecha y hora para mostrar en notificación
 *
 * @param fecha Fecha (YYYY-MM-DD)
 * @param hora Hora (HH:MM) opcional
 * @returns String formateado (ej: "20 ene a las 15:30" o "20 ene")
 */
export function formatEventDateTime(fecha: string, hora?: string): string {
  try {
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const monthNames = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];

    const monthName = monthNames[date.getMonth()];
    const dayStr = day.toString();

    if (hora) {
      return `${dayStr} ${monthName} a las ${hora}`;
    }

    return `${dayStr} ${monthName}`;
  } catch (error) {
    console.error(`[Scheduling] Error formatting date:`, error);
    return fecha;
  }
}
