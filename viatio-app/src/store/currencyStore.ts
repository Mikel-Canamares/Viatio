/**
 * Store de Zustand para gestión de divisas y tasas de cambio
 */

import { create } from 'zustand';
import { ExchangeRates, ConvertedAmount } from '@/types/gasto';
import {
  getExchangeRates,
  getCachedRates,
  convertAmount as convertAmountService,
  checkApiAvailability,
  clearRatesCache,
} from '@/services/currencyService';

interface CurrencyState {
  // Estado
  rates: ExchangeRates | null;
  baseCurrency: string;
  lastUpdate: string | null;
  loading: boolean;
  error: string | null;
  offline: boolean;

  // Acciones
  loadRates: (base: string, forceRefresh?: boolean) => Promise<void>;
  setBaseCurrency: (currency: string) => void;
  convert: (amount: number, from: string, to: string) => Promise<ConvertedAmount | null>;
  getRate: (from: string, to: string) => Promise<number | null>;
  checkConnection: () => Promise<boolean>;
  clearCache: () => Promise<void>;
  clearError: () => void;
}

/**
 * Verifica si las tasas necesitan actualización (>24h)
 */
function shouldUpdateRates(lastUpdate: string | null): boolean {
  if (!lastUpdate) return true;

  const now = Date.now();
  const last = new Date(lastUpdate).getTime();
  const hoursPassed = (now - last) / (1000 * 60 * 60);

  return hoursPassed >= 24;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  // Estado inicial
  rates: null,
  baseCurrency: 'EUR',
  lastUpdate: null,
  loading: false,
  error: null,
  offline: false,

  /**
   * Carga tasas de cambio desde API o caché
   */
  loadRates: async (base: string, forceRefresh: boolean = false) => {
    const state = get();

    // Si ya estamos cargando, no hacer nada
    if (state.loading) {
      return;
    }

    // Si ya tenemos tasas para esta divisa y no necesitan actualización, no recargar
    if (
      !forceRefresh &&
      state.rates?.base === base &&
      state.lastUpdate &&
      !shouldUpdateRates(state.lastUpdate)
    ) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // Intentar cargar desde caché primero (rápido)
      if (!forceRefresh) {
        const cached = await getCachedRates(base);
        if (cached) {
          set({
            rates: cached,
            baseCurrency: base,
            lastUpdate: cached.date,
            loading: false,
            offline: false,
          });

          // Verificar si necesita actualización en background
          if (shouldUpdateRates(cached.date)) {
            // Actualizar en background sin bloquear
            getExchangeRates(base, true)
              .then(freshRates => {
                if (freshRates) {
                  set({
                    rates: freshRates,
                    lastUpdate: freshRates.date,
                    offline: false,
                  });
                }
              })
              .catch(err => {
                console.warn('Error actualizando tasas en background:', err);
              });
          }

          return;
        }
      }

      // Si no hay caché o se fuerza, descargar desde API
      const freshRates = await getExchangeRates(base, forceRefresh);

      if (freshRates) {
        set({
          rates: freshRates,
          baseCurrency: base,
          lastUpdate: freshRates.date,
          loading: false,
          error: null,
          offline: false,
        });
      } else {
        throw new Error('No se pudieron obtener tasas de cambio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      console.error('Error cargando tasas:', error);

      // Intentar usar caché antigua si hay error
      const cached = await getCachedRates(base);
      if (cached) {
        set({
          rates: cached,
          baseCurrency: base,
          lastUpdate: cached.date,
          loading: false,
          error: 'Usando tasas antiguas (sin conexión)',
          offline: true,
        });
      } else {
        set({
          loading: false,
          error: errorMessage,
          offline: true,
        });
      }
    }
  },

  /**
   * Establece la divisa base del viaje
   */
  setBaseCurrency: (currency: string) => {
    set({ baseCurrency: currency });

    // Cargar tasas para la nueva divisa base
    get().loadRates(currency);
  },

  /**
   * Convierte un monto entre dos divisas
   */
  convert: async (amount: number, from: string, to: string): Promise<ConvertedAmount | null> => {
    const state = get();

    try {
      // Si las divisas son iguales, no hay conversión
      if (from === to) {
        return {
          original: amount,
          originalCurrency: from,
          converted: amount,
          convertedCurrency: to,
          rate: 1,
        };
      }

      // Usar tasas del store si están disponibles y coincide la base
      const rates = state.rates?.base === from ? state.rates : undefined;

      const result = await convertAmountService(amount, from, to, rates);

      if (!result) {
        throw new Error('No se pudo convertir el monto');
      }

      return result;
    } catch (error) {
      console.error('Error convirtiendo monto:', error);
      return null;
    }
  },

  /**
   * Obtiene la tasa de cambio entre dos divisas
   */
  getRate: async (from: string, to: string): Promise<number | null> => {
    const conversion = await get().convert(1, from, to);
    return conversion?.rate || null;
  },

  /**
   * Verifica conexión a internet y disponibilidad de API
   */
  checkConnection: async (): Promise<boolean> => {
    const available = await checkApiAvailability();
    set({ offline: !available });
    return available;
  },

  /**
   * Limpia toda la caché de tasas
   */
  clearCache: async () => {
    await clearRatesCache();
    set({
      rates: null,
      lastUpdate: null,
    });
  },

  /**
   * Limpia mensaje de error
   */
  clearError: () => {
    set({ error: null });
  },
}));
