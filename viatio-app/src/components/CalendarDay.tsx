/**
 * COMPONENT: CalendarDay
 *
 * Componente para mostrar un día individual en el calendario.
 * Muestra el número del día con indicadores de eventos y estados visuales.
 */

import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { theme } from '@/config';
import type { EventoCalendario as EventoAgenda } from '@/types/evento';
import { EVENTO_COLORS } from '@/types/evento';

const { width: screenWidth } = Dimensions.get('window');
// Calcular ancho de cada día: (ancho pantalla - padding lateral - gaps) / 7
const DAY_WIDTH = (screenWidth - (theme.spacing.lg * 2) - (6 * 6)) / 7;

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isInTrip: boolean; // Si está dentro de un rango de viaje
  eventos: EventoAgenda[];
  onPress: () => void;
  disabled?: boolean; // Días de otros meses
}

export function CalendarDay({
  date,
  isSelected,
  isToday,
  isInTrip,
  eventos,
  onPress,
  disabled = false,
}: CalendarDayProps) {
  const dayNumber = date.getDate();

  // Obtener hasta 3 eventos únicos por tipo (para los dots)
  const eventTypes = eventos
    .map(e => e.tipo)
    .filter((tipo, index, self) => self.indexOf(tipo) === index)
    .slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.dayButton,
        isSelected && styles.daySelected,
        isInTrip && !isSelected && styles.dayInTrip,
        pressed && !isSelected && !disabled && styles.dayPressed,
        disabled && styles.dayDisabled,
      ]}
    >
      {/* Número del día */}
      <Text
        style={[
          styles.dayText,
          isToday && !isSelected && styles.dayTextToday,
          isSelected && styles.dayTextSelected,
          disabled && styles.dayTextDisabled,
        ]}
      >
        {dayNumber}
      </Text>

      {/* Event indicators (dots) - hasta 3 */}
      {eventos.length > 0 && !isSelected && !disabled && (
        <View style={styles.dotsContainer}>
          {eventTypes.map((type, index) => (
            <View
              key={`${type}-${index}`}
              style={[
                styles.dot,
                { backgroundColor: EVENTO_COLORS[type] },
              ]}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayButton: {
    width: DAY_WIDTH,
    aspectRatio: 1,
    borderRadius: 999, // borderRadius full (círculo)
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    backgroundColor: 'transparent',
  },
  daySelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  dayInTrip: {
    backgroundColor: `${theme.colors.primary}10`, // Azul muy claro
  },
  dayPressed: {
    opacity: 0.6,
  },
  dayDisabled: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dayTextToday: {
    color: theme.colors.primaryLight,
    fontWeight: '700', // bold
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: theme.colors.textMuted,
    opacity: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
