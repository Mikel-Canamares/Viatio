/**
 * COMPONENTE: DayPicker
 *
 * Modal para seleccionar un día del viaje.
 * Muestra lista de días con número, fecha formateada y opción de selección.
 */

import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { theme } from '@/config/theme';
import { parseLocalDate } from '@/utils';

export interface DiaViaje {
  numeroDia: number;
  fecha: Date;
  fechaISO: string;
  label: string;
  diaId?: string; // ID del día en la BD (opcional)
}

interface DayPickerProps {
  visible: boolean;
  diasViaje: DiaViaje[];
  selectedDia: DiaViaje | null;
  onSelect: (dia: DiaViaje) => void;
  onClose: () => void;
}

export function DayPicker({
  visible,
  diasViaje,
  selectedDia,
  onSelect,
  onClose,
}: DayPickerProps) {
  const handleDaySelect = (dia: DiaViaje) => {
    onSelect(dia);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona el día</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.daysList}>
            {diasViaje.map((dia) => {
              const isSelected = selectedDia?.numeroDia === dia.numeroDia;

              return (
                <Pressable
                  key={dia.numeroDia}
                  style={({ pressed }) => [
                    styles.dayItem,
                    isSelected && styles.dayItemSelected,
                    pressed && styles.dayItemPressed,
                  ]}
                  onPress={() => handleDaySelect(dia)}
                >
                  <View style={styles.dayItemContent}>
                    <View
                      style={[
                        styles.dayNumberBadge,
                        isSelected && { backgroundColor: theme.colors.primaryLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          isSelected && { color: '#FFFFFF' },
                        ]}
                      >
                        {dia.numeroDia}
                      </Text>
                    </View>
                    <View style={styles.dayTextContainer}>
                      <Text
                        style={[
                          styles.dayLabel,
                          isSelected && {
                            color: theme.colors.primaryLight,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {dia.label}
                      </Text>
                      <Text style={styles.dayDate}>
                        {format(dia.fecha, 'EEEE, d MMMM yyyy', { locale: es })}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primaryLight}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

/**
 * Hook auxiliar para generar días del viaje a partir de fechas
 */
export function useDiasViaje(
  fechaInicio: string,
  fechaFin: string,
  diasDB?: Array<{ id: string; numeroDia?: number; fecha: string }>
): DiaViaje[] {
  const inicio = parseLocalDate(fechaInicio);
  const fin = parseLocalDate(fechaFin);
  const totalDias = differenceInDays(fin, inicio) + 1;

  const dias: DiaViaje[] = [];
  for (let i = 0; i < totalDias; i++) {
    const fecha = addDays(inicio, i);
    const fechaISO = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const label = `Día ${i + 1} - ${format(fecha, 'd MMM', { locale: es })}`;

    // Buscar el diaId correspondiente en la BD por fecha
    const diaDB = diasDB?.find((d) => d.fecha === fechaISO);

    dias.push({
      numeroDia: i + 1,
      fecha,
      fechaISO,
      label,
      diaId: diaDB?.id,
    });
  }

  return dias;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '80%',
    ...theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  daysList: {
    maxHeight: 500,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayItemSelected: {
    backgroundColor: `${theme.colors.primaryLight}10`,
  },
  dayItemPressed: {
    backgroundColor: theme.colors.secondary,
  },
  dayItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  dayNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  dayTextContainer: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
});
