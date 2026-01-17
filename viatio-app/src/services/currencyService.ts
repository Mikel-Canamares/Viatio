/**
 * Servicio de conversión de divisas usando Frankfurter API
 * API gratuita con tasas del Banco Central Europeo (BCE)
 * https://frankfurter.dev/
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExchangeRates, ConvertedAmount } from '@/types/gasto';
import { Currency, ALL_CURRENCIES } from '@/config/currencies';

const FRANKFURTER_API_URL = 'https://api.frankfurter.app';
const CACHE_KEY_PREFIX = 'exchange_rates';
const CACHE_TTL_HOURS = 24;

/**
 * Clave de caché para tasas de cambio
 */
function getCacheKey(baseCurrency: string): string {
  return `${CACHE_KEY_PREFIX}_${baseCurrency}`;
}

/**
 * Obtiene tasas de cambio desde la caché local
 * @param baseCurrency Divisa base (EUR, USD, etc.)
 * @returns Tasas cacheadas o null si no hay caché válida
 */
export async function getCachedRates(baseCurrency: string): Promise<ExchangeRates | null> {
  try {
    const cacheKey = getCacheKey(baseCurrency);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const data = JSON.parse(cached);
    const { rates, timestamp } = data;

    // Verificar si la caché sigue siendo válida
    if (!timestamp || !rates) {
      return null;
    }

    const now = Date.now();
    const hoursPassed = (now - timestamp) / (1000 * 60 * 60);

    if (hoursPassed > CACHE_TTL_HOURS) {
      // Caché expirada
      return null;
    }

    return rates;
  } catch (error) {
    console.error('Error leyendo caché de tasas:', error);
    return null;
  }
}

/**
 * Guarda tasas de cambio en la caché local
 */
async function saveRatesToCache(baseCurrency: string, rates: ExchangeRates): Promise<void> {
  try {
    const cacheKey = getCacheKey(baseCurrency);
    const data = {
      rates,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error guardando tasas en caché:', error);
  }
}

/**
 * Obtiene tasas de cambio desde Frankfurter API
 * @param baseCurrency Divisa base (EUR, USD, etc.)
 * @returns Tasas de cambio actualizadas
 * @throws Error si la API falla
 */
export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${FRANKFURTER_API_URL}/latest?from=${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const rates: ExchangeRates = {
      base: data.base,
      date: data.date,
      rates: data.rates,
    };

    // Guardar en caché
    await saveRatesToCache(baseCurrency, rates);

    return rates;
  } catch (error) {
    console.error('Error obteniendo tasas de Frankfurter:', error);
    throw error;
  }
}

/**
 * Obtiene tasas de cambio con caché
 * Intenta desde caché primero, si no hay o está expirada, descarga de API
 * @param baseCurrency Divisa base
 * @param forceRefresh Forzar actualización desde API
 * @returns Tasas de cambio
 */
export async function getExchangeRates(
  baseCurrency: string,
  forceRefresh: boolean = false
): Promise<ExchangeRates | null> {
  try {
    if (!forceRefresh) {
      const cached = await getCachedRates(baseCurrency);
      if (cached) {
        return cached;
      }
    }

    // Descargar tasas actualizadas
    return await fetchExchangeRates(baseCurrency);
  } catch (error) {
    console.error('Error obteniendo tasas:', error);

    // Si falla la API, intentar usar caché antigua (aunque esté expirada)
    const cached = await getCachedRates(baseCurrency);
    if (cached) {
      console.warn('Usando caché antigua de tasas debido a error de API');
      return cached;
    }

    return null;
  }
}

/**
 * Convierte un monto entre dos divisas
 * @param amount Monto a convertir
 * @param fromCurrency Divisa origen
 * @param toCurrency Divisa destino
 * @param rates Tasas de cambio (opcional, se descargarán si no se proveen)
 * @returns Información de conversión completa
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: ExchangeRates
): Promise<ConvertedAmount | null> {
  try {
    // Si las divisas son iguales, no hay conversión
    if (fromCurrency === toCurrency) {
      return {
        original: amount,
        originalCurrency: fromCurrency,
        converted: amount,
        convertedCurrency: toCurrency,
        rate: 1,
      };
    }

    // Obtener tasas si no se proveyeron
    if (!rates) {
      const fetchedRates = await getExchangeRates(fromCurrency);
      if (!fetchedRates) {
        throw new Error('No se pudieron obtener tasas de cambio');
      }
      rates = fetchedRates;
    }

    // Conversión
    let rate: number;
    let converted: number;

    if (rates.base === fromCurrency) {
      // Conversión directa (base -> destino)
      rate = rates.rates[toCurrency];
      if (!rate) {
        throw new Error(`Tasa no disponible para ${toCurrency}`);
      }
      converted = amount * rate;
    } else if (rates.base === toCurrency) {
      // Conversión inversa (origen -> base)
      rate = 1 / rates.rates[fromCurrency];
      if (!rate || !isFinite(rate)) {
        throw new Error(`Tasa no disponible para ${fromCurrency}`);
      }
      converted = amount * rate;
    } else {
      // Conversión cruzada (origen -> base -> destino)
      const fromRate = rates.rates[fromCurrency];
      const toRate = rates.rates[toCurrency];

      if (!fromRate || !toRate) {
        throw new Error(`Tasas no disponibles para conversión cruzada`);
      }

      rate = toRate / fromRate;
      converted = amount * rate;
    }

    return {
      original: amount,
      originalCurrency: fromCurrency,
      converted,
      convertedCurrency: toCurrency,
      rate,
    };
  } catch (error) {
    console.error('Error convirtiendo monto:', error);
    return null;
  }
}

/**
 * Convierte múltiples montos de forma eficiente (batch)
 * @param conversions Array de conversiones a realizar
 * @returns Array de resultados (null si falla alguna conversión)
 */
export async function convertBatch(
  conversions: Array<{
    amount: number;
    from: string;
    to: string;
  }>
): Promise<Array<ConvertedAmount | null>> {
  try {
    // Agrupar por divisa base para optimizar requests
    const byBase = new Map<string, typeof conversions>();

    for (const conv of conversions) {
      if (!byBase.has(conv.from)) {
        byBase.set(conv.from, []);
      }
      byBase.get(conv.from)!.push(conv);
    }

    // Obtener tasas para cada divisa base
    const results: Array<ConvertedAmount | null> = [];

    for (const [baseCurrency, items] of byBase) {
      const rates = await getExchangeRates(baseCurrency);

      for (const item of items) {
        const result = await convertAmount(item.amount, item.from, item.to, rates || undefined);
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error en conversión batch:', error);
    return conversions.map(() => null);
  }
}

/**
 * Obtiene lista de divisas soportadas desde API
 * @returns Lista de divisas con sus nombres
 */
export async function getSupportedCurrencies(): Promise<Currency[]> {
  try {
    const response = await fetch(`${FRANKFURTER_API_URL}/currencies`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Convertir respuesta a formato Currency
    const currencies: Currency[] = Object.entries(data).map(([code, name]) => {
      // Buscar en nuestra lista para obtener símbolo y flag
      const existing = ALL_CURRENCIES.find(c => c.code === code);

      return {
        code,
        name: name as string,
        symbol: existing?.symbol || code,
        flag: existing?.flag,
      };
    });

    return currencies;
  } catch (error) {
    console.error('Error obteniendo divisas soportadas:', error);
    // Retornar lista de respaldo
    return ALL_CURRENCIES;
  }
}

/**
 * Verifica si hay conexión a internet y la API está disponible
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${FRANKFURTER_API_URL}/currencies`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Limpia toda la caché de tasas de cambio
 */
export async function clearRatesCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const rateKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(rateKeys);
  } catch (error) {
    console.error('Error limpiando caché de tasas:', error);
  }
}
