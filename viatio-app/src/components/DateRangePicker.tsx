/**
 * DATE RANGE PICKER
 *
 * Componente de selección de rango de fechas con calendario visual.
 * Permite seleccionar fecha de inicio y fin en un mismo calendario,
 * mostrando los días intermedios coloreados para mayor claridad.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { theme } from '@/config';

interface DateRange {
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string; // ISO string (YYYY-MM-DD)
}

interface DateRangePickerProps {
  label: string;
  startDate: string;
  endDate: string;
  onChangeRange: (range: { startDate: string; endDate: string }) => void;
  placeholder?: string;
  error?: string;
}

export function DateRangePicker({
  label,
  startDate,
  endDate,
  onChangeRange,
  placeholder = 'Seleccionar fechas',
  error,
}: DateRangePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Formatear rango para mostrar
  const displayValue = startDate && endDate
    ? `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`
    : startDate
    ? `${format(new Date(startDate), 'dd/MM/yyyy')} - ...`
    : '';

  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString;

    // Si no hay fecha de inicio o ya hay ambas (reiniciar selección)
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(selectedDate);
      setTempEndDate('');
    }
    // Si hay fecha de inicio pero no de fin
    else if (tempStartDate && !tempEndDate) {
      // Si la fecha seleccionada es anterior a la de inicio, intercambiar
      if (selectedDate < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(selectedDate);
      } else {
        setTempEndDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      onChangeRange({
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowModal(false);
  };

  // Generar objeto de marcado para el calendario
  const getMarkedDates = () => {
    if (!tempStartDate) return {};

    const marked: any = {};
    const start = new Date(tempStartDate);
    const end = tempEndDate ? new Date(tempEndDate) : null;

    // Marcar día de inicio
    marked[tempStartDate] = {
      startingDay: true,
      color: theme.colors.primaryLight,
      textColor: '#FFFFFF',
    };

    // Si hay fecha de fin, marcar rango
    if (end && tempStartDate !== tempEndDate) {
      // Marcar días intermedios
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1);

      while (currentDate < end) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        marked[dateString] = {
          color: '#DBEAFE',
          textColor: theme.colors.text,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Marcar día de fin
      marked[tempEndDate] = {
        endingDay: true,
        color: theme.colors.primaryLight,
        textColor: '#FFFFFF',
      };
    }

    return marked;
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input simulado (Pressable) */}
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.input,
          error && styles.inputError,
        ]}
      >
        <Text style={[styles.inputText, !displayValue && styles.placeholder]}>
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

      {/* Modal con calendario */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar fechas</Text>
              <Pressable onPress={handleCancel}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Instrucciones */}
            <Text style={styles.instructions}>
              {!tempStartDate
                ? 'Selecciona la fecha de inicio'
                : !tempEndDate
                ? 'Selecciona la fecha de fin'
                : 'Rango seleccionado. Pulsa Confirmar o toca un día para cambiar.'}
            </Text>

            {/* Calendario */}
            <Calendar
              current={tempStartDate || undefined}
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={getMarkedDates()}
              theme={{
                todayTextColor: theme.colors.primaryLight,
                arrowColor: theme.colors.primaryLight,
                monthTextColor: theme.colors.text,
                textMonthFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 16,
              }}
            />

            {/* Botones */}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  (!tempStartDate || !tempEndDate) && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!tempStartDate || !tempEndDate}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
