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

export {
  normalizeString,
  stringSimilarity,
  jaroWinklerSimilarity,
  combinedSimilarity,
  fuzzyContains,
  extractKeywords,
  keywordSimilarity,
} from './stringSimilarity';

export {
  getDeviceLanguageCode,
  getDeviceLocale,
  isDeviceLanguage,
} from './localization';

export {
  parseLocalDate,
  formatLocalDateISO,
  startOfLocalDay,
  isSameDay,
  isDateInRange,
} from './dateUtils';

export { showToast } from './toast';
