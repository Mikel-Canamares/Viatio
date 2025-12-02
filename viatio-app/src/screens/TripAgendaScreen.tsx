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
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '@/components';
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
      <View style={styles.dayIconContainer}>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.primaryLight} />
      </View>
      <View>
        <Text style={styles.dayName}>{section.diaSemana}</Text>
        <Text style={styles.dayDate}>{section.fechaFormateada}</Text>
      </View>
    </View>
  );

  const renderEvent = ({ item }: { item: EventoAgenda }) => (
    <Card style={styles.eventCard}>
      <View style={styles.eventContent}>
        {/* Badge de hora */}
        {item.hora && (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color={theme.colors.primaryLight} />
            <Text style={styles.timeText}>{item.hora}</Text>
          </View>
        )}

        {/* Contenido del evento */}
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{item.titulo}</Text>

          {item.subtitulo && (
            <Text style={styles.eventSubtitle}>{item.subtitulo}</Text>
          )}

          {item.ubicacion && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.ubicacion}
              </Text>
            </View>
          )}

          {item.categoria && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.categoria}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  const renderEmptyDay = ({ section }: { section: AgendaSection }) => {
    if (section.data.length > 0) return null;

    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyText}>Sin actividades programadas</Text>
        <View style={styles.emptyActions}>
          <Pressable
            style={styles.emptyLink}
            onPress={() => {
              // TODO: Navegar a añadir reserva
              console.log('Añadir reserva para día:', section.dia.fecha);
            }}
          >
            <Text style={styles.emptyLinkText}>Añadir reserva</Text>
          </Pressable>
          <Text style={styles.emptySeparator}>·</Text>
          <Pressable
            style={styles.emptyLink}
            onPress={() => {
              // TODO: Navegar a añadir lugar
              console.log('Añadir lugar para día:', section.dia.fecha);
            }}
          >
            <Text style={styles.emptyLinkText}>Añadir lugar</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
          <Text style={styles.loadingText}>Cargando agenda...</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={agenda}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        renderSectionHeader={renderDayHeader}
        renderSectionFooter={renderEmptyDay}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.eventSeparator} />}
        SectionSeparatorComponent={() => <View style={styles.daySeparator} />}
      />
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>
      <View style={styles.headerTitle}>
        <Text style={styles.titleText}>Agenda</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  dayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  dayDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  eventCard: {
    padding: theme.spacing.md,
  },
  eventContent: {
    gap: theme.spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    fontWeight: '500',
  },
  eventDetails: {
    gap: theme.spacing.xs,
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
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  emptyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  emptyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyLink: {
    paddingVertical: 4,
  },
  emptyLinkText: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    fontWeight: '500',
  },
  emptySeparator: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  eventSeparator: {
    height: theme.spacing.sm,
  },
  daySeparator: {
    height: theme.spacing.lg,
  },
});
