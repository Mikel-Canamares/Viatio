/**
 * TIME INPUT
 *
 * Input de hora con DateTimePicker nativo.
 * Formato 24h: HH:mm
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface TimeInputProps {
  label: string;
  value: string; // Formato "HH:mm" (ej: "14:30")
  onChangeTime: (time: string) => void;
  placeholder?: string;
  error?: string;
}

export function TimeInput({
  label,
  value,
  onChangeTime,
  placeholder = 'Seleccionar hora',
  error,
}: TimeInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Convertir string "HH:mm" a Date para el picker
  const getDateFromTimeString = (timeStr: string): Date => {
    const now = new Date();
    if (timeStr && timeStr.trim() !== '') {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        now.setHours(hours, minutes, 0, 0);
      }
    }
    return now;
  };

  const dateValue = getDateFromTimeString(value);

  // Formatear Date a string "HH:mm" - SIEMPRE en hora local
  const formatTimeString = (date: Date): string => {
    // Obtener horas y minutos en zona horaria local del dispositivo
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const displayValue = value || '';

  const handleChange = (_event: any, selectedDate?: Date) => {
    // En Android, el picker se cierra automáticamente
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      const timeString = formatTimeString(selectedDate);
      onChangeTime(timeString);
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
          name="time-outline"
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
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleChange}
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
