import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

// ============================================
// TIPOS
// ============================================

export type NotificationType =
  | 'trip_invite'
  | 'invite_accepted'
  | 'invite_rejected'
  | 'member_joined'
  | 'member_left'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_requested'
  | 'settlement_completed'
  | 'trip_updated'
  | 'trip_deleted'
  | 'role_changed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  data: Record<string, any>;
  expiresAt: Date | null;
}

// ============================================
// CREAR NOTIFICACIÓN
// ============================================

/**
 * Crear una notificación para un usuario
 */
export async function createNotification(
  userId: string,
  notification: {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    expiresInDays?: number; // null = no expira
  }
): Promise<string | null> {
  try {
    const notifRef = collection(db, 'notifications', userId, 'notifications');

    const expiresAt = notification.expiresInDays
      ? Timestamp.fromDate(
          new Date(Date.now() + notification.expiresInDays * 24 * 60 * 60 * 1000)
        )
      : null;

    const docRef = await addDoc(notifRef, {
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: false,
      createdAt: serverTimestamp(),
      data: notification.data || {},
      expiresAt,
    });

    return docRef.id;
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    return null;
  }
}

/**
 * Crear notificaciones para múltiples usuarios (batch)
 */
export async function createNotificationsForUsers(
  userIds: string[],
  notification: {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    expiresInDays?: number;
  }
): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    const expiresAt = notification.expiresInDays
      ? Timestamp.fromDate(
          new Date(Date.now() + notification.expiresInDays * 24 * 60 * 60 * 1000)
        )
      : null;

    userIds.forEach((userId) => {
      const notifRef = doc(
        collection(db, 'notifications', userId, 'notifications')
      );
      batch.set(notifRef, {
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        isRead: false,
        createdAt: serverTimestamp(),
        data: notification.data || {},
        expiresAt,
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('[Notifications] Error creating batch notifications:', error);
    return false;
  }
}

// ============================================
// OBTENER NOTIFICACIONES
// ============================================

/**
 * Obtener notificaciones del usuario actual (con paginación)
 */
export async function getMyNotifications(
  limitCount: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const notifRef = collection(db, 'notifications', user.uid, 'notifications');

    let q = query(notifRef, orderBy('createdAt', 'desc'), limit(limitCount));

    if (unreadOnly) {
      q = query(
        notifRef,
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      expiresAt: docSnap.data().expiresAt?.toDate() || null,
    })) as Notification[];
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    return [];
  }
}

/**
 * Obtener contador de notificaciones sin leer
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const notifRef = collection(db, 'notifications', user.uid, 'notifications');
    const q = query(notifRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);

    return snapshot.size;
  } catch (error) {
    console.error('[Notifications] Error getting unread count:', error);
    return 0;
  }
}

// ============================================
// MARCAR COMO LEÍDA
// ============================================

/**
 * Marcar notificación como leída
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const notifRef = doc(
      db,
      'notifications',
      user.uid,
      'notifications',
      notificationId
    );
    await updateDoc(notifRef, { isRead: true });
    return true;
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    return false;
  }
}

/**
 * Marcar todas como leídas
 */
export async function markAllAsRead(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const notifRef = collection(db, 'notifications', user.uid, 'notifications');
    const q = query(notifRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    return false;
  }
}

// ============================================
// LISTENER EN TIEMPO REAL
// ============================================

/**
 * Suscribirse a notificaciones en tiempo real
 */
export function subscribeToNotifications(
  onUpdate: (notifications: Notification[], unreadCount: number) => void,
  onError?: (error: Error) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    console.warn('[Notifications] No authenticated user');
    return () => {};
  }

  const notifRef = collection(db, 'notifications', user.uid, 'notifications');
  const q = query(notifRef, orderBy('createdAt', 'desc'), limit(50));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        expiresAt: docSnap.data().expiresAt?.toDate() || null,
      })) as Notification[];

      const unreadCount = notifications.filter((n) => !n.isRead).length;
      onUpdate(notifications, unreadCount);
    },
    (error) => {
      console.error('[Notifications] Snapshot error:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}

// ============================================
// LIMPIEZA
// ============================================

/**
 * Eliminar notificación
 */
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const notifRef = doc(
      db,
      'notifications',
      user.uid,
      'notifications',
      notificationId
    );
    await deleteDoc(notifRef);
    return true;
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    return false;
  }
}

/**
 * Limpiar notificaciones expiradas (ejecutar periódicamente)
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const notifRef = collection(db, 'notifications', user.uid, 'notifications');
    const q = query(notifRef, where('expiresAt', '<=', Timestamp.now()));

    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('[Notifications] Error cleaning up notifications:', error);
    return 0;
  }
}
