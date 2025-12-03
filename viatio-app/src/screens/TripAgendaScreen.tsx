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
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, PageHeader, Card } from '@/components';
import { theme } from '@/config';
import { getAgendaByViajeId } from '@/services/agendaService';
import type { DiaAgenda, EventoAgenda } from '@/types/diaViaje';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripAgenda'>;

interface AgendaSection extends DiaAgenda {
  data: EventoAgenda[];
}

export default function TripAgendaScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;
  const [agenda, setAgenda] = useState<AgendaSection[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderEvent = ({ item }: { item: EventoAgenda }) => (
    <Card style={styles.eventCard}>
      <View style={styles.eventRow}>
        {/* Hora a la izquierda */}
        <View style={styles.timeContainer}>
          {item.hora ? (
            <Text style={styles.timeText}>{item.hora}</Text>
          ) : (
            <Text style={styles.timeTextEmpty}>--:--</Text>
          )}
        </View>

        {/* Contenido del evento */}
        <View style={styles.eventDetails}>
          {item.categoria && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.categoria}</Text>
            </View>
          )}

          <Text style={styles.eventTitle}>{item.titulo}</Text>

          {item.subtitulo && (
            <Text style={styles.eventSubtitle}>{item.subtitulo}</Text>
          )}

          {item.ubicacion && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.ubicacion}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

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
    paddingBottom: theme.spacing.xl * 2,
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
  eventCard: {
    padding: theme.spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  timeContainer: {
    minWidth: 50,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  timeTextEmpty: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  eventDetails: {
    flex: 1,
    gap: 4,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  eventSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    flex: 1,
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
});
