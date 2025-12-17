/**
 * UTILS: LOCALIZATION
 *
 * Utilidades para manejo de localización e internacionalización.
 */

import * as Localization from 'expo-localization';

/**
 * Obtiene el código de idioma del dispositivo (ISO 639-1)
 * Retorna código de 2 letras: 'es', 'en', 'fr', etc.
 *
 * @returns Código de idioma del dispositivo (fallback: 'es')
 */
export function getDeviceLanguageCode(): string {
  try {
    // getLocales() retorna array de locales ordenados por preferencia
    const locales = Localization.getLocales();

    if (locales && locales.length > 0) {
      // languageCode es el código ISO 639-1 (ej: 'es', 'en')
      const languageCode = locales[0].languageCode;

      if (languageCode) {
        console.log('[Localization] Idioma del dispositivo:', languageCode);
        return languageCode;
      }
    }

    console.log('[Localization] No se pudo detectar idioma, usando fallback: es');
    return 'es';
  } catch (error) {
    console.error('[Localization] Error obteniendo idioma del dispositivo:', error);
    return 'es';
  }
}

/**
 * Obtiene el locale completo del dispositivo (ej: 'es-ES', 'en-US')
 *
 * @returns Locale completo del dispositivo (fallback: 'es-ES')
 */
export function getDeviceLocale(): string {
  try {
    const locales = Localization.getLocales();

    if (locales && locales.length > 0) {
      const locale = locales[0].languageTag;

      if (locale) {
        console.log('[Localization] Locale del dispositivo:', locale);
        return locale;
      }
    }

    console.log('[Localization] No se pudo detectar locale, usando fallback: es-ES');
    return 'es-ES';
  } catch (error) {
    console.error('[Localization] Error obteniendo locale del dispositivo:', error);
    return 'es-ES';
  }
}

/**
 * Verifica si el dispositivo está configurado en un idioma específico
 *
 * @param languageCode Código de idioma a verificar (ej: 'es', 'en')
 * @returns true si el dispositivo está en ese idioma
 */
export function isDeviceLanguage(languageCode: string): boolean {
  return getDeviceLanguageCode() === languageCode;
}
