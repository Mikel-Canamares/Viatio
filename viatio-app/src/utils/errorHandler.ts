/**
 * ERROR HANDLER
 *
 * Utilidades para manejo centralizado de errores.
 * Incluye logging, mensajes amigables y detección de tipos de error.
 */

// ============================================
// TIPOS
// ============================================

export interface AppError {
  code: string;
  message: string;
  originalError?: unknown;
}

// ============================================
// LOGGING
// ============================================

/**
 * Log de errores con contexto adicional.
 * En desarrollo: console.error
 * En producción: preparado para servicios de monitoreo (Sentry, etc.)
 */
export function logError(error: unknown, context?: string): void {
  const errorMessage = context ? `[${context}]` : '';

  if (__DEV__) {
    // Desarrollo: log detallado en consola
    console.error(`${errorMessage} Error:`, error);

    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } else {
    // Producción: preparado para servicio de monitoreo
    // TODO: Integrar con Sentry, Firebase Crashlytics, etc.
    console.error(`${errorMessage}`, error);
  }
}

// ============================================
// MENSAJES AMIGABLES
// ============================================

/**
 * Mapeo de códigos de error a mensajes amigables
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Errores de autenticación (Firebase)
  'auth/invalid-email': 'El email no es válido',
  'auth/user-not-found': 'No existe una cuenta con este email',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/requires-recent-login': 'Por seguridad, inicia sesión nuevamente',

  // Errores de red
  'network-error': 'Error de conexión. Verifica tu internet.',
  'timeout': 'La solicitud tardó demasiado. Inténtalo de nuevo.',

  // Errores de validación
  'validation-error': 'Los datos ingresados no son válidos',
  'required-field': 'Este campo es obligatorio',

  // Errores de permisos
  'permission-denied': 'No tienes permiso para realizar esta acción',
  'unauthorized': 'Debes iniciar sesión para continuar',

  // Errores de base de datos
  'not-found': 'No se encontró el recurso solicitado',
  'already-exists': 'Este recurso ya existe',

  // Default
  'unknown': 'Ha ocurrido un error. Inténtalo de nuevo.',
};

/**
 * Convierte errores técnicos en mensajes amigables para el usuario
 */
export function getUserFriendlyMessage(error: unknown): string {
  // Si es un AppError con código conocido
  if (isAppError(error) && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  // Si es un Error de Firebase
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }

  // Si es un Error con mensaje
  if (error instanceof Error && error.message) {
    // Verificar si el mensaje contiene códigos conocidos
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(code)) {
        return message;
      }
    }
  }

  // Error de red
  if (isNetworkError(error)) {
    return ERROR_MESSAGES['network-error'];
  }

  // Mensaje por defecto
  return ERROR_MESSAGES['unknown'];
}

// ============================================
// DETECCIÓN DE TIPOS DE ERROR
// ============================================

/**
 * Detecta si un error es de red/conexión
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Error con código de red
  if (error && typeof error === 'object') {
    const err = error as { code?: string; message?: string };

    if (err.code === 'network-error' || err.code === 'NETWORK_ERROR') {
      return true;
    }

    if (err.message) {
      const networkKeywords = [
        'network',
        'connection',
        'timeout',
        'offline',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ];

      return networkKeywords.some(keyword =>
        err.message!.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }

  return false;
}

/**
 * Type guard para AppError
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// ============================================
// FACTORY DE ERRORES
// ============================================

/**
 * Crea un AppError tipado
 */
export function createAppError(
  code: string,
  message: string,
  originalError?: unknown
): AppError {
  return {
    code,
    message,
    originalError,
  };
}

/**
 * Crea un error de validación
 */
export function createValidationError(
  message: string,
  originalError?: unknown
): AppError {
  return createAppError('validation-error', message, originalError);
}

/**
 * Crea un error de red
 */
export function createNetworkError(
  message?: string,
  originalError?: unknown
): AppError {
  return createAppError(
    'network-error',
    message || ERROR_MESSAGES['network-error'],
    originalError
  );
}

/**
 * Crea un error de autenticación
 */
export function createAuthError(
  code: string,
  originalError?: unknown
): AppError {
  return createAppError(
    code,
    ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown'],
    originalError
  );
}
