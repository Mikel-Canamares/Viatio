/**
 * CLEANUP CLOUD FUNCTIONS
 *
 * Funciones de mantenimiento para:
 * - Limpiar tokens de push inactivos
 * - Limpiar contadores de rate limiting antiguos
 * - Limpiar notificaciones expiradas
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Limpia tokens de push que no se han actualizado en más de 30 días
 * Se ejecuta cada domingo a las 3:00 AM
 */
export const cleanupInactiveTokens = onSchedule(
  {
    schedule: 'every sunday 03:00',
    timeZone: 'Europe/Madrid',
  },
  async () => {
    console.log('[Cleanup] Starting inactive tokens cleanup...');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Buscar usuarios con tokens antiguos
      const usersSnapshot = await db
        .collection('users')
        .where('pushToken', '!=', null)
        .where('pushTokenUpdatedAt', '<', thirtyDaysAgo)
        .limit(500) // Procesar en batches
        .get();

      if (usersSnapshot.empty) {
        console.log('[Cleanup] No inactive tokens found');
        return;
      }

      console.log(`[Cleanup] Found ${usersSnapshot.size} inactive tokens`);

      // Limpiar en batches de 500
      const batch = db.batch();
      let count = 0;

      usersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          pushToken: null,
          pushTokenCleanedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      });

      await batch.commit();

      console.log(`[Cleanup] ✅ Cleaned up ${count} inactive tokens`);
    } catch (error) {
      console.error('[Cleanup] ❌ Error cleaning inactive tokens:', error);
    }
  }
);

/**
 * Limpia contadores de rate limiting de días anteriores
 * Se ejecuta cada día a las 4:00 AM
 */
export const cleanupRateLimitCounters = onSchedule(
  {
    schedule: 'every day 04:00',
    timeZone: 'Europe/Madrid',
  },
  async () => {
    console.log('[Cleanup] Starting rate limit counters cleanup...');

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    try {
      // Buscar contadores antiguos
      const countersSnapshot = await db
        .collection('notificationCounters')
        .where('createdAt', '<', twoDaysAgo)
        .limit(500)
        .get();

      if (countersSnapshot.empty) {
        console.log('[Cleanup] No old counters found');
        return;
      }

      console.log(`[Cleanup] Found ${countersSnapshot.size} old counters`);

      const batch = db.batch();
      countersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`[Cleanup] ✅ Deleted ${countersSnapshot.size} old counters`);
    } catch (error) {
      console.error('[Cleanup] ❌ Error cleaning counters:', error);
    }
  }
);

/**
 * Limpia notificaciones expiradas (más de 30 días)
 * Se ejecuta cada lunes a las 5:00 AM
 */
export const cleanupExpiredNotifications = onSchedule(
  {
    schedule: 'every monday 05:00',
    timeZone: 'Europe/Madrid',
  },
  async () => {
    console.log('[Cleanup] Starting expired notifications cleanup...');

    const now = new Date();

    try {
      // Obtener todos los usuarios con notificaciones
      const usersSnapshot = await db.collection('notifications').listDocuments();

      let totalDeleted = 0;

      for (const userDoc of usersSnapshot) {
        // Buscar notificaciones expiradas de este usuario
        const expiredSnapshot = await userDoc
          .collection('notifications')
          .where('expiresAt', '<', now)
          .limit(100)
          .get();

        if (!expiredSnapshot.empty) {
          const batch = db.batch();
          expiredSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          totalDeleted += expiredSnapshot.size;
        }
      }

      console.log(`[Cleanup] ✅ Deleted ${totalDeleted} expired notifications`);
    } catch (error) {
      console.error('[Cleanup] ❌ Error cleaning notifications:', error);
    }
  }
);
