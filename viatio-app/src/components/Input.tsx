/**
 * INPUT
 *
 * Componente de input de texto reutilizable.
 * Soporta label, error, multiline, secure entry, etc.
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { theme } from '@/config';

interface InputProps {
  /** Label opcional que se muestra arriba del input */
  label?: string;

  /** Placeholder del input */
  placeholder?: string;

  /** Valor actual del input */
  value: string;

  /** Función que se ejecuta cuando cambia el texto */
  onChangeText: (text: string) => void;

  /** Mensaje de error a mostrar debajo del input */
  error?: string;

  /** Si true, oculta el texto (para contraseñas) */
  secureTextEntry?: boolean;

  /** Si true, permite múltiples líneas */
  multiline?: boolean;

  /** Tipo de teclado a mostrar */
  keyboardType?: KeyboardTypeOptions;

  /** Capitalización automática */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Determinar estilo del borde según estado
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input */}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor: getBorderColor() },
          error && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlignVertical={multiline ? 'top' : 'center'}
      />

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
