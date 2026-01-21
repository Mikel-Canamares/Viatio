import { useState, useEffect } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

export type NumericInputMode = 'integer' | 'decimal';

export interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'inputMode'> {
  /** Valor numérico actual (null si vacío o inválido) */
  value: number | null;
  /** Callback cuando el valor numérico cambia */
  onValueChange: (value: number | null) => void;
  /** Modo de entrada: 'integer' (enteros) o 'decimal' (decimales) */
  mode?: NumericInputMode;
  /** Número máximo de decimales permitidos (solo para mode='decimal') */
  maxDecimals?: number;
  /** Valor mínimo permitido (validado en onEndEditing) */
  min?: number;
  /** Valor máximo permitido (validado en onEndEditing) */
  max?: number;
  /** Si true, formatea con locale 'es-ES' al finalizar edición */
  formatOnBlur?: boolean;
}

/**
 * Input numérico reutilizable que maneja correctamente entrada en español (coma/punto)
 *
 * Características:
 * - Acepta tanto "," como "." como separador decimal
 * - Valida min/max al finalizar edición
 * - Permite configurar máximo de decimales
 * - Previene entrada de caracteres no numéricos
 * - UX natural: no fuerza formato mientras escribes
 */
export function NumericInput({
  value,
  onValueChange,
  mode = 'decimal',
  maxDecimals = 2,
  min,
  max,
  formatOnBlur = false,
  style,
  placeholder = '0',
  ...rest
}: NumericInputProps) {
  // Estado interno: texto que el usuario está escribiendo
  const [textValue, setTextValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Inicializar texto desde valor numérico
  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined || value === 0) {
        // Si es null, undefined o 0, mostrar vacío (se verá el placeholder)
        setTextValue('');
      } else {
        // Al iniciar, mostrar el número sin formato forzado
        setTextValue(value.toString().replace('.', ','));
      }
    }
  }, [value, isFocused]);

  /**
   * Normalizar entrada: reemplazar coma por punto para parsing
   */
  const normalizeInput = (text: string): string => {
    return text.replace(',', '.');
  };

  /**
   * Validar texto según el modo
   */
  const isValidInput = (text: string): boolean => {
    if (text === '' || text === '-') return true;

    const normalized = normalizeInput(text);

    if (mode === 'integer') {
      // Solo permitir números enteros (con signo opcional)
      return /^-?\d*$/.test(normalized);
    } else {
      // Permitir decimales con un solo punto
      if ((normalized.match(/\./g) || []).length > 1) return false;

      // Validar formato decimal
      if (!/^-?\d*\.?\d*$/.test(normalized)) return false;

      // Validar máximo de decimales
      const parts = normalized.split('.');
      if (parts.length === 2 && parts[1].length > maxDecimals) {
        return false;
      }

      return true;
    }
  };

  /**
   * Parsear texto a número
   */
  const parseValue = (text: string): number | null => {
    if (!text || text === '-') return null;

    const normalized = normalizeInput(text);
    const parsed = mode === 'integer' ? parseInt(normalized, 10) : parseFloat(normalized);

    return isNaN(parsed) ? null : parsed;
  };

  /**
   * Aplicar límites min/max
   */
  const clampValue = (num: number | null): number | null => {
    if (num === null) return null;

    let clamped = num;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;

    return clamped;
  };

  /**
   * Manejar cambio de texto
   */
  const handleChangeText = (text: string) => {
    // Prevenir pegado de caracteres no válidos
    if (!isValidInput(text)) return;

    setTextValue(text);

    // Parsear y notificar cambio
    const parsed = parseValue(text);
    onValueChange(parsed);
  };

  /**
   * Manejar fin de edición
   */
  const handleEndEditing = () => {
    setIsFocused(false);

    let parsed = parseValue(textValue);

    // Aplicar clamp
    parsed = clampValue(parsed);

    // Actualizar valor
    onValueChange(parsed);

    // Formatear si está habilitado
    if (parsed !== null && formatOnBlur) {
      const formatted = mode === 'decimal'
        ? parsed.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDecimals
          })
        : parsed.toLocaleString('es-ES');
      setTextValue(formatted);
    } else if (parsed !== null) {
      // Sin formato, solo actualizar con el valor parseado
      setTextValue(parsed.toString().replace('.', ','));
    } else {
      setTextValue('');
    }
  };

  /**
   * Manejar inicio de edición
   */
  const handleFocus = () => {
    setIsFocused(true);

    // Si hay formato de locale, removerlo para edición limpia
    if (formatOnBlur && textValue) {
      const cleaned = textValue.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        setTextValue(parsed.toString().replace('.', ','));
      }
    }
  };

  return (
    <TextInput
      {...rest}
      style={style}
      value={textValue}
      onChangeText={handleChangeText}
      onEndEditing={handleEndEditing}
      onFocus={handleFocus}
      placeholder={placeholder}
      keyboardType={mode === 'integer' ? 'number-pad' : 'decimal-pad'}
      inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
    />
  );
}
