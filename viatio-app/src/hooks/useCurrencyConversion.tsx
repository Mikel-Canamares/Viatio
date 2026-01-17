/**
 * Hook personalizado para conversión de divisas
 * Simplifica el uso del store de divisas en componentes
 */

import { useEffect, useState } from 'react';
import { useCurrencyStore } from '@/store/currencyStore';
import { ConvertedAmount } from '@/types/gasto';

/**
 * Hook para convertir un monto entre divisas
 * @param amount Monto a convertir
 * @param fromCurrency Divisa origen
 * @param toCurrency Divisa destino
 * @returns Resultado de conversión, estado de carga y error
 */
export function useCurrencyConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): {
  converted: ConvertedAmount | null;
  loading: boolean;
  error: string | null;
} {
  const { convert } = useCurrencyStore();
  const [converted, setConverted] = useState<ConvertedAmount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performConversion = async () => {
      // Si las divisas son iguales, no hay conversión necesaria
      if (fromCurrency === toCurrency) {
        setConverted({
          original: amount,
          originalCurrency: fromCurrency,
          converted: amount,
          convertedCurrency: toCurrency,
          rate: 1,
        });
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await convert(amount, fromCurrency, toCurrency);
        if (result) {
          setConverted(result);
          setError(null);
        } else {
          setConverted(null);
          setError('No se pudo convertir el monto');
        }
      } catch (err) {
        console.error('Error en conversión:', err);
        setConverted(null);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (amount && fromCurrency && toCurrency) {
      performConversion();
    }
  }, [amount, fromCurrency, toCurrency]);

  return { converted, loading, error };
}

/**
 * Hook para obtener la tasa de cambio entre dos divisas
 * @param fromCurrency Divisa origen
 * @param toCurrency Divisa destino
 * @returns Tasa de cambio, estado de carga y error
 */
export function useExchangeRate(
  fromCurrency: string,
  toCurrency: string
): {
  rate: number | null;
  loading: boolean;
  error: string | null;
} {
  const { getRate } = useCurrencyStore();
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      if (fromCurrency === toCurrency) {
        setRate(1);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedRate = await getRate(fromCurrency, toCurrency);
        if (fetchedRate !== null) {
          setRate(fetchedRate);
          setError(null);
        } else {
          setRate(null);
          setError('No se pudo obtener la tasa de cambio');
        }
      } catch (err) {
        console.error('Error obteniendo tasa:', err);
        setRate(null);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (fromCurrency && toCurrency) {
      fetchRate();
    }
  }, [fromCurrency, toCurrency]);

  return { rate, loading, error };
}

/**
 * Hook para cargar tasas de cambio para una divisa base
 * @param baseCurrency Divisa base
 * @returns Estado de carga y función para refrescar
 */
export function useCurrencyRates(baseCurrency: string): {
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  offline: boolean;
  refresh: () => Promise<void>;
} {
  const { loadRates, loading, error, lastUpdate, offline } = useCurrencyStore();

  useEffect(() => {
    if (baseCurrency) {
      loadRates(baseCurrency);
    }
  }, [baseCurrency]);

  const refresh = async () => {
    if (baseCurrency) {
      await loadRates(baseCurrency, true);
    }
  };

  return { loading, error, lastUpdate, offline, refresh };
}
