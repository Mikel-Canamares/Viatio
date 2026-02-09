/**
 * RATE LIMITER
 *
 * Controla la cantidad de notificaciones enviadas por usuario/viaje
 * para evitar spam y optimizar costes de Firebase.
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// Límites configurables
const USER_DAILY_LIMIT = 50; // Máximo 50 notificaciones por usuario por día
const TRIP_DAILY_LIMIT = 30; // Máximo 30 notificaciones por viaje por día
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutos para deduplicación

/**
 * Obtiene la clave de fecha para hoy (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Verifica si se puede enviar una notificación a un usuario
 * Incrementa el contador si se puede
 */
export async function canSendToUser(userId: string): Promise<boolean> {
  const today = getTodayKey();
  const counterRef = db.doc(`notificationCounters/${userId}_${today}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);

      if (doc.exists) {
        const count = doc.data()?.count || 0;
        if (count >= USER_DAILY_LIMIT) {
          console.log(`[RateLimiter] User ${userId} reached daily limit (${count}/${USER_DAILY_LIMIT})`);
          return false;
        }
        transaction.update(counterRef, {
          count: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(counterRef, {
          userId,
          date: today,
          count: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return true;
    });

    return result;
  } catch (error) {
    console.error('[RateLimiter] Error checking user limit:', error);
    return true; // En caso de error, permitir (fail open)
  }
}

/**
 * Verifica si se puede enviar una notificación para un viaje
 */
export async function canSendForTrip(tripId: string): Promise<boolean> {
  const today = getTodayKey();
  const counterRef = db.doc(`notificationCounters/trip_${tripId}_${today}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);

      if (doc.exists) {
        const count = doc.data()?.count || 0;
        if (count >= TRIP_DAILY_LIMIT) {
          console.log(`[RateLimiter] Trip ${tripId} reached daily limit (${count}/${TRIP_DAILY_LIMIT})`);
          return false;
        }
        transaction.update(counterRef, {
          count: admin.firestore.FieldValue.increment(1),
        });
      } else {
        transaction.set(counterRef, {
          tripId,
          date: today,
          count: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return true;
    });

    return result;
  } catch (error) {
    console.error('[RateLimiter] Error checking trip limit:', error);
    return true;
  }
}

/**
 * Verifica si ya existe una notificación similar reciente (deduplicación)
 */
export async function isDuplicate(
  userId: string,
  type: string,
  entityId: string
): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - DEDUP_WINDOW_MS);

  try {
    const recentNotifs = await db
      .collection('notifications')
      .doc(userId)
      .collection('notifications')
      .where('type', '==', type)
      .where('data.entityId', '==', entityId)
      .where('createdAt', '>', fiveMinutesAgo)
      .limit(1)
      .get();

    if (!recentNotifs.empty) {
      console.log(`[RateLimiter] Duplicate notification found for ${type}:${entityId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[RateLimiter] Error checking duplicates:', error);
    return false;
  }
}

/**
 * Verifica todas las condiciones antes de enviar
 */
export async function canSendNotification(
  userId: string,
  tripId: string,
  type: string,
  entityId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Verificar límite de usuario
  const userAllowed = await canSendToUser(userId);
  if (!userAllowed) {
    return { allowed: false, reason: 'user_daily_limit' };
  }

  // 2. Verificar límite de viaje
  const tripAllowed = await canSendForTrip(tripId);
  if (!tripAllowed) {
    return { allowed: false, reason: 'trip_daily_limit' };
  }

  // 3. Verificar duplicados
  const duplicate = await isDuplicate(userId, type, entityId);
  if (duplicate) {
    return { allowed: false, reason: 'duplicate' };
  }

  return { allowed: true };
}

/**
 * Obtiene estadísticas de uso (para debugging)
 */
export async function getUsageStats(userId: string): Promise<{
  todayCount: number;
  limit: number;
  remaining: number;
}> {
  const today = getTodayKey();
  const counterRef = db.doc(`notificationCounters/${userId}_${today}`);

  try {
    const doc = await counterRef.get();
    const count = doc.exists ? doc.data()?.count || 0 : 0;

    return {
      todayCount: count,
      limit: USER_DAILY_LIMIT,
      remaining: Math.max(0, USER_DAILY_LIMIT - count),
    };
  } catch (error) {
    console.error('[RateLimiter] Error getting stats:', error);
    return { todayCount: 0, limit: USER_DAILY_LIMIT, remaining: USER_DAILY_LIMIT };
  }
}
