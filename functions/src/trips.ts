/**
 * TRIPS CLOUD FUNCTIONS
 *
 * Cloud Functions relacionadas con el ciclo de vida de viajes compartidos.
 * Incluye limpieza de notificaciones cuando se elimina un viaje.
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Trigger que se ejecuta cuando un viaje es eliminado (soft delete)
 * Limpia todas las notificaciones relacionadas con el viaje para todos los miembros
 *
 * @trigger onDocumentUpdated('trips/{tripId}')
 *
 * Flujo:
 * 1. Detecta cambio de deletedAt: null → timestamp (soft delete)
 * 2. Para cada miembro del viaje:
 *    a. Busca notificaciones con data.tripId = tripId
 *    b. Elimina todas las notificaciones en batch
 * 3. Logs de totales eliminados
 *
 * Casos manejados:
 * - Viajes sin notificaciones (no falla)
 * - Viajes con muchos miembros (procesa uno a uno)
 * - Reintentos (idempotente, query garantiza solo eliminar notificaciones relevantes)
 */
export const onTripDeleted = onDocumentUpdated(
  'trips/{tripId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      console.log('[Trips] Missing data in event, skipping');
      return;
    }

    // Detectar soft delete (deletedAt cambió de null a timestamp)
    const wasDeleted = !beforeData.deletedAt && afterData.deletedAt;

    if (!wasDeleted) {
      // No es una eliminación, skip
      return;
    }

    const tripId = event.params.tripId;
    const memberUids = afterData.memberUids as string[];

    console.log(`[Trips] Trip soft-deleted: ${tripId}, cleaning notifications for ${memberUids.length} members`);

    try {
      let totalDeleted = 0;

      // Para cada miembro del viaje
      for (const userId of memberUids) {
        try {
          const notificationsRef = db.collection(`notifications/${userId}/notifications`);

          // Buscar notificaciones relacionadas con este viaje
          const snapshot = await notificationsRef
            .where('data.tripId', '==', tripId)
            .get();

          if (snapshot.empty) {
            console.log(`[Trips] No notifications found for user ${userId} in trip ${tripId}`);
            continue;
          }

          // Eliminar en batch (max 500 ops por batch en Firestore)
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          await batch.commit();
          totalDeleted += snapshot.size;

          console.log(`[Trips] Deleted ${snapshot.size} notifications for user ${userId}`);
        } catch (userError) {
          // No fallar todo el proceso si un usuario falla
          console.error(`[Trips] Error cleaning notifications for user ${userId}:`, userError);
        }
      }

      console.log(`[Trips] ✅ Total notifications deleted: ${totalDeleted} for trip ${tripId}`);
    } catch (error) {
      console.error(`[Trips] ❌ Error cleaning notifications for trip ${tripId}:`, error);
      // No lanzar error para permitir reintentos automáticos de Firebase
    }
  }
);
