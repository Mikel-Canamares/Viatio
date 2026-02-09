/**
 * FIREBASE CLOUD FUNCTIONS - VIATIO
 *
 * Funciones serverless para:
 * - Enviar notificaciones push cuando se crean en Firestore
 * - Notificar cambios en gastos compartidos
 * - Notificar liquidaciones
 * - Limpiar tokens inactivos
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

// Inicializar Firebase Admin
admin.initializeApp();

// Inicializar Expo SDK
const expo = new Expo();

// Re-exportar funciones de gastos, liquidaciones, viajes, reservas, eventos y cleanup
export { onExpenseCreated, onExpenseUpdated, onExpenseDeleted } from './expenses';
export { onSettlementCreated, onSettlementUpdated } from './settlements';
export { onTripDeleted } from './trips';
export { onReservationCreated, onReservationUpdated, checkUpcomingReservations } from './reservations';
export { onEventCreated, onEventUpdated, checkUpcomingEvents } from './events';
export { cleanupInactiveTokens, cleanupRateLimitCounters, cleanupExpiredNotifications } from './cleanup';

/**
 * Cloud Function que envía push notification cuando se crea una notificación en Firestore
 * Trigger: firestore.document('notifications/{userId}/notifications/{notificationId}').onCreate
 */
export const sendPushNotification = onDocumentCreated(
  'notifications/{userId}/notifications/{notificationId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('[Push] No data in snapshot');
      return;
    }

    const notification = snapshot.data();
    const userId = event.params.userId;
    const notificationId = event.params.notificationId;

    console.log(`[Push] Procesando notificación para user ${userId}, notification ${notificationId}`);

    try {
      // Obtener push token del usuario desde Firestore
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();

      if (!userDoc.exists) {
        console.log(`[Push] Usuario ${userId} no encontrado en Firestore`);
        return;
      }

      const userData = userDoc.data();

      if (!userData || !userData.pushToken) {
        console.log(`[Push] Usuario ${userId} no tiene push token registrado`);
        return;
      }

      const pushToken = userData.pushToken;

      // Validar que sea un token válido de Expo
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`[Push] Token inválido para user ${userId}: ${pushToken}`);
        // Opcional: Limpiar token inválido
        await userDoc.ref.update({
          pushToken: null,
          pushTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      console.log(`[Push] Enviando push a token: ${pushToken.substring(0, 20)}...`);

      // Crear mensaje de push
      const message: ExpoPushMessage = {
        to: pushToken,
        title: notification.title || 'Nueva notificación',
        body: notification.body || '',
        data: notification.data || {},
        sound: 'default',
        priority: 'high',
        channelId: 'default', // Android channel
      };

      // Enviar notificación usando Expo SDK
      const chunks = expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log(`[Push] Tickets recibidos:`, ticketChunk);
        } catch (error) {
          console.error('[Push] Error enviando chunk de notificaciones:', error);
        }
      }

      // Guardar tickets en la notificación para tracking
      await snapshot.ref.update({
        pushSent: true,
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(),
        pushTickets: tickets,
      });

      console.log(`[Push] ✅ Push notification enviada exitosamente a user ${userId}`);
      console.log(`[Push] Tickets:`, tickets);

    } catch (error) {
      console.error(`[Push] ❌ Error en sendPushNotification para user ${userId}:`, error);

      // Guardar error en la notificación para debugging
      await snapshot.ref.update({
        pushSent: false,
        pushError: error instanceof Error ? error.message : String(error),
        pushErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

/**
 * Cloud Function para verificar receipts de notificaciones enviadas
 * (Opcional) Se ejecuta periódicamente para verificar qué notificaciones fueron entregadas
 */
export const checkPushReceipts = onSchedule('every 24 hours', async () => {
  console.log('[Push] Verificando receipts de notificaciones...');

  // TODO: Implementar verificación de receipts si se necesita tracking avanzado
  // Por ahora solo logging

  console.log('[Push] Verificación de receipts completada');
});
