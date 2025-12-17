/**
 * DATE UTILS
 *
 * Utilidades para manejo consistente de fechas.
 * Resuelve problemas de zona horaria al parsear fechas ISO.
 */

/**
 * Parsea una fecha ISO (YYYY-MM-DD) como fecha local, sin aplicar conversión UTC.
 *
 * IMPORTANTE: `new Date("2025-01-15")` interpreta la fecha como UTC medianoche,
 * lo que puede causar que en zonas horarias negativas se muestre el día anterior.
 *
 * Esta función parsea la fecha como hora local para asegurar consistencia
 * entre el emulador y dispositivos físicos con diferentes zonas horarias.
 *
 * @param isoDateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Date object con la fecha interpretada en hora local
 *
 * @example
 * // En lugar de:
 * const fecha = new Date("2025-01-15"); // 2025-01-14T23:00:00 en UTC-1
 *
 * // Usa:
 * const fecha = parseLocalDate("2025-01-15"); // 2025-01-15T00:00:00 local
 */
export function parseLocalDate(isoDateString: string): Date {
  // Dividir la fecha en partes
  const [year, month, day] = isoDateString.split('-').map(Number);

  // Crear Date con constructor local (mes es 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Convierte un Date object a string ISO (YYYY-MM-DD) en hora local.
 *
 * @param date - Date object
 * @returns String en formato ISO (YYYY-MM-DD)
 *
 * @example
 * const fecha = new Date(2025, 0, 15); // 15 de enero de 2025
 * formatLocalDateISO(fecha); // "2025-01-15"
 */
export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Crea un Date object normalizado a medianoche local.
 *
 * @param date - Date object
 * @returns Date object con hora 00:00:00.000 local
 */
export function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Compara dos fechas ISO ignorando la hora.
 *
 * @param date1 - Primera fecha ISO
 * @param date2 - Segunda fecha ISO
 * @returns true si las fechas son el mismo día
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Verifica si una fecha está dentro de un rango (inclusive).
 *
 * @param date - Fecha a verificar (ISO)
 * @param start - Fecha inicio del rango (ISO)
 * @param end - Fecha fin del rango (ISO)
 * @returns true si la fecha está dentro del rango
 */
export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
