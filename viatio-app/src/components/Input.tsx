/**
 * INPUT
 *
 * Componente de input de texto reutilizable.
 * Soporta label, error, multiline, secure entry, iconos, etc.
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface InputProps {
  /** Label que se muestra arriba del input */
  label: string;

  /** Valor actual del input */
  value: string;

  /** Función que se ejecuta cuando cambia el texto */
  onChangeText: (text: string) => void;

  /** Placeholder del input */
  placeholder?: string;

  /** Mensaje de error a mostrar debajo del input */
  error?: string;

  /** Si true, oculta el texto (para contraseñas) */
  secureTextEntry?: boolean;

  /** Tipo de teclado a mostrar */
  keyboardType?: KeyboardTypeOptions;

  /** Capitalización automática */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /** Icono a la izquierda (nombre de Ionicons) */
  leftIcon?: keyof typeof Ionicons.glyphMap;

  /** Icono a la derecha (nombre de Ionicons) */
  rightIcon?: keyof typeof Ionicons.glyphMap;

  /** Callback cuando se presiona el icono derecho */
  onRightIconPress?: () => void;

  /** Si true, permite múltiples líneas */
  multiline?: boolean;

  /** Número de líneas para multiline */
  numberOfLines?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 4,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Determinar estilo del borde según estado
  const getBorderStyle = () => {
    if (error) {
      return { borderColor: '#DC2626', borderWidth: 1 };
    }
    if (isFocused) {
      return { borderColor: theme.colors.primaryLight, borderWidth: 2 };
    }
    return { borderColor: '#D1D5DB', borderWidth: 1 };
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input container */}
      <View style={[styles.inputContainer, getBorderStyle()]}>
        {/* Icono izquierdo */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color="#6B7280"
            style={styles.leftIcon}
          />
        )}

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {/* Icono derecho */}
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },
});
