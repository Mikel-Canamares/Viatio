/**
 * TOAST UTILITIES
 *
 * Utilidades para mostrar notificaciones modales al usuario.
 * Usa CustomModal para una experiencia visual coherente con el diseño de la app.
 */

import { Platform, ToastAndroid } from 'react-native';
import { ModalType } from '@/components/CustomModal';

type ToastType = ModalType;

interface ToastOptions {
  duration?: 'short' | 'long';
}

// Interfaz para el evento global de modal
export interface ModalEvent {
  type: ToastType;
  title: string;
  message?: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

// Lista de listeners para el modal
const modalListeners: Array<(event: ModalEvent) => void> = [];

/**
 * Suscribe un listener para eventos de modal
 */
export function subscribeToModal(listener: (event: ModalEvent) => void) {
  modalListeners.push(listener);
  return () => {
    const index = modalListeners.indexOf(listener);
    if (index > -1) {
      modalListeners.splice(index, 1);
    }
  };
}

/**
 * Emite un evento de modal a todos los listeners
 */
function emitModal(event: ModalEvent) {
  modalListeners.forEach((listener) => listener(event));
}

/**
 * Muestra un modal/notificación al usuario
 */
function show(
  type: ToastType,
  title: string,
  message?: string,
  options?: ToastOptions
) {
  // En Android, para mensajes simples sin título y tipo info/success, usamos ToastAndroid
  if (
    Platform.OS === 'android' &&
    !message &&
    (type === 'info' || type === 'success')
  ) {
    ToastAndroid.show(
      title,
      options?.duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT
    );
    return;
  }

  // Para el resto de casos, usamos CustomModal
  emitModal({ type, title, message });
}

/**
 * Modal de éxito
 */
function success(title: string, message?: string) {
  // En Android, para mensajes simples, usamos ToastAndroid
  if (Platform.OS === 'android' && !message) {
    ToastAndroid.show(title, ToastAndroid.SHORT);
    return;
  }

  emitModal({ type: 'success', title, message });
}

/**
 * Modal de error
 */
function error(title: string, message?: string) {
  emitModal({ type: 'error', title, message });
}

/**
 * Modal informativo
 */
function info(title: string, message?: string) {
  // En Android, para mensajes simples, usamos ToastAndroid
  if (Platform.OS === 'android' && !message) {
    ToastAndroid.show(title, ToastAndroid.SHORT);
    return;
  }

  emitModal({ type: 'info', title, message });
}

/**
 * Modal de advertencia
 */
function warning(title: string, message?: string) {
  emitModal({ type: 'warning', title, message });
}

export const showToast = {
  show,
  success,
  error,
  info,
  warning,
};
