/**
 * USE ASYNC
 *
 * Hook genérico para manejar operaciones asíncronas.
 * Proporciona loading, error y data de forma centralizada.
 */

import { useState, useCallback } from 'react';
import { getUserFriendlyMessage, logError } from '@/utils';

interface UseAsyncReturn<T> {
  /** Datos retornados por la operación async */
  data: T | null;

  /** Si la operación está en curso */
  loading: boolean;

  /** Mensaje de error amigable (null si no hay error) */
  error: string | null;

  /** Ejecuta una función asíncrona */
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>;

  /** Resetea el estado a valores iniciales */
  reset: () => void;
}

/**
 * Hook para manejar operaciones asíncronas con loading y error
 *
 * @example
 * ```tsx
 * const { data: viajes, loading, error, execute } = useAsync<Viaje[]>();
 *
 * useEffect(() => {
 *   execute(() => getViajes());
 * }, []);
 * ```
 */
export function useAsync<T>(): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>): Promise<T | null> => {
      try {
        // Iniciar loading y limpiar error anterior
        setLoading(true);
        setError(null);

        // Ejecutar función asíncrona
        const result = await asyncFunction();

        // Guardar resultado
        setData(result);
        setLoading(false);

        return result;
      } catch (err) {
        // Log del error
        logError(err, 'useAsync');

        // Obtener mensaje amigable
        const friendlyMessage = getUserFriendlyMessage(err);
        setError(friendlyMessage);

        // Limpiar loading
        setLoading(false);

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
