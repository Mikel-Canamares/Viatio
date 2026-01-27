/**
 * EVENTS CLOUD FUNCTIONS
 *
 * Funciones para enviar notificaciones programadas antes de eventos
 * personalizados de la agenda según las preferencias del usuario.
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { canSendNotification } from './utils/rateLimiter';
import { getUserNotificationPreferences, isInSilentPeriod } from './utils/preferences';
import { calculateNotificationTime, shouldSendNotification } from './utils/scheduling';

// Helper para obtener Firestore instance (lazy initialization)
const getDb = () => admin.firestore();

// Tipos
interface EventoPersonalizado {
  nombre: string;
  categoria: string;
  descripcion?: string;
  horaInicio?: string;
  ubicacion?: string;
  prioridad: 'alta' | 'media' | 'baja';
  completado: boolean;
  createdBy?: string;
  updatedBy?: string;
}

interface DiaViaje {
  fecha: string; // YYYY-MM-DD
  orden: number;
}

interface TripData {
  name?: string;
  destination?: string;
  memberUids?: string[];
  ownerId: string;
  shared?: boolean;
}

/**
 * Obtener emoji por prioridad
 */
function getPriorityEmoji(prioridad: 'alta' | 'media' | 'baja'): string {
  switch (prioridad) {
    case 'alta': return '🔴';
    case 'media': return '🟡';
    case 'baja': return '🟢';
    default: return '📌';
  }
}

/**
 * Trigger: Cuando se crea un evento personalizado en un viaje compartido
 */
export const onEventCreated = onDocumentCreated(
  'trips/{tripId}/days/{dayId}/events/{eventId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('[Events] No data in snapshot');
      return;
    }

    const evento = snapshot.data() as EventoPersonalizado;
    const tripId = event.params.tripId;
    const dayId = event.params.dayId;
    const eventId = event.params.eventId;

    console.log(`[Events] New event created: ${eventId} in trip ${tripId}, day ${dayId}`);

    try {
      // Obtener datos del viaje
      const tripDoc = await getDb().doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) {
        console.log(`[Events] Trip ${tripId} not found`);
        return;
      }

      const tripData = tripDoc.data() as TripData;

      // Si no es viaje compartido, no enviar notificación push
      if (!tripData.shared) {
        console.log(`[Events] Trip ${tripId} is not shared, skipping push notification`);
        return;
      }

      // Obtener fecha del día
      const dayDoc = await getDb().doc(`trips/${tripId}/days/${dayId}`).get();
      if (!dayDoc.exists) {
        console.log(`[Events] Day ${dayId} not found`);
        return;
      }

      const dayData = dayDoc.data() as DiaViaje;

      const memberUids = tripData.memberUids || [];
      const creatorUid = evento.createdBy || tripData.ownerId;

      // Notificar a todos excepto al creador
      const recipients = memberUids.filter(uid => uid !== creatorUid);

      if (recipients.length === 0) {
        console.log('[Events] No recipients to notify');
        return;
      }

      // Crear notificación para cada miembro
      const tripName = tripData.destination || tripData.name || 'tu viaje';
      const priorityEmoji = getPriorityEmoji(evento.prioridad);
      const title = `${priorityEmoji} Nuevo evento: ${evento.nombre}`;
      const body = `${tripName}${evento.ubicacion ? ` • ${evento.ubicacion}` : ''}`;

      const notificationPromises = recipients.map(async (uid) => {
        // Verificar preferencias
        const prefs = await getUserNotificationPreferences(uid);
        if (!prefs.notificacionesActivas || !prefs.recordatoriosViaje) {
          console.log(`[Events] User ${uid} has event notifications disabled`);
          return;
        }

        // Verificar rate limiting
        const { allowed, reason } = await canSendNotification(uid, tripId, 'event_added', eventId);
        if (!allowed) {
          console.log(`[Events] Notification blocked for ${uid}: ${reason}`);
          return;
        }

        // Crear notificación inmediata
        await createNotification(uid, 'event_added', title, body, {
          tripId,
          dayId,
          eventId,
          type: 'event_added',
        });

        // Programar recordatorio según preferencias (solo si tiene prioridad alta o media)
        if (evento.prioridad === 'alta' || evento.prioridad === 'media') {
          await scheduleEventReminder(
            uid,
            tripId,
            dayId,
            eventId,
            evento,
            dayData.fecha,
            prefs.tiempoAvisoViaje
          );
        }
      });

      await Promise.all(notificationPromises);

      console.log(`[Events] ✅ Notifications sent for new event ${eventId}`);
    } catch (error) {
      console.error(`[Events] ❌ Error processing event ${eventId}:`, error);
    }
  }
);

/**
 * Trigger: Cuando se actualiza un evento
 */
export const onEventUpdated = onDocumentUpdated(
  'trips/{tripId}/days/{dayId}/events/{eventId}',
  async (event) => {
    const before = event.data?.before.data() as EventoPersonalizado | undefined;
    const after = event.data?.after.data() as EventoPersonalizado | undefined;

    if (!before || !after) {
      console.log('[Events] Missing before/after data');
      return;
    }

    const tripId = event.params.tripId;
    const dayId = event.params.dayId;
    const eventId = event.params.eventId;

    // Solo notificar si cambió algo significativo (no solo marcar como completado)
    const significantChange =
      before.nombre !== after.nombre ||
      before.horaInicio !== after.horaInicio ||
      before.ubicacion !== after.ubicacion ||
      before.prioridad !== after.prioridad;

    if (!significantChange) {
      console.log(`[Events] No significant change in ${eventId}`);
      return;
    }

    console.log(`[Events] Event updated: ${eventId} in trip ${tripId}, day ${dayId}`);

    try {
      const tripDoc = await getDb().doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) return;

      const tripData = tripDoc.data() as TripData;
      if (!tripData.shared) return;

      const dayDoc = await getDb().doc(`trips/${tripId}/days/${dayId}`).get();
      if (!dayDoc.exists) return;

      const dayData = dayDoc.data() as DiaViaje;

      const memberUids = tripData.memberUids || [];
      const editorUid = after.updatedBy || tripData.ownerId;
      const recipients = memberUids.filter(uid => uid !== editorUid);

      if (recipients.length === 0) return;

      const tripName = tripData.destination || tripData.name || 'tu viaje';
      const priorityEmoji = getPriorityEmoji(after.prioridad);
      const title = `${priorityEmoji} Evento modificado: ${after.nombre}`;
      const body = `Actualizado en ${tripName}`;

      const notificationPromises = recipients.map(async (uid) => {
        const prefs = await getUserNotificationPreferences(uid);
        if (!prefs.notificacionesActivas || !prefs.recordatoriosViaje) return;

        const { allowed } = await canSendNotification(uid, tripId, 'event_updated', eventId);
        if (!allowed) return;

        await createNotification(uid, 'event_updated', title, body, {
          tripId,
          dayId,
          eventId,
          type: 'event_updated',
        });

        // Re-programar recordatorio si cambió la hora o prioridad
        if (before.horaInicio !== after.horaInicio || before.prioridad !== after.prioridad) {
          // Cancelar recordatorio anterior
          await cancelScheduledReminder(uid, eventId);
          // Programar nuevo recordatorio (solo prioridad alta/media)
          if (after.prioridad === 'alta' || after.prioridad === 'media') {
            await scheduleEventReminder(
              uid,
              tripId,
              dayId,
              eventId,
              after,
              dayData.fecha,
              prefs.tiempoAvisoViaje
            );
          }
        }
      });

      await Promise.all(notificationPromises);

      console.log(`[Events] ✅ Update notifications sent for ${eventId}`);
    } catch (error) {
      console.error(`[Events] ❌ Error processing update ${eventId}:`, error);
    }
  }
);

/**
 * Scheduled function: Verificar eventos próximos cada hora
 */
export const checkUpcomingEvents = onSchedule('every 1 hours', async () => {
  console.log('[Events] Checking upcoming events...');

  try {
    // Obtener todos los usuarios con notificaciones activas
    const usersSnapshot = await getDb().collection('users')
      .where('pushToken', '!=', null)
      .get();

    const checkPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const prefs = await getUserNotificationPreferences(userId);

      if (!prefs.notificacionesActivas || !prefs.recordatoriosViaje) {
        return;
      }

      // Verificar periodo de silencio
      if (isInSilentPeriod(prefs)) {
        console.log(`[Events] User ${userId} is in silent period`);
        return;
      }

      // Buscar recordatorios programados para este usuario que deban enviarse
      const now = admin.firestore.Timestamp.now();
      const remindersSnapshot = await getDb()
        .collection('scheduledNotifications')
        .where('userId', '==', userId)
        .where('type', '==', 'event_reminder')
        .where('scheduledFor', '<=', now)
        .where('sent', '==', false)
        .get();

      const sendPromises = remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminder = reminderDoc.data();

        try {
          // Crear notificación
          await createNotification(
            userId,
            'event_reminder',
            reminder.title,
            reminder.body,
            reminder.data
          );

          // Marcar como enviado
          await reminderDoc.ref.update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`[Events] ✅ Sent reminder for event ${reminder.data.eventId}`);
        } catch (error) {
          console.error(`[Events] Error sending reminder ${reminderDoc.id}:`, error);
        }
      });

      await Promise.all(sendPromises);
    });

    await Promise.all(checkPromises);

    console.log('[Events] ✅ Finished checking upcoming events');
  } catch (error) {
    console.error('[Events] ❌ Error checking upcoming events:', error);
  }
});

/**
 * Programar recordatorio de evento
 */
async function scheduleEventReminder(
  userId: string,
  tripId: string,
  dayId: string,
  eventId: string,
  evento: EventoPersonalizado,
  fecha: string, // YYYY-MM-DD del día
  tiempoAviso: string
): Promise<void> {
  if (tiempoAviso === 'disabled') {
    return;
  }

  // Calcular cuándo enviar la notificación
  const notificationTime = calculateNotificationTime(
    fecha,
    evento.horaInicio,
    tiempoAviso
  );

  if (!notificationTime || !shouldSendNotification(notificationTime)) {
    console.log(`[Events] Notification time ${notificationTime} is in the past or invalid`);
    return;
  }

  const priorityEmoji = getPriorityEmoji(evento.prioridad);
  const title = `${priorityEmoji} Recordatorio: ${evento.nombre}`;
  const timeLabel = tiempoAviso === '1h' ? '1 hora'
    : tiempoAviso === '3h' ? '3 horas'
    : tiempoAviso === '1d' ? '1 día'
    : tiempoAviso === '3d' ? '3 días'
    : '1 semana';
  const body = `Tu evento es en ${timeLabel}${evento.ubicacion ? ` • ${evento.ubicacion}` : ''}`;

  // Guardar en colección de notificaciones programadas
  await getDb().collection('scheduledNotifications').add({
    userId,
    type: 'event_reminder',
    scheduledFor: admin.firestore.Timestamp.fromDate(notificationTime),
    sent: false,
    title,
    body,
    data: {
      tripId,
      dayId,
      eventId,
      type: 'event_reminder',
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Events] Scheduled reminder for ${eventId} at ${notificationTime.toISOString()}`);
}

/**
 * Cancelar recordatorio programado
 */
async function cancelScheduledReminder(userId: string, eventId: string): Promise<void> {
  const remindersSnapshot = await getDb()
    .collection('scheduledNotifications')
    .where('userId', '==', userId)
    .where('data.eventId', '==', eventId)
    .where('sent', '==', false)
    .get();

  const deletePromises = remindersSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);

  console.log(`[Events] Cancelled ${remindersSnapshot.size} scheduled reminders for ${eventId}`);
}

/**
 * Crear notificación en Firestore
 */
async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, any>
): Promise<void> {
  const notifRef = getDb()
    .collection('notifications')
    .doc(userId)
    .collection('notifications')
    .doc();

  await notifRef.set({
    type,
    title,
    body,
    data: {
      ...data,
      entityId: data.eventId || data.reservationId,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  });

  console.log(`[Events] Created notification for user ${userId}: ${type}`);
}
