/**
 * RESERVATIONS CLOUD FUNCTIONS
 *
 * Funciones para enviar notificaciones programadas antes de reservas
 * según las preferencias del usuario.
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
interface Reserva {
  nombre: string;
  categoria: string;
  proveedor?: string;
  fechaInicio?: string;
  horaInicio?: string;
  ubicacion?: string;
  numeroConfirmacion?: string;
  precio?: number;
  moneda?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface TripData {
  name?: string;
  destination?: string;
  memberUids?: string[];
  ownerId: string;
  shared?: boolean;
}

/**
 * Trigger: Cuando se crea una reserva en un viaje compartido
 */
export const onReservationCreated = onDocumentCreated(
  'trips/{tripId}/reservations/{reservationId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('[Reservations] No data in snapshot');
      return;
    }

    const reserva = snapshot.data() as Reserva;
    const tripId = event.params.tripId;
    const reservationId = event.params.reservationId;

    console.log(`[Reservations] New reservation created: ${reservationId} in trip ${tripId}`);

    try {
      // Obtener datos del viaje
      const tripDoc = await getDb().doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) {
        console.log(`[Reservations] Trip ${tripId} not found`);
        return;
      }

      const tripData = tripDoc.data() as TripData;

      // Si no es viaje compartido, no enviar notificación push
      if (!tripData.shared) {
        console.log(`[Reservations] Trip ${tripId} is not shared, skipping push notification`);
        return;
      }

      const memberUids = tripData.memberUids || [];
      const creatorUid = reserva.createdBy || tripData.ownerId;

      // Notificar a todos excepto al creador
      const recipients = memberUids.filter(uid => uid !== creatorUid);

      if (recipients.length === 0) {
        console.log('[Reservations] No recipients to notify');
        return;
      }

      // Crear notificación para cada miembro
      const tripName = tripData.destination || tripData.name || 'tu viaje';
      const title = `📅 Nueva reserva: ${reserva.nombre}`;
      const body = reserva.proveedor
        ? `${reserva.proveedor} • ${tripName}`
        : tripName;

      const notificationPromises = recipients.map(async (uid) => {
        // Verificar preferencias
        const prefs = await getUserNotificationPreferences(uid);
        if (!prefs.notificacionesActivas || !prefs.actualizacionesReservas) {
          console.log(`[Reservations] User ${uid} has reservation notifications disabled`);
          return;
        }

        // Verificar rate limiting
        const { allowed, reason } = await canSendNotification(uid, tripId, 'reservation_added', reservationId);
        if (!allowed) {
          console.log(`[Reservations] Notification blocked for ${uid}: ${reason}`);
          return;
        }

        // Crear notificación inmediata
        await createNotification(uid, 'reservation_added', title, body, {
          tripId,
          reservationId,
          type: 'reservation_added',
        });

        // Programar recordatorio según preferencias
        await scheduleReservationReminder(uid, tripId, reservationId, reserva, prefs.tiempoAvisoReserva);
      });

      await Promise.all(notificationPromises);

      console.log(`[Reservations] ✅ Notifications sent for new reservation ${reservationId}`);
    } catch (error) {
      console.error(`[Reservations] ❌ Error processing reservation ${reservationId}:`, error);
    }
  }
);

/**
 * Trigger: Cuando se actualiza una reserva
 */
export const onReservationUpdated = onDocumentUpdated(
  'trips/{tripId}/reservations/{reservationId}',
  async (event) => {
    const before = event.data?.before.data() as Reserva | undefined;
    const after = event.data?.after.data() as Reserva | undefined;

    if (!before || !after) {
      console.log('[Reservations] Missing before/after data');
      return;
    }

    const tripId = event.params.tripId;
    const reservationId = event.params.reservationId;

    // Solo notificar si cambió algo significativo
    const significantChange =
      before.fechaInicio !== after.fechaInicio ||
      before.horaInicio !== after.horaInicio ||
      before.ubicacion !== after.ubicacion ||
      before.nombre !== after.nombre;

    if (!significantChange) {
      console.log(`[Reservations] No significant change in ${reservationId}`);
      return;
    }

    console.log(`[Reservations] Reservation updated: ${reservationId} in trip ${tripId}`);

    try {
      const tripDoc = await getDb().doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) return;

      const tripData = tripDoc.data() as TripData;
      if (!tripData.shared) return;

      const memberUids = tripData.memberUids || [];
      const editorUid = after.updatedBy || tripData.ownerId;
      const recipients = memberUids.filter(uid => uid !== editorUid);

      if (recipients.length === 0) return;

      const tripName = tripData.destination || tripData.name || 'tu viaje';
      const title = `✏️ Reserva modificada: ${after.nombre}`;
      const body = `Actualizada en ${tripName}`;

      const notificationPromises = recipients.map(async (uid) => {
        const prefs = await getUserNotificationPreferences(uid);
        if (!prefs.notificacionesActivas || !prefs.actualizacionesReservas) return;

        const { allowed } = await canSendNotification(uid, tripId, 'reservation_updated', reservationId);
        if (!allowed) return;

        await createNotification(uid, 'reservation_updated', title, body, {
          tripId,
          reservationId,
          type: 'reservation_updated',
        });

        // Re-programar recordatorio si cambió la fecha
        if (before.fechaInicio !== after.fechaInicio || before.horaInicio !== after.horaInicio) {
          // Cancelar recordatorio anterior
          await cancelScheduledReminder(uid, reservationId);
          // Programar nuevo recordatorio
          await scheduleReservationReminder(uid, tripId, reservationId, after, prefs.tiempoAvisoReserva);
        }
      });

      await Promise.all(notificationPromises);

      console.log(`[Reservations] ✅ Update notifications sent for ${reservationId}`);
    } catch (error) {
      console.error(`[Reservations] ❌ Error processing update ${reservationId}:`, error);
    }
  }
);

/**
 * Scheduled function: Verificar reservas próximas cada hora
 */
export const checkUpcomingReservations = onSchedule('every 1 hours', async () => {
  console.log('[Reservations] Checking upcoming reservations...');

  try {
    // Obtener todos los usuarios con notificaciones activas
    const usersSnapshot = await getDb().collection('users')
      .where('pushToken', '!=', null)
      .get();

    const checkPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const prefs = await getUserNotificationPreferences(userId);

      if (!prefs.notificacionesActivas || !prefs.actualizacionesReservas) {
        return;
      }

      // Verificar periodo de silencio
      if (isInSilentPeriod(prefs)) {
        console.log(`[Reservations] User ${userId} is in silent period`);
        return;
      }

      // Buscar recordatorios programados para este usuario que deban enviarse
      const now = admin.firestore.Timestamp.now();
      const remindersSnapshot = await getDb()
        .collection('scheduledNotifications')
        .where('userId', '==', userId)
        .where('type', '==', 'reservation_reminder')
        .where('scheduledFor', '<=', now)
        .where('sent', '==', false)
        .get();

      const sendPromises = remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminder = reminderDoc.data();

        try {
          // Crear notificación
          await createNotification(
            userId,
            'reservation_reminder',
            reminder.title,
            reminder.body,
            reminder.data
          );

          // Marcar como enviado
          await reminderDoc.ref.update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`[Reservations] ✅ Sent reminder for reservation ${reminder.data.reservationId}`);
        } catch (error) {
          console.error(`[Reservations] Error sending reminder ${reminderDoc.id}:`, error);
        }
      });

      await Promise.all(sendPromises);
    });

    await Promise.all(checkPromises);

    console.log('[Reservations] ✅ Finished checking upcoming reservations');
  } catch (error) {
    console.error('[Reservations] ❌ Error checking upcoming reservations:', error);
  }
});

/**
 * Programar recordatorio de reserva
 */
async function scheduleReservationReminder(
  userId: string,
  tripId: string,
  reservationId: string,
  reserva: Reserva,
  tiempoAviso: string
): Promise<void> {
  if (tiempoAviso === 'disabled' || !reserva.fechaInicio) {
    return;
  }

  // Calcular cuándo enviar la notificación
  const notificationTime = calculateNotificationTime(
    reserva.fechaInicio,
    reserva.horaInicio,
    tiempoAviso
  );

  if (!notificationTime || !shouldSendNotification(notificationTime)) {
    console.log(`[Reservations] Notification time ${notificationTime} is in the past or invalid`);
    return;
  }

  const title = `🔔 Recordatorio: ${reserva.nombre}`;
  const timeLabel = tiempoAviso === '1h' ? '1 hora'
    : tiempoAviso === '3h' ? '3 horas'
    : tiempoAviso === '1d' ? '1 día'
    : tiempoAviso === '3d' ? '3 días'
    : '1 semana';
  const body = `Tu reserva es en ${timeLabel}${reserva.ubicacion ? ` • ${reserva.ubicacion}` : ''}`;

  // Guardar en colección de notificaciones programadas
  await getDb().collection('scheduledNotifications').add({
    userId,
    type: 'reservation_reminder',
    scheduledFor: admin.firestore.Timestamp.fromDate(notificationTime),
    sent: false,
    title,
    body,
    data: {
      tripId,
      reservationId,
      type: 'reservation_reminder',
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Reservations] Scheduled reminder for ${reservationId} at ${notificationTime.toISOString()}`);
}

/**
 * Cancelar recordatorio programado
 */
async function cancelScheduledReminder(userId: string, reservationId: string): Promise<void> {
  const remindersSnapshot = await getDb()
    .collection('scheduledNotifications')
    .where('userId', '==', userId)
    .where('data.reservationId', '==', reservationId)
    .where('sent', '==', false)
    .get();

  const deletePromises = remindersSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);

  console.log(`[Reservations] Cancelled ${remindersSnapshot.size} scheduled reminders for ${reservationId}`);
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
      entityId: data.reservationId || data.eventId,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  });

  console.log(`[Reservations] Created notification for user ${userId}: ${type}`);
}
