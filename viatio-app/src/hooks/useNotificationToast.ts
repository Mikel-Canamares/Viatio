/**
 * USE NOTIFICATION TOAST HOOK
 *
 * Hook que muestra un toast cuando llegan notificaciones nuevas.
 * Se activa automáticamente en RootNavigator para mostrar
 * notificaciones en tiempo real mientras el usuario usa la app.
 */

import { useEffect, useRef } from 'react';
import { useNotificationsStore } from '@/store/notificationsStore';
import { showToast } from '@/utils/toast';

export function useNotificationToast() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const previousCountRef = useRef(0);

  useEffect(() => {
    const currentCount = notifications.length;

    // Solo mostrar toast si aumentó el contador (nueva notificación)
    if (currentCount > previousCountRef.current && previousCountRef.current > 0) {
      const latestNotification = notifications[0];

      // Mostrar solo si es no leída
      if (latestNotification && !latestNotification.isRead) {
        showToast.info(latestNotification.title, latestNotification.body);
      }
    }

    previousCountRef.current = currentCount;
  }, [notifications]);
}
