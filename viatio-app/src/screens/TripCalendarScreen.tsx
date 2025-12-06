/**
 * SCREEN: TripCalendarScreen
 *
 * Calendario mensual que muestra eventos de viajes (reservas, actividades, etc.)
 * Permite navegar entre meses y ver detalles de eventos por día.
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, Card, SectionHeader, CategoryBadge } from '@/components';
import { CalendarDay } from '@/components/CalendarDay';
import { theme } from '@/config';
import type { EventoCalendario, TipoEvento } from '@/types/evento';
import { EVENTO_COLORS, EVENTO_LABELS } from '@/types/evento';

interface TripCalendarScreenProps {
  viajeId?: string;
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function TripCalendarScreen({ }: TripCalendarScreenProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Map<string, EventoCalendario[]>>(new Map());
  const [loading, setLoading] = useState(false);

  // Generar días del calendario (incluyendo días de otros meses)
  const generateCalendarDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Primer día del mes (0 = domingo, 1 = lunes, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Ajustar para que lunes sea 0
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Total de días en el mes
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Date[] = [];

    // Añadir días del mes anterior (disabled)
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Añadir días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    // Añadir días del próximo mes para completar la grid
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  // Formatear fecha a ISO (YYYY-MM-DD)
  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Obtener eventos de un día
  const getEventosDelDia = (dateString: string): EventoCalendario[] => {
    return eventos.get(dateString) || [];
  };

  // Manejar selección de día
  const handleDayPress = (date: Date) => {
    const dateString = formatDateISO(date);
    setSelectedDate(dateString);
  };

  // Verificar si una fecha es hoy
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Verificar si una fecha es del mes actual
  // Verificar si una fecha es del mes actual (USED IN RENDER)
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // Navegar al mes anterior
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Cargar eventos del mes (mock data por ahora)
  useEffect(() => {
    const loadEventos = async () => {
      setLoading(true);

      // TODO: Aquí se cargarán eventos reales de la BD
      // Por ahora, datos de ejemplo
      const mockEventos = new Map<string, EventoCalendario[]>();

      // Añadir algunos eventos de ejemplo
      const currentYear = currentMonth.getFullYear();
      const currentMonthNum = currentMonth.getMonth();

      // Evento de ejemplo 1 - día 15
      const date1 = new Date(currentYear, currentMonthNum, 15);
      const dateStr1 = formatDateISO(date1);
      mockEventos.set(dateStr1, [
        {
          id: '1',
          fecha: dateStr1,
          hora: '10:00',
          titulo: 'Vuelo a Madrid',
          tipo: 'transport',
          tieneReserva: true,
          tieneDocumento: true,
        },
        {
          id: '2',
          fecha: dateStr1,
          hora: '16:00',
          titulo: 'Check-in Hotel',
          tipo: 'accommodation',
          tieneReserva: true,
        },
      ]);

      // Evento de ejemplo 2 - día 20
      const date2 = new Date(currentYear, currentMonthNum, 20);
      const dateStr2 = formatDateISO(date2);
      mockEventos.set(dateStr2, [
        {
          id: '3',
          fecha: dateStr2,
          hora: '12:00',
          titulo: 'Visita al Museo',
          tipo: 'activity',
          tieneReserva: false,
        },
      ]);

      setEventos(mockEventos);
      setLoading(false);
    };

    loadEventos();
  }, [currentMonth]);

  const calendarDays = generateCalendarDays(currentMonth);
  const eventosDelDiaSeleccionado = selectedDate ? getEventosDelDia(selectedDate) : [];

  // Obtener icono según tipo de evento
  const getEventIcon = (tipo: TipoEvento): keyof typeof Ionicons.glyphMap => {
    switch (tipo) {
      case 'transport': return 'airplane';
      case 'accommodation': return 'bed';
      case 'food': return 'restaurant';
      case 'activity': return 'ticket';
      default: return 'calendar';
    }
  };

  return (
    <ScreenContainer>
      <PageHeader title="Calendario" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Calendar Card */}
          <Card>
            {/* Month Header */}
            <View style={styles.monthHeader}>
              <Pressable onPress={handlePreviousMonth} style={styles.monthButton}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
              </Pressable>

              <Text style={styles.monthText}>
                {MESES_NOMBRES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>

              <Pressable onPress={handleNextMonth} style={styles.monthButton}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Week Days */}
            <View style={styles.weekDaysRow}>
              {DIAS_SEMANA.map((day) => (
                <View key={day} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const dateString = day
                  ? formatDateISO(day)
                  : null;

                return (
                  <CalendarDay
                    key={index}
                    date={day}
                    isSelected={dateString === selectedDate}
                    isToday={isToday(day)}
                    isInTrip={false} // Todo: Implement trip range logic
                    eventos={dateString ? getEventosDelDia(dateString) : []}
                    onPress={() => handleDayPress(day)}
                    disabled={!isCurrentMonth(day)}
                  />
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {(['transport', 'accommodation', 'food', 'activity'] as TipoEvento[]).map((tipo) => (
                <View key={tipo} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: EVENTO_COLORS[tipo] }]} />
                  <Text style={styles.legendText}>{EVENTO_LABELS[tipo]}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Eventos del día seleccionado */}
          {selectedDate && (
            <View style={styles.eventsSection}>
              <SectionHeader title="Eventos del día" />

              {eventosDelDiaSeleccionado.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No hay eventos este día</Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {eventosDelDiaSeleccionado.map((evento) => (
                    <Card key={evento.id}>
                      <View style={styles.eventCard}>
                        {/* Icon */}
                        <View
                          style={[
                            styles.eventIcon,
                            { backgroundColor: `${EVENTO_COLORS[evento.tipo]}20` },
                          ]}
                        >
                          <Ionicons
                            name={getEventIcon(evento.tipo)}
                            size={24}
                            color={EVENTO_COLORS[evento.tipo]}
                          />
                        </View>

                        {/* Content */}
                        <View style={styles.eventContent}>
                          <View style={styles.eventHeader}>
                            {evento.hora && (
                              <>
                                <Text style={styles.eventTime}>{evento.hora}</Text>
                                <Text style={styles.eventSeparator}>·</Text>
                              </>
                            )}
                            <Text style={styles.eventTitle}>{evento.titulo}</Text>
                          </View>

                          <CategoryBadge category={evento.tipo} label={EVENTO_LABELS[evento.tipo]} />

                          {/* Indicators */}
                          {(evento.tieneReserva || evento.tieneDocumento) && (
                            <View style={styles.eventIndicators}>
                              {evento.tieneReserva && (
                                <View style={styles.indicator}>
                                  <Ionicons name="bookmark" size={12} color={theme.colors.primary} />
                                  <Text style={styles.indicatorText}>Reserva</Text>
                                </View>
                              )}
                              {evento.tieneDocumento && (
                                <View style={styles.indicator}>
                                  <Ionicons name="document" size={12} color={theme.colors.primary} />
                                  <Text style={styles.indicatorText}>Documento</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  monthButton: {
    padding: theme.spacing.sm,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  eventsSection: {
    gap: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  eventsList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  eventSeparator: {
    fontSize: 14,
    color: theme.colors.border,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  eventIndicators: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
});
