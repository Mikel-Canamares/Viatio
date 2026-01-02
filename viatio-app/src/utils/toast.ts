/**
 * TOAST UTILITIES
 *
 * Utilidades para mostrar notificaciones tipo toast al usuario.
 * Por ahora usa Alert nativo, se puede reemplazar por una librería de toasts.
 */

import { Alert, Platform, ToastAndroid } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: 'short' | 'long';
}

/**
 * Muestra un toast/notificación al usuario
 */
function show(
  type: ToastType,
  title: string,
  message?: string,
  options?: ToastOptions
) {
  // En Android, para mensajes simples sin título, usamos ToastAndroid
  if (Platform.OS === 'android' && !message && type !== 'error') {
    ToastAndroid.show(
      title,
      options?.duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT
    );
    return;
  }

  // Para errores o iOS, usamos Alert
  const alertTitle = type === 'error' ? `❌ ${title}` : title;
  Alert.alert(alertTitle, message || undefined, [{ text: 'OK' }]);
}

/**
 * Toast de éxito
 */
function success(title: string, message?: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      message ? `${title}: ${message}` : title,
      ToastAndroid.SHORT
    );
  } else {
    Alert.alert(`✅ ${title}`, message);
  }
}

/**
 * Toast de error
 */
function error(title: string, message?: string) {
  Alert.alert(`❌ ${title}`, message || undefined, [{ text: 'OK' }]);
}

/**
 * Toast informativo
 */
function info(title: string, message?: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      message ? `${title}: ${message}` : title,
      ToastAndroid.SHORT
    );
  } else {
    Alert.alert(`ℹ️ ${title}`, message);
  }
}

/**
 * Toast de advertencia
 */
function warning(title: string, message?: string) {
  Alert.alert(`⚠️ ${title}`, message || undefined, [{ text: 'OK' }]);
}

export const showToast = {
  show,
  success,
  error,
  info,
  warning,
};
