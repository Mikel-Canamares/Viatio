/**
 * TRIP AGENDA SCREEN
 *
 * Pantalla de agenda del viaje.
 * Muestra días agrupados con eventos (reservas y lugares).
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  AgendaCard,
  NavigationChoiceModal,
  PrimaryButton,
  CopilotFAB,
} from '@/components';
import { theme } from '@/config';
import { getAgendaByViajeId } from '@/services/agendaService';
import type { DiaAgenda, EventoAgenda } from '@/types/diaViaje';
import type { HomeStackParamList } from '@/navigation/types';
import { useEventosStore } from '@/store/eventosStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripAgenda'>;

interface AgendaSection extends DiaAgenda {
  data: EventoAgenda[];
}

export default function TripAgendaScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;
  const [agenda, setAgenda] = useState<AgendaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventoAgenda | null>(null);

  useEffect(() => {
    loadAgenda();
  }, [viajeId]);

  // Refrescar al volver de añadir reserva/lugar
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAgenda();
    });

    return unsubscribe;
  }, [navigation, viajeId]);

  const loadAgenda = async () => {
    try {
      setLoading(true);
      const data = await getAgendaByViajeId(viajeId);
      // Transformar a formato de SectionList
      const sections: AgendaSection[] = data.map((dia) => ({
        ...dia,
        data: dia.eventos,
      }));
      setAgenda(sections);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDayHeader = ({ section }: { section: AgendaSection }) => (
    <View style={styles.dayHeader}>
      <Text style={styles.dayHeaderText}>
        {section.diaSemana}, {section.fechaFormateada}
      </Text>
    </View>
  );

  const handleEventPress = (item: EventoAgenda) => {
    // Eventos personalizados
    if (item.origen === 'evento_personalizado') {
      // Siempre mostrar modal de elección para eventos personalizados
      setSelectedEvent(item);
      setShowChoiceModal(true);
      return;
    }

    // Reservas
    if (item.tipo === 'reserva' && item.reservaId) {
      // Si la reserva tiene un lugar asociado, mostrar modal de elección
      if (item.lugarId) {
        setSelectedEvent(item);
        setShowChoiceModal(true);
      } else {
        // Si no tiene lugar, navegar directo a la reserva
        navigation.navigate('ReservationDetail', {
          viajeId,
          reservaId: item.reservaId,
        });
      }
    } else if (item.tipo === 'lugar') {
      // Navegar al mapa y centrar en el lugar
      navigation.navigate('TripMap', {
        viajeId,
        lugarId: item.id, // Pasar el ID del lugar para centrarlo
      });
    }
  };

  const handleAddEvento = () => {
    navigation.navigate('AddEvento', { viajeId });
  };

  const handleViewReservation = () => {
    if (selectedEvent?.origen === 'evento_personalizado') {
      // Es un evento personalizado
      navigation.navigate('EventoDetail', { eventoId: selectedEvent.id });
    } else if (selectedEvent?.reservaId) {
      // Es una reserva
      navigation.navigate('ReservationDetail', {
        viajeId,
        reservaId: selectedEvent.reservaId,
      });
    }
  };

  const handleViewMap = () => {
    // Si tiene lugarId (reserva con lugar asociado), navegar al lugar
    if (selectedEvent?.lugarId) {
      navigation.navigate('TripMap', {
        viajeId,
        lugarId: selectedEvent.lugarId,
      });
    }
    // Si es evento personalizado con ubicación, navegar al mapa (podría centrarse en coordenadas en el futuro)
    else if (selectedEvent?.origen === 'evento_personalizado' && selectedEvent?.ubicacion) {
      navigation.navigate('TripMap', { viajeId });
    }
  };

  const renderEvent = ({ item }: { item: EventoAgenda }) => {
    return (
      <AgendaCard
        evento={item}
        onPress={() => handleEventPress(item)}
      />
    );
  };

  const renderEmptyDay = ({ section }: { section: AgendaSection }) => {
    if (section.data.length > 0) return null;

    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Sin eventos programados</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Agenda" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando agenda...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Agenda" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <SectionList
          sections={agenda}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          renderSectionHeader={renderDayHeader}
          renderSectionFooter={renderEmptyDay}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.eventSeparator} />}
          SectionSeparatorComponent={() => <View style={styles.daySeparator} />}
        />
      </ScreenContainer>

      {/* Modal de elección de navegación */}
      <NavigationChoiceModal
        visible={showChoiceModal}
        titulo={selectedEvent?.titulo || ''}
        onClose={() => setShowChoiceModal(false)}
        onViewReservation={handleViewReservation}
        onViewMap={handleViewMap}
        reservationLabel={selectedEvent?.origen === 'evento_personalizado' ? 'Ver evento' : 'Ver reserva'}
        reservationDescription={
          selectedEvent?.origen === 'evento_personalizado'
            ? 'Ver detalles del evento'
            : 'Detalles, confirmación y documentos'
        }
        showMapOption={
          // Mostrar opción de mapa si:
          // - Es una reserva/lugar con lugarId, o
          // - Es evento personalizado con ubicación
          !!(selectedEvent?.lugarId ||
             (selectedEvent?.origen === 'evento_personalizado' && selectedEvent?.ubicacion))
        }
      />

      {/* Botón fijo para añadir evento */}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleAddEvento}>
          Añadir evento
        </PrimaryButton>
      </View>

      {/* COPILOT TEMPORALMENTE DESACTIVADO - Mantener implementación pero ocultar acceso
      <CopilotFAB
        onPress={() => navigation.navigate('Assistant', { viajeId })}
        style={{ bottom: 100 }}
      />
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: theme.spacing.md,
    paddingBottom: 100, // Espacio para el botón fijo
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  dayHeader: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  emptyCard: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  eventSeparator: {
    height: theme.spacing.sm,
  },
  daySeparator: {
    height: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.card,
  },
});
