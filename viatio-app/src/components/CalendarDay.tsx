/**
 * COMPONENT: CalendarDay
 *
 * Componente para mostrar un dia individual en el calendario.
 * Muestra el numero del dia con indicadores de eventos y estados visuales.
 */

import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { theme } from '@/config';
import type { EventoAgenda } from '@/types/diaViaje';

const { width: screenWidth } = Dimensions.get('window');
// Calcular ancho de cada dia: (ancho pantalla - padding lateral - gaps) / 7
const DAY_WIDTH = (screenWidth - theme.spacing.lg * 2 - 6 * 6) / 7;

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isInTrip: boolean; // Si esta dentro de un rango de viaje
  eventos: EventoAgenda[];
  onPress: () => void;
  disabled?: boolean; // Dias de otros meses
}

/**
 * Obtiene el color del evento directamente desde iconColor
 * que ya viene del sistema centralizado
 */
const getEventColor = (event: EventoAgenda): string => {
  return event.iconColor || theme.colors.primary;
};

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

  // Obtener hasta 3 colores unicos de eventos (para los dots)
  const dotColors: string[] = [];
  eventos.forEach((event) => {
    const color = getEventColor(event);
    if (!dotColors.includes(color) && dotColors.length < 3) {
      dotColors.push(color);
    }
  });

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
      {/* Numero del dia */}
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
          {dotColors.map((color, index) => (
            <View
              key={`${color}-${index}`}
              style={[
                styles.dot,
                { backgroundColor: color },
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
    borderRadius: 999, // borderRadius full (circulo)
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
