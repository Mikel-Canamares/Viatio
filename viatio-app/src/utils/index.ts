/**
 * UTILS
 *
 * Funciones de utilidad y helpers generales.
 * Funciones puras sin dependencias de estado o contexto de React.
 *
 * Ejemplos: formatDate, validateEmail, debounce, storage helpers, etc.
 */

export {
  logError,
  getUserFriendlyMessage,
  isNetworkError,
  createAppError,
  createValidationError,
  createNetworkError,
  createAuthError,
} from './errorHandler';

export type { AppError } from './errorHandler';
