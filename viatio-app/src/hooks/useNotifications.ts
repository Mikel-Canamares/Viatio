import { useEffect } from 'react';
import { useNotificationsStore } from '@/store/notificationsStore';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook para suscribirse automáticamente a notificaciones
 * Usar en el componente raíz de la app (RootNavigator)
 */
export function useNotifications() {
  const { user } = useAuth();
  const { subscribe, unsubscribe, cleanupExpired } = useNotificationsStore();

  useEffect(() => {
    if (user) {
      // Suscribir a notificaciones en tiempo real
      subscribe();

      // Limpiar notificaciones expiradas al login
      cleanupExpired();
    } else {
      // Desuscribir cuando no hay usuario
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [user]);
}
