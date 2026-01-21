/**
 * Utilidades para formatear divisas y montos
 */

import { getCurrencyByCode } from '@/config/currencies';

/**
 * Formatea un monto con su divisa
 * @param amount Monto numérico
 * @param currencyCode Código de divisa (EUR, USD, etc.)
 * @param options Opciones de formato
 * @returns Cadena formateada (ej: "150.00 USD", "€137.25")
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: {
    showSymbol?: boolean; // Mostrar símbolo en lugar de código (default: true)
    decimals?: number; // Número de decimales (default: 2)
    symbolFirst?: boolean; // Símbolo antes del monto (default: auto según divisa)
  }
): string {
  const {
    showSymbol = true,
    decimals = 2,
    symbolFirst,
  } = options || {};

  const currency = getCurrencyByCode(currencyCode);
  const formattedAmount = amount.toFixed(decimals);

  if (!showSymbol) {
    return `${formattedAmount} ${currencyCode}`;
  }

  const symbol = currency?.symbol || currencyCode;

  // Determinar posición del símbolo
  // Por defecto: símbolos especiales antes (€, $, £), códigos después (CHF, kr)
  const shouldSymbolBeFirst = symbolFirst !== undefined
    ? symbolFirst
    : ['€', '$', '£', '¥', '₹', '₽', '₪', '฿', '₩', '₱', '₺', 'R'].includes(symbol);

  if (shouldSymbolBeFirst) {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${symbol}`;
  }
}

/**
 * Formatea un monto con conversión
 * @param original Monto original
 * @param originalCurrency Divisa original
 * @param converted Monto convertido
 * @param convertedCurrency Divisa convertida
 * @returns Cadena con ambos montos (ej: "150.00 USD\n≈ €137.25")
 */
export function formatConvertedCurrency(
  original: number,
  originalCurrency: string,
  converted: number,
  convertedCurrency: string
): { original: string; converted: string } {
  return {
    original: formatCurrency(original, originalCurrency),
    converted: `≈ ${formatCurrency(converted, convertedCurrency)}`,
  };
}

/**
 * Parsea un monto de string a número
 * Soporta diferentes formatos (1,000.00, 1.000,00, etc.)
 */
export function parseCurrencyAmount(value: string): number {
  // Eliminar espacios y símbolos de divisa
  let cleaned = value.trim().replace(/[€$£¥₹₽₪฿₩₱₺R]/g, '');

  // Detectar separador decimal (último . o ,)
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastDot > lastComma) {
    // Formato: 1,000.00 (punto decimal)
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma > lastDot) {
    // Formato: 1.000,00 (coma decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Obtiene el nombre completo de una divisa
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.name || currencyCode;
}

/**
 * Obtiene el símbolo de una divisa
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || currencyCode;
}
