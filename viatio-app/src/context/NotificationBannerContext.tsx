/**
 * NOTIFICATION BANNER CONTEXT
 *
 * Provider que gestiona los banners de notificaciones in-app.
 * Escucha notificaciones en primer plano y las muestra como banners animados.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import * as Notifications from 'expo-notifications';
import {
  InAppNotificationBanner,
  BannerNotification,
} from '@/components/InAppNotificationBanner';
import {
  navigateToNotification,
  ExtendedNotificationData,
} from '@/utils/notificationNavigation';
import {
  getPreferenciasNotificaciones,
  isInSilentHours,
} from '@/services/perfilService';

interface NotificationBannerContextType {
  showBanner: (notification: BannerNotification) => void;
  hideBanner: () => void;
}

const NotificationBannerContext = createContext<NotificationBannerContextType>({
  showBanner: () => {},
  hideBanner: () => {},
});

export function useNotificationBanner() {
  return useContext(NotificationBannerContext);
}

interface NotificationBannerProviderProps {
  children: React.ReactNode;
}

export function NotificationBannerProvider({
  children,
}: NotificationBannerProviderProps) {
  const [currentNotification, setCurrentNotification] =
    useState<BannerNotification | null>(null);
  const notificationQueue = useRef<BannerNotification[]>([]);
  const isShowingBanner = useRef(false);

  /**
   * Verifica si se deben mostrar notificaciones según preferencias
   */
  const shouldShowBanner = useCallback(async (): Promise<boolean> => {
    try {
      const prefs = await getPreferenciasNotificaciones();

      // Master switch
      if (!prefs.notificacionesActivas) return false;

      // Modo silencio total
      if (prefs.modoSilencio === 'all') return false;

      // Horario de silencio
      if (isInSilentHours(prefs.horarioSilencio)) return false;

      return true;
    } catch {
      return true; // En caso de error, mostrar
    }
  }, []);

  /**
   * Muestra el siguiente banner en la cola
   */
  const showNextBanner = useCallback(() => {
    if (notificationQueue.current.length > 0 && !isShowingBanner.current) {
      const next = notificationQueue.current.shift();
      if (next) {
        isShowingBanner.current = true;
        setCurrentNotification(next);
      }
    }
  }, []);

  /**
   * Añade un banner a la cola y lo muestra si no hay otro activo
   */
  const showBanner = useCallback(
    async (notification: BannerNotification) => {
      const canShow = await shouldShowBanner();
      if (!canShow) {
        console.log('[NotificationBanner] Banners desactivados por preferencias');
        return;
      }

      notificationQueue.current.push(notification);
      showNextBanner();
    },
    [shouldShowBanner, showNextBanner]
  );

  /**
   * Oculta el banner actual y muestra el siguiente si hay
   */
  const hideBanner = useCallback(() => {
    isShowingBanner.current = false;
    setCurrentNotification(null);

    // Mostrar siguiente después de un pequeño delay
    setTimeout(() => {
      showNextBanner();
    }, 300);
  }, [showNextBanner]);

  /**
   * Maneja el tap en el banner
   */
  const handleBannerPress = useCallback(
    (notification: BannerNotification) => {
      // Navegar según el tipo de notificación
      if (notification.data) {
        navigateToNotification(notification.data as ExtendedNotificationData);
      }
    },
    []
  );

  /**
   * Listener para notificaciones recibidas en primer plano
   */
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log('[NotificationBanner] Notification received in foreground');

        const { title, body, data } = notification.request.content;

        if (title) {
          await showBanner({
            id: notification.request.identifier,
            title: title || 'Nueva notificación',
            body: body || '',
            type: (data as any)?.type,
            data,
          });
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [showBanner]);

  return (
    <NotificationBannerContext.Provider value={{ showBanner, hideBanner }}>
      {children}
      <InAppNotificationBanner
        notification={currentNotification}
        onPress={handleBannerPress}
        onDismiss={hideBanner}
      />
    </NotificationBannerContext.Provider>
  );
}
