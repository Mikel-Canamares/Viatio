/**
 * EXPENSES CLOUD FUNCTIONS
 *
 * Funciones que envían notificaciones push cuando hay cambios
 * en gastos compartidos.
 */

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { canSendNotification } from './utils/rateLimiter';

const db = admin.firestore();

// Tipos de notificación
type NotificationType = 'expense_added' | 'expense_updated' | 'expense_deleted';

interface ExpenseData {
  description: string;
  amount: number; // En céntimos
  currency: string;
  paidByUid: string;
  paidByName: string;
  category?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface TripData {
  name?: string;
  destination?: string;
  memberUids: string[];
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
 * Obtiene las preferencias de notificación de un usuario desde Firestore
 * (Versión simplificada - las preferencias detalladas están en la app)
 */
async function getUserNotificationPrefs(userId: string): Promise<{ enabled: boolean }> {
  try {
    // Por ahora, asumimos que si el usuario tiene token, quiere notificaciones
    // Las preferencias granulares se manejan en la app antes de mostrar
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    return {
      enabled: !!userData?.pushToken,
    };
  } catch (error) {
    console.error(`[Expenses] Error getting prefs for ${userId}:`, error);
    return { enabled: false };
  }
}

/**
 * Crea una notificación en Firestore para un usuario
 * (El trigger sendPushNotification en index.ts la enviará)
 */
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any>
): Promise<void> {
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
      entityId: data.expenseId || data.tripId,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  });

  console.log(`[Expenses] Created notification for user ${userId}: ${type}`);
}

/**
 * Notifica a los miembros de un viaje sobre un nuevo gasto
 */
async function notifyMembers(
  tripId: string,
  tripData: TripData,
  expense: ExpenseData,
  expenseId: string,
  type: NotificationType,
  excludeUid?: string
): Promise<void> {
  const memberUids = tripData.memberUids || [];

  // Filtrar al creador/editor
  const recipients = memberUids.filter(uid => uid !== excludeUid);

  if (recipients.length === 0) {
    console.log('[Expenses] No recipients to notify');
    return;
  }

  // Generar título y body según tipo
  let title: string;
  let body: string;

  const tripName = tripData.destination || tripData.name || 'tu viaje';
  const amountStr = formatAmount(expense.amount, expense.currency);

  switch (type) {
    case 'expense_added':
      title = `💸 Nuevo gasto: ${expense.description}`;
      body = `${expense.paidByName} pagó ${amountStr} en ${tripName}`;
      break;
    case 'expense_updated':
      title = `✏️ Gasto editado: ${expense.description}`;
      body = `${expense.paidByName} modificó un gasto de ${amountStr}`;
      break;
    case 'expense_deleted':
      title = `🗑️ Gasto eliminado`;
      body = `Se eliminó "${expense.description}" de ${tripName}`;
      break;
  }

  // Crear notificaciones para cada miembro
  const notificationPromises = recipients.map(async (uid) => {
    // Verificar preferencias
    const prefs = await getUserNotificationPrefs(uid);
    if (!prefs.enabled) {
      console.log(`[Expenses] User ${uid} has notifications disabled`);
      return;
    }

    // Verificar rate limiting y deduplicación
    const { allowed, reason } = await canSendNotification(uid, tripId, type, expenseId);
    if (!allowed) {
      console.log(`[Expenses] Notification blocked for ${uid}: ${reason}`);
      return;
    }

    // Crear notificación
    await createNotification(uid, type, title, body, {
      tripId,
      expenseId,
      type,
    });
  });

  await Promise.all(notificationPromises);
}

/**
 * Trigger: Cuando se crea un nuevo gasto compartido
 */
export const onExpenseCreated = onDocumentCreated(
  'trips/{tripId}/expenses/{expenseId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('[Expenses] No data in snapshot');
      return;
    }

    const expense = snapshot.data() as ExpenseData;
    const tripId = event.params.tripId;
    const expenseId = event.params.expenseId;

    console.log(`[Expenses] New expense created: ${expenseId} in trip ${tripId}`);

    try {
      // Obtener datos del viaje
      const tripDoc = await db.doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) {
        console.log(`[Expenses] Trip ${tripId} not found`);
        return;
      }

      const tripData = tripDoc.data() as TripData;

      // Notificar a todos excepto al creador
      await notifyMembers(
        tripId,
        tripData,
        expense,
        expenseId,
        'expense_added',
        expense.createdBy || expense.paidByUid
      );

      console.log(`[Expenses] ✅ Notifications sent for new expense ${expenseId}`);
    } catch (error) {
      console.error(`[Expenses] ❌ Error processing expense ${expenseId}:`, error);
    }
  }
);

/**
 * Trigger: Cuando se actualiza un gasto compartido
 */
export const onExpenseUpdated = onDocumentUpdated(
  'trips/{tripId}/expenses/{expenseId}',
  async (event) => {
    const before = event.data?.before.data() as ExpenseData | undefined;
    const after = event.data?.after.data() as ExpenseData | undefined;

    if (!before || !after) {
      console.log('[Expenses] Missing before/after data');
      return;
    }

    const tripId = event.params.tripId;
    const expenseId = event.params.expenseId;

    // Solo notificar si cambió algo significativo (monto, descripción)
    const significantChange =
      before.amount !== after.amount ||
      before.description !== after.description ||
      before.paidByUid !== after.paidByUid;

    if (!significantChange) {
      console.log(`[Expenses] No significant change in ${expenseId}`);
      return;
    }

    console.log(`[Expenses] Expense updated: ${expenseId} in trip ${tripId}`);

    try {
      const tripDoc = await db.doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) return;

      const tripData = tripDoc.data() as TripData;

      await notifyMembers(
        tripId,
        tripData,
        after,
        expenseId,
        'expense_updated',
        after.updatedBy || after.paidByUid
      );

      console.log(`[Expenses] ✅ Update notifications sent for ${expenseId}`);
    } catch (error) {
      console.error(`[Expenses] ❌ Error processing update ${expenseId}:`, error);
    }
  }
);

/**
 * Trigger: Cuando se elimina un gasto compartido
 */
export const onExpenseDeleted = onDocumentDeleted(
  'trips/{tripId}/expenses/{expenseId}',
  async (event) => {
    const deletedData = event.data?.data() as ExpenseData | undefined;
    if (!deletedData) {
      console.log('[Expenses] No data in deleted document');
      return;
    }

    const tripId = event.params.tripId;
    const expenseId = event.params.expenseId;

    console.log(`[Expenses] Expense deleted: ${expenseId} from trip ${tripId}`);

    try {
      const tripDoc = await db.doc(`trips/${tripId}`).get();
      if (!tripDoc.exists) return;

      const tripData = tripDoc.data() as TripData;

      // Notificar a todos los miembros (el que eliminó probablemente sea el mismo usuario)
      await notifyMembers(
        tripId,
        tripData,
        deletedData,
        expenseId,
        'expense_deleted',
        deletedData.paidByUid // Asumir que quien pagó es quien elimina
      );

      console.log(`[Expenses] ✅ Delete notifications sent for ${expenseId}`);
    } catch (error) {
      console.error(`[Expenses] ❌ Error processing delete ${expenseId}:`, error);
    }
  }
);
