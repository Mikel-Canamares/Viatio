/**
 * EJEMPLO DE USO: NumericInput
 *
 * Este archivo muestra cómo usar el componente NumericInput
 * en diferentes escenarios.
 */

import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NumericInput } from './NumericInput';
import { theme } from '@/config/theme';

export function NumericInputExample() {
  const [precio, setPrecio] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [porcentaje, setPorcentaje] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {/* Ejemplo 1: Precio en euros (decimal con 2 decimales) */}
      <View style={styles.example}>
        <Text style={styles.label}>Precio (€)</Text>
        <NumericInput
          style={styles.input}
          value={precio}
          onValueChange={setPrecio}
          mode="decimal"
          maxDecimals={2}
          min={0}
          placeholder="0,00"
        />
        <Text style={styles.result}>
          Valor: {precio !== null ? `${precio.toFixed(2)} €` : 'vacío'}
        </Text>
      </View>

      {/* Ejemplo 2: Cantidad entera */}
      <View style={styles.example}>
        <Text style={styles.label}>Cantidad (unidades)</Text>
        <NumericInput
          style={styles.input}
          value={cantidad}
          onValueChange={setCantidad}
          mode="integer"
          min={1}
          max={999}
          placeholder="1"
        />
        <Text style={styles.result}>
          Valor: {cantidad !== null ? cantidad : 'vacío'}
        </Text>
      </View>

      {/* Ejemplo 3: Porcentaje con formato locale */}
      <View style={styles.example}>
        <Text style={styles.label}>Descuento (%)</Text>
        <NumericInput
          style={styles.input}
          value={porcentaje}
          onValueChange={setPorcentaje}
          mode="decimal"
          maxDecimals={1}
          min={0}
          max={100}
          formatOnBlur={true}
          placeholder="0"
        />
        <Text style={styles.result}>
          Valor: {porcentaje !== null ? `${porcentaje}%` : 'vacío'}
        </Text>
      </View>

      {/* Ejemplo 4: Uso en gastos compartidos (céntimos) */}
      <View style={styles.example}>
        <Text style={styles.label}>Monto individual</Text>
        <NumericInput
          style={styles.input}
          value={precio}
          onValueChange={(value) => {
            // Convertir a céntimos para la lógica interna
            const cents = value !== null ? Math.round(value * 100) : 0;
            console.log('Cantidad en céntimos:', cents);
            setPrecio(value);
          }}
          mode="decimal"
          maxDecimals={2}
          min={0}
          placeholder="0"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  example: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  result: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});
