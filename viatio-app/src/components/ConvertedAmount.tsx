/**
 * Componente para mostrar un monto convertido
 * Muestra el monto original y su conversión a otra divisa
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/config/theme';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useCurrencyStore } from '@/store/currencyStore';

interface ConvertedAmountProps {
  amount: number;
  currency: string;
  targetCurrency: string;
  showOriginal?: boolean; // Mostrar monto original (default: true)
  style?: any;
  originalStyle?: any;
  convertedStyle?: any;
}

export function ConvertedAmount({
  amount,
  currency,
  targetCurrency,
  showOriginal = true,
  style,
  originalStyle,
  convertedStyle,
}: ConvertedAmountProps) {
  const { convert } = useCurrencyStore();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performConversion = async () => {
      // Si las divisas son iguales, no hay conversión
      if (currency === targetCurrency) {
        setConvertedAmount(amount);
        return;
      }

      setLoading(true);

      try {
        const result = await convert(amount, currency, targetCurrency);
        if (result) {
          setConvertedAmount(result.converted);
        } else {
          setConvertedAmount(null);
        }
      } catch (error) {
        console.error('Error convirtiendo monto:', error);
        setConvertedAmount(null);
      } finally {
        setLoading(false);
      }
    };

    if (amount && currency && targetCurrency) {
      performConversion();
    }
  }, [amount, currency, targetCurrency]);

  // Si las divisas son iguales, no mostrar nada
  if (currency === targetCurrency) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {showOriginal && (
        <Text style={[styles.original, originalStyle]}>
          {formatCurrency(amount, currency)}
        </Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Convirtiendo...</Text>
        </View>
      ) : convertedAmount !== null ? (
        <Text style={[styles.converted, convertedStyle]}>
          ≈ {formatCurrency(convertedAmount, targetCurrency)}
        </Text>
      ) : (
        <Text style={styles.error}>No disponible</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  original: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  converted: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    fontStyle: 'italic',
  },
});
