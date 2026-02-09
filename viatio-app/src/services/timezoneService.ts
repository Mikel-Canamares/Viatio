/**
 * TIMEZONE SERVICE
 *
 * Servicio para resolución y formateo de timezones.
 * Usa Luxon para conversiones locales y tz-lookup para derivar IANA tz desde lat/lng.
 */

import { DateTime } from 'luxon';
// @ts-ignore - tz-lookup no tiene tipos oficiales
import tzlookup from 'tz-lookup';
import * as Localization from 'expo-localization';

// ============================================
// RESOLUCIÓN DE TIMEZONE
// ============================================

/**
 * Detecta la timezone IANA del dispositivo
 */
export function getDeviceTimeZone(): string {
  try {
    // Intl.DateTimeFormat().resolvedOptions().timeZone es la forma estándar
    // pero en React Native expo-localization también provee la timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;

    // Fallback: usar expo-localization
    return Localization.getCalendars()[0]?.timeZone || 'UTC';
  } catch (error) {
    console.warn('[TimezoneService] Error detectando timezone del dispositivo:', error);
    return 'UTC';
  }
}

/**
 * Deriva la timezone IANA desde coordenadas lat/lng usando tz-lookup
 *
 * @param latitude Latitud decimal
 * @param longitude Longitud decimal
 * @returns Timezone IANA (ej: "Asia/Manila") o null si falla
 */
export function getTimeZoneFromCoordinates(
  latitude: number,
  longitude: number
): string | null {
  try {
    // tz-lookup devuelve un string IANA o lanza error si no encuentra
    const tz = tzlookup(latitude, longitude);
    console.log(`[TimezoneService] Timezone derivada de (${latitude}, ${longitude}): ${tz}`);
    return tz;
  } catch (error) {
    console.warn('[TimezoneService] Error derivando timezone desde coordenadas:', error);
    return null;
  }
}

// ============================================
// FORMATEO DE TIEMPO
// ============================================

export interface DualTimeResult {
  /** Hora formateada en timezone del destino (ej: "13:45") */
  destinationTime: string;
  /** Label de timezone del destino (ej: "Manila") */
  destinationLabel: string;
  /** Hora formateada en timezone casa (ej: "06:45") */
  homeTime: string;
  /** Label de timezone casa (ej: "Madrid") */
  homeLabel: string;
  /** ISO timestamp usado para el cálculo */
  timestamp: string;
}

/**
 * Calcula las horas actuales en la timezone del destino y la timezone "casa"
 *
 * @param tripTimeZone Timezone IANA del viaje (ej: "Asia/Manila")
 * @param homeTimeZone Timezone IANA casa del usuario (ej: "Europe/Madrid")
 * @returns Objeto con horas formateadas y labels
 */
export function formatDualTime(
  tripTimeZone: string,
  homeTimeZone: string
): DualTimeResult {
  const now = DateTime.now();

  // Convertir a timezone del destino
  const destTime = now.setZone(tripTimeZone);
  const destLabel = extractCityFromTimeZone(tripTimeZone);

  // Convertir a timezone casa
  const homeTime = now.setZone(homeTimeZone);
  const homeLabel = extractCityFromTimeZone(homeTimeZone);

  return {
    destinationTime: destTime.toFormat('HH:mm'),
    destinationLabel: destLabel,
    homeTime: homeTime.toFormat('HH:mm'),
    homeLabel: homeLabel,
    timestamp: now.toISO() || now.toString(),
  };
}

/**
 * Extrae el nombre de la ciudad de una timezone IANA
 * Ej: "Asia/Manila" -> "Manila", "America/New_York" -> "New York"
 */
function extractCityFromTimeZone(timeZone: string): string {
  try {
    const parts = timeZone.split('/');
    if (parts.length >= 2) {
      // Tomar la última parte (ciudad) y reemplazar guiones bajos con espacios
      return parts[parts.length - 1].replace(/_/g, ' ');
    }
    return timeZone;
  } catch (error) {
    return timeZone;
  }
}

// ============================================
// VALIDACIÓN
// ============================================

/**
 * Valida si una string es una timezone IANA válida
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    const dt = DateTime.now().setZone(timeZone);
    return dt.isValid;
  } catch {
    return false;
  }
}

// ============================================
// LISTADO DE TIMEZONES POPULARES (para picker)
// ============================================

export interface TimeZoneOption {
  value: string; // IANA timezone (ej: "Europe/Madrid")
  label: string; // Display label (ej: "Madrid (UTC+1)")
  offset: string; // Offset actual (ej: "+01:00")
}

/**
 * Devuelve una lista de timezones populares para mostrar en un selector
 */
export function getPopularTimeZones(): TimeZoneOption[] {
  const popularZones = [
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/Buenos_Aires',
    'America/Sao_Paulo',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Asia/Manila',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Africa/Cairo',
    'UTC',
  ];

  return popularZones.map(tz => {
    const dt = DateTime.now().setZone(tz);
    const offset = dt.toFormat('ZZ'); // Ej: "+01:00"
    const city = extractCityFromTimeZone(tz);

    return {
      value: tz,
      label: `${city} (UTC${offset})`,
      offset,
    };
  });
}
