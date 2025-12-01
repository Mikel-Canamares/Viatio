/**
 * DATE INPUT
 *
 * Input de fecha con DateTimePicker nativo.
 * Formato español: dd/MM/yyyy
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { theme } from '@/config';

interface DateInputProps {
  label: string;
  value: string; // ISO string (YYYY-MM-DD)
  onChangeDate: (date: string) => void;
  placeholder?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DateInput({
  label,
  value,
  onChangeDate,
  placeholder = 'Seleccionar fecha',
  error,
  minDate,
  maxDate,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Convertir ISO string a Date o usar fecha actual
  const dateValue = value ? new Date(value) : new Date();

  // Formatear fecha para mostrar
  const displayValue = value
    ? format(dateValue, 'dd/MM/yyyy')
    : '';

  const handleChange = (_event: any, selectedDate?: Date) => {
    // En Android, el picker se cierra automáticamente
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      // Convertir a ISO string (YYYY-MM-DD)
      const isoString = format(selectedDate, 'yyyy-MM-dd');
      onChangeDate(isoString);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleClose = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input simulado (Pressable) */}
      <Pressable
        onPress={handlePress}
        style={[
          styles.input,
          error && styles.inputError,
        ]}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.colors.textMuted}
        />
      </Pressable>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* DateTimePicker */}
      {showPicker && (
        <>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
          {/* iOS: Botón para cerrar */}
          {Platform.OS === 'ios' && (
            <Pressable onPress={handleClose} style={styles.iosCloseButton}>
              <Text style={styles.iosCloseButtonText}>Cerrar</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  inputText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  iosCloseButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  iosCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
