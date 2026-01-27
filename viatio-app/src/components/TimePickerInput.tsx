/**
 * COMPONENTE: TimePickerInput
 *
 * Input para seleccionar hora con picker personalizado moderno.
 * Usa CustomTimePicker con diseño mejorado y atractivo.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { CustomTimePicker } from './CustomTimePicker';

interface TimePickerInputProps {
  label: string;
  value: string | undefined; // Formato HH:MM
  onChange: (time: string | undefined) => void;
  placeholder?: string;
  clearable?: boolean;
}

export function TimePickerInput({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar hora',
  clearable = true,
}: TimePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleConfirm = (time: string) => {
    onChange(time);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.input, value && styles.inputFilled]}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={
            value ? theme.colors.primaryLight : theme.colors.textSecondary
          }
        />
        <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
          {value || placeholder}
        </Text>

        {value && clearable && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>

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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  inputFilled: {
    borderColor: theme.colors.primaryLight,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 102, 204, 0.03)',
  },
  inputText: {
    flex: 1,
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputPlaceholder: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
});
