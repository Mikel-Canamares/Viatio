/**
 * TIME INPUT
 *
 * Input de hora con picker personalizado moderno.
 * Formato 24h: HH:mm
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { CustomTimePicker } from './CustomTimePicker';

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

  const displayValue = value || '';

  const handleConfirm = (time: string) => {
    onChangeTime(time);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handlePress = () => {
    setShowPicker(true);
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
          value && styles.inputFilled,
          error && styles.inputError,
        ]}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={
            value ? theme.colors.primaryLight : theme.colors.textSecondary
          }
        />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
      </Pressable>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Custom Time Picker */}
      <CustomTimePicker
        visible={showPicker}
        value={value}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.subtitle,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  inputFilled: {
    borderColor: theme.colors.primaryLight,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 102, 204, 0.03)',
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  inputText: {
    flex: 1,
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  placeholder: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
