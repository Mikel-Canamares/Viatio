import { create } from 'zustand';
import {
  Notification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  cleanupExpiredNotifications,
} from '@/services/firestore/notificationsService';

interface NotificationsState {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Listener
  _unsubscribe: (() => void) | null;

  // Acciones
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  subscribe: () => void;
  unsubscribe: () => void;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  cleanupExpired: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  // Estado inicial
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  _unsubscribe: null,

  // ============================================
  // FETCH
  // ============================================

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await getMyNotifications(50);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await getUnreadCount();
      set({ unreadCount });
    } catch (error: any) {
      console.error('[Store] Error fetching unread count:', error);
    }
  },

  // ============================================
  // LISTENER EN TIEMPO REAL
  // ============================================

  subscribe: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) return; // Ya suscrito

    const unsubscribe = subscribeToNotifications(
      (notifications, unreadCount) => {
        set({ notifications, unreadCount });
      },
      (error) => {
        set({ error: error.message });
      }
    );

    set({ _unsubscribe: unsubscribe });
  },

  unsubscribe: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
      set({ _unsubscribe: null });
    }
  },

  // ============================================
  // ACCIONES
  // ============================================

  markAsRead: async (notificationId: string) => {
    try {
      const success = await markAsRead(notificationId);
      if (success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  markAllAsRead: async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const success = await deleteNotification(notificationId);
      if (success) {
        set((state) => {
          const deleted = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.filter(
              (n) => n.id !== notificationId
            ),
            unreadCount:
              deleted && !deleted.isRead
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      }
      return success;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  cleanupExpired: async () => {
    try {
      const deletedCount = await cleanupExpiredNotifications();
      console.log(`[Notifications] Cleaned up ${deletedCount} expired notifications`);
      // Refrescar después de limpiar
      await get().fetchNotifications();
    } catch (error: any) {
      console.error('[Store] Error cleaning up:', error);
    }
  },

  // ============================================
  // RESET
  // ============================================

  reset: () => {
    const { unsubscribe } = get();
    unsubscribe();
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    });
  },
}));
