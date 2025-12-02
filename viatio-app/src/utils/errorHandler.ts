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
 * Mapeo de códigos de error de Firebase Auth a mensajes amigables
 */
const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  // Errores de login
  'auth/user-not-found': 'No existe una cuenta con este email. ¿Quieres registrarte?',
  'auth/wrong-password': 'Contraseña incorrecta. Inténtalo de nuevo.',
  'auth/invalid-credential': 'Las credenciales no son válidas. Verifica tu email y contraseña.',
  'auth/invalid-email': 'El formato del email no es válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta con soporte.',

  // Errores de registro
  'auth/email-already-in-use': 'Ya existe una cuenta con este email. ¿Quieres iniciar sesión?',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/operation-not-allowed': 'El registro con email no está habilitado.',

  // Errores de recuperación de contraseña
  'auth/expired-action-code': 'El enlace ha expirado. Solicita uno nuevo.',
  'auth/invalid-action-code': 'El enlace no es válido. Solicita uno nuevo.',

  // Errores de red y generales
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/internal-error': 'Error interno. Inténtalo más tarde.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión.',

  // Google Sign-In
  'auth/popup-closed-by-user': 'Se canceló el inicio de sesión.',
  'auth/cancelled-popup-request': 'Se canceló la solicitud.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email usando otro método de inicio de sesión.',

  // Apple Sign-In
  'auth/invalid-credential-apple': 'Las credenciales de Apple no son válidas.',
};

/**
 * Mapeo de códigos de error generales
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Incluir errores de Firebase Auth
  ...FIREBASE_AUTH_ERRORS,

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
    // Detectar errores de red por palabras clave
    if (error.message.includes('network') || error.message.includes('Network')) {
      return 'Error de conexión. Verifica tu internet.';
    }

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

/**
 * Detecta si el error sugiere que el usuario debería registrarse
 */
export function shouldSuggestRegister(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'auth/user-not-found';
  }
  return false;
}

/**
 * Detecta si el error sugiere que el usuario debería iniciar sesión
 */
export function shouldSuggestLogin(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'auth/email-already-in-use';
  }
  return false;
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
