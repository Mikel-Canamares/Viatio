/**
 * SCREEN: TripCalendarScreen
 *
 * Calendario mensual que muestra eventos de viajes (reservas, actividades, etc.)
 * Permite navegar entre meses y ver detalles de eventos por dia.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, Card, DayEventsModal } from '@/components';
import { CalendarDay } from '@/components/CalendarDay';
import type { EventoAgendaCalendario } from '@/components';
import { theme } from '@/config';
import type { Viaje } from '@/types/viaje';
import type { CategoriaReserva } from '@/types/reserva';
import type { TipoEvento } from '@/types/evento';
import { EVENTO_COLORS, EVENTO_LABELS } from '@/types/evento';
import { useAuth } from '@/context';
import { getViajesByUsuario } from '@/services/viajesService';
import { getReservasByViajeId } from '@/services/reservasService';
import { useReservasStore } from '@/store/reservasStore';
import { parseLocalDate, formatLocalDateISO, startOfLocalDay } from '@/utils';

interface TripCalendarScreenProps {
  viajeId?: string;
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORIA_RESERVA_VALUES: CategoriaReserva[] = [
  'transport',
  'accommodation',
  'food',
  'activity',
  'other',
];

const isCategoriaReserva = (value?: string): value is CategoriaReserva => {
  return value ? CATEGORIA_RESERVA_VALUES.includes(value as CategoriaReserva) : false;
};

export default function TripCalendarScreen({ }: TripCalendarScreenProps) {
  const { user } = useAuth();
  const reservasStoreTimestamp = useReservasStore((state) => state.reservas.length);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventos, setEventos] = useState<Map<string, EventoAgendaCalendario[]>>(new Map());
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);

  // Generar dias del calendario (incluyendo dias de otros meses)
  const generateCalendarDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Primer dia del mes (0 = domingo, 1 = lunes, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Ajustar para que lunes sea 0
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Total de dias en el mes
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Date[] = [];

    // Anadir dias del mes anterior (disabled)
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Anadir dias del mes actual
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    // Anadir dias del proximo mes para completar la grid
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  // Formatear fecha a ISO (YYYY-MM-DD) usando la función utilitaria
  const formatDateISO = formatLocalDateISO;

  const getSafeCategoria = (categoria?: string): CategoriaReserva => {
    return isCategoriaReserva(categoria) ? categoria : 'other';
  };

  // Cargar eventos del mes
  const loadEventosDelMes = useCallback(async (month: Date) => {
    if (!user) {
      setEventos(new Map());
      setViajes([]);
      return;
    }

    setLoading(true);

    try {
      const monthStart = startOfLocalDay(new Date(month.getFullYear(), month.getMonth(), 1));
      const monthEnd = startOfLocalDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));

      const viajesUsuario = await getViajesByUsuario(user.uid);
      // Filtrar solo viajes NO archivados
      const viajesActivos = viajesUsuario.filter((v) => v.archived === 0);
      setViajes(viajesActivos);

      const eventosMap = new Map<string, EventoAgendaCalendario[]>();

      await Promise.all(
        viajesActivos.map(async (viaje) => {
          const viajeInicio = parseLocalDate(viaje.fechaInicio);
          const viajeFin = parseLocalDate(viaje.fechaFin);
          const intersectsMonth = viajeFin >= monthStart && viajeInicio <= monthEnd;

          if (!intersectsMonth) {
            return;
          }

          const reservas = await getReservasByViajeId(viaje.id);

          reservas.forEach((reserva) => {
            if (!reserva.fechaInicio) {
              console.log('[TripCalendarScreen] Reserva sin fechaInicio:', reserva.id, reserva.nombre);
              return;
            }

            console.log('[TripCalendarScreen] Procesando reserva:', {
              id: reserva.id,
              nombre: reserva.nombre,
              fechaInicio: reserva.fechaInicio,
              categoria: reserva.categoria,
            });

            const fechaReserva = parseLocalDate(reserva.fechaInicio);

            console.log('[TripCalendarScreen] Fecha parseada:', {
              fechaReserva,
              month: fechaReserva.getMonth(),
              year: fechaReserva.getFullYear(),
              currentMonth: month.getMonth(),
              currentYear: month.getFullYear(),
            });

            if (
              fechaReserva.getMonth() !== month.getMonth() ||
              fechaReserva.getFullYear() !== month.getFullYear()
            ) {
              console.log('[TripCalendarScreen] Reserva descartada: fuera del mes');
              return;
            }

            const fechaISO = formatDateISO(fechaReserva);
            const categoria = getSafeCategoria(reserva.categoria);

            const evento: EventoAgendaCalendario = {
              id: reserva.id,
              tipo: 'reserva',
              hora: reserva.horaInicio || undefined,
              titulo: reserva.nombre,
              subtitulo: reserva.proveedor,
              categoria,
              ubicacion: reserva.ubicacion || reserva.direccion,
              tieneReserva: true,
              tieneDocumento: Boolean(reserva.documentoId),
              viajeId: viaje.id,
            };

            const eventosDia = eventosMap.get(fechaISO) || [];
            eventosMap.set(fechaISO, [...eventosDia, evento]);
          });
        })
      );

      eventosMap.forEach((lista) => {
        lista.sort((a, b) => {
          if (!a.hora) return 1;
          if (!b.hora) return -1;
          return a.hora.localeCompare(b.hora);
        });
      });

      setEventos(eventosMap);

      setSelectedDate((prev) => {
        if (!prev) return prev;
        const sameMonth =
          prev.getMonth() === month.getMonth() && prev.getFullYear() === month.getFullYear();
        return sameMonth ? prev : null;
      });
    } catch (error) {
      console.error('Error loading eventos del mes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener eventos de un dia
  const getEventosDelDia = (date: Date): EventoAgendaCalendario[] => {
    const key = formatDateISO(date);
    return eventos.get(key) || [];
  };

  // Manejar seleccion de dia
  const handleDayPress = (date: Date) => {
    const eventosDelDia = getEventosDelDia(date);
    // Solo abrir modal si hay eventos o si está dentro de un viaje
    if (eventosDelDia.length > 0 || isDateInAnyTrip(date)) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalVisible(false);
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

  // Verificar si una fecha es del mes actual (USED IN RENDER)
  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  // Verificar si fecha esta dentro de algun viaje
  const isDateInAnyTrip = (date: Date): boolean => {
    const target = startOfLocalDay(date);
    return viajes.some((viaje) => {
      const inicio = parseLocalDate(viaje.fechaInicio);
      const fin = parseLocalDate(viaje.fechaFin);
      return target >= inicio && target <= fin;
    });
  };

  // Navegar al mes anterior
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navegar al mes siguiente
  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Recargar eventos cuando cambia el mes o cuando se modifican las reservas
  useEffect(() => {
    loadEventosDelMes(currentMonth);
  }, [currentMonth, loadEventosDelMes, reservasStoreTimestamp]);

  // Recargar eventos cada vez que la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      console.log('[TripCalendarScreen] Pantalla enfocada, recargando eventos');
      loadEventosDelMes(currentMonth);
    }, [currentMonth, loadEventosDelMes])
  );

  const calendarDays = generateCalendarDays(currentMonth);
  const eventosDelDiaSeleccionado = selectedDate ? getEventosDelDia(selectedDate) : [];

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

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Actualizando eventos...</Text>
              </View>
            )}

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
                const dateString = day ? formatDateISO(day) : null;
                const isSelected =
                  selectedDate && dateString
                    ? formatDateISO(selectedDate) === dateString
                    : false;

                return (
                  <CalendarDay
                    key={index}
                    date={day}
                    isSelected={isSelected}
                    isToday={isToday(day)}
                    isInTrip={isDateInAnyTrip(day)}
                    eventos={dateString ? getEventosDelDia(day) : []}
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

          {/* Modal de eventos del día */}
          {selectedDate && (
            <DayEventsModal
              visible={modalVisible}
              date={selectedDate}
              eventos={eventosDelDiaSeleccionado}
              onClose={handleCloseModal}
            />
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
});
