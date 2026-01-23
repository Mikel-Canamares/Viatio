/**
 * SETTLEMENTS CLOUD FUNCTIONS
 *
 * Funciones que envían notificaciones push cuando hay cambios
 * en liquidaciones de gastos compartidos.
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { canSendNotification } from './utils/rateLimiter';

const db = admin.firestore();

interface SettlementData {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number; // En céntimos
  currency: string;
  status: 'pending' | 'completed';
  createdBy?: string;
  completedAt?: admin.firestore.Timestamp;
}

/**
 * Formatea un monto en céntimos a string con moneda
 */
function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    MXN: '$',
    ARS: '$',
    COP: '$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Crea una notificación en Firestore
 */
async function createNotification(
  userId: string,
  type: 'settlement_requested' | 'settlement_completed',
  title: string,
  body: string,
  data: Record<string, any>
): Promise<void> {
  // Verificar que el usuario tiene push token
  const userDoc = await db.doc(`users/${userId}`).get();
  if (!userDoc.exists || !userDoc.data()?.pushToken) {
    console.log(`[Settlements] User ${userId} has no push token`);
    return;
  }

  const notifRef = db
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
      entityId: data.settlementId,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  console.log(`[Settlements] Created notification for user ${userId}: ${type}`);
}

/**
 * Trigger: Cuando se crea una nueva liquidación (solicitud de pago)
 */
export const onSettlementCreated = onDocumentCreated(
  'trips/{tripId}/settlements/{settlementId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const settlement = snapshot.data() as SettlementData;
    const tripId = event.params.tripId;
    const settlementId = event.params.settlementId;

    console.log(`[Settlements] New settlement created: ${settlementId}`);

    // Solo notificar si es pending (solicitud de pago)
    if (settlement.status !== 'pending') {
      console.log(`[Settlements] Settlement ${settlementId} is not pending, skipping`);
      return;
    }

    try {
      // Verificar rate limiting
      const { allowed, reason } = await canSendNotification(
        settlement.fromUid,
        tripId,
        'settlement_requested',
        settlementId
      );

      if (!allowed) {
        console.log(`[Settlements] Notification blocked: ${reason}`);
        return;
      }

      const amountStr = formatAmount(settlement.amount, settlement.currency);

      // Notificar al deudor (fromUid - quien debe pagar)
      await createNotification(
        settlement.fromUid,
        'settlement_requested',
        `💳 Solicitud de pago`,
        `${settlement.toName} te solicita ${amountStr}`,
        {
          tripId,
          settlementId,
          type: 'settlement_requested',
          amount: settlement.amount,
          currency: settlement.currency,
          fromUid: settlement.fromUid,
          toUid: settlement.toUid,
        }
      );

      console.log(`[Settlements] ✅ Notification sent to ${settlement.fromUid}`);
    } catch (error) {
      console.error(`[Settlements] ❌ Error:`, error);
    }
  }
);

/**
 * Trigger: Cuando se actualiza una liquidación (marcada como completada)
 */
export const onSettlementUpdated = onDocumentUpdated(
  'trips/{tripId}/settlements/{settlementId}',
  async (event) => {
    const before = event.data?.before.data() as SettlementData | undefined;
    const after = event.data?.after.data() as SettlementData | undefined;

    if (!before || !after) return;

    const tripId = event.params.tripId;
    const settlementId = event.params.settlementId;

    // Solo notificar si cambió de pending a completed
    if (before.status === 'pending' && after.status === 'completed') {
      console.log(`[Settlements] Settlement ${settlementId} completed`);

      try {
        // Verificar rate limiting
        const { allowed, reason } = await canSendNotification(
          after.toUid,
          tripId,
          'settlement_completed',
          settlementId
        );

        if (!allowed) {
          console.log(`[Settlements] Notification blocked: ${reason}`);
          return;
        }

        const amountStr = formatAmount(after.amount, after.currency);

        // Notificar al acreedor (toUid - quien recibe el pago)
        await createNotification(
          after.toUid,
          'settlement_completed',
          `✅ Pago recibido`,
          `${after.fromName} te ha pagado ${amountStr}`,
          {
            tripId,
            settlementId,
            type: 'settlement_completed',
            amount: after.amount,
            currency: after.currency,
            fromUid: after.fromUid,
            toUid: after.toUid,
          }
        );

        console.log(`[Settlements] ✅ Completion notification sent to ${after.toUid}`);
      } catch (error) {
        console.error(`[Settlements] ❌ Error:`, error);
      }
    }
  }
);
