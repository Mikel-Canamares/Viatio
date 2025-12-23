/**
 * COMPONENTE: TimePickerInput
 *
 * Input para seleccionar hora con picker nativo.
 * Maneja diferencias entre iOS (modal) y Android (inline).
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

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

  // Convertir string HH:MM a Date
  const getDateFromTime = (time?: string): Date => {
    const date = new Date();
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  };

  // Convertir Date a string HH:MM
  const getTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (selectedDate) {
      onChange(getTimeFromDate(selectedDate));
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const handleConfirm = () => {
    setShowPicker(false);
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

      {/* iOS: Modal con picker */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerCancel}>Cancelar</Text>
                </Pressable>
                <Text style={styles.pickerTitle}>{label}</Text>
                <Pressable onPress={handleConfirm}>
                  <Text style={styles.pickerDone}>Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={getDateFromTime(value)}
                mode="time"
                display="spinner"
                onChange={handleChange}
                minuteInterval={5}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Android: Picker inline */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={getDateFromTime(value)}
          mode="time"
          display="default"
          onChange={handleChange}
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputFilled: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: 'rgba(0, 102, 204, 0.02)',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputPlaceholder: {
    color: theme.colors.textSecondary,
  },
  // Modal styles (iOS)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pickerCancel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
});
