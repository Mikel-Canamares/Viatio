/**
 * TRIP RESERVATIONS SCREEN
 *
 * Pantalla de reservas del viaje.
 * Muestra lista de reservas con filtros por categoría.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/dateUtils';
import {
  PageHeader,
  ReservationCard,
  PrimaryButton,
  ScreenContainer,
  CustomModal,
} from '@/components';
import { theme } from '@/config';
import { useReservasStore } from '@/store/reservasStore';
import type { CategoriaReserva, Reserva } from '@/types/reserva';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripReservations'>;

const FILTROS: Array<{ key: CategoriaReserva | 'all'; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'transport', label: 'Transporte' },
  { key: 'accommodation', label: 'Alojamiento' },
  { key: 'food', label: 'Restaurantes' },
  { key: 'activity', label: 'Actividades' },
];

export default function TripReservationsScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;
  const { reservas, loading, fetchReservas, removeReserva } = useReservasStore();
  const [filtroActivo, setFiltroActivo] = useState<CategoriaReserva | 'all'>('all');
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    reserva: Reserva | null;
  }>({ visible: false, reserva: null });

  useEffect(() => {
    loadReservas();
  }, [viajeId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReservas();
    });

    return unsubscribe;
  }, [navigation, viajeId]);

  const loadReservas = async () => {
    await fetchReservas(viajeId);
  };

  const reservasFiltradas =
    filtroActivo === 'all'
      ? reservas
      : reservas.filter((r) => r.categoria === filtroActivo);

  const reservasConfirmadas = reservas.filter((r) => r.estadoPago === 'paid').length;

  // Agrupar reservas por fecha
  const reservasPorFecha = reservasFiltradas.reduce((acc, reserva) => {
    const fecha = reserva.fechaInicio || 'Sin fecha';
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(reserva);
    return acc;
  }, {} as Record<string, Reserva[]>);

  // Convertir a formato de SectionList
  const sections = Object.entries(reservasPorFecha)
    .map(([fecha, items]) => ({
      title: fecha,
      data: items.sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || '')),
    }))
    .sort((a, b) => {
      if (a.title === 'Sin fecha') return 1;
      if (b.title === 'Sin fecha') return -1;
      return a.title.localeCompare(b.title);
    });

  const formatFechaHeader = (fecha: string) => {
    if (fecha === 'Sin fecha') return 'Sin fecha';
    try {
      // FIX: Usar parseLocalDate para evitar problemas de zona horaria
      return format(parseLocalDate(fecha), "EEEE, d 'de' MMMM", { locale: es });
    } catch {
      return fecha;
    }
  };

  const handleNavigateToReservation = (reservaId: string) => {
    navigation.navigate('ReservationDetail', { viajeId, reservaId });
  };

  const handleEditReservation = (reserva: Reserva) => {
    navigation.navigate('EditReservation', { reservaId: reserva.id });
  };

  const handleDeleteReservation = (reserva: Reserva) => {
    setDeleteModal({ visible: true, reserva });
  };

  const confirmDeleteReservation = async () => {
    if (deleteModal.reserva) {
      await removeReserva(deleteModal.reserva.id);
      await loadReservas();
    }
  };

  const handleAddReservation = () => {
    navigation.navigate('AddReservation', { viajeId });
  };

  const renderFiltro = (filtro: { key: CategoriaReserva | 'all'; label: string }) => {
    const isActive = filtroActivo === filtro.key;

    return (
      <Pressable
        key={filtro.key}
        onPress={() => setFiltroActivo(filtro.key)}
        style={[styles.filtroChip, isActive && styles.filtroChipActive]}
      >
        <Text style={[styles.filtroText, isActive && styles.filtroTextActive]}>
          {filtro.label}
        </Text>
      </Pressable>
    );
  };


  if (loading && reservas.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader title="Reservas" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando reservas...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Reservas" onBack={() => navigation.goBack()} />
      <ScreenContainer>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Todas las reservas</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {reservasConfirmadas} confirmadas
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContainer}
          style={styles.filtrosScroll}
        >
          {FILTROS.map(renderFiltro)}
        </ScrollView>

        {sections.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={64} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No tienes reservas</Text>
              <Text style={styles.emptyDescription}>
                Añade tus vuelos, hoteles y actividades
              </Text>
            </View>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ReservationCard
                reserva={item}
                onPress={() => handleNavigateToReservation(item.id)}
                onEdit={() => handleEditReservation(item)}
                onDelete={() => handleDeleteReservation(item)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatFechaHeader(section.title)}
                </Text>
                <Text style={styles.dateHeaderCount}>
                  {section.data.length} {section.data.length === 1 ? 'reserva' : 'reservas'}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            stickySectionHeadersEnabled={false}
            style={styles.listContainer}
          />
        )}

        <View style={styles.buttonContainer}>
          <PrimaryButton onPress={handleAddReservation}>
            Añadir reserva
          </PrimaryButton>
        </View>
      </View>

      {/* Modal de confirmación de eliminación */}
      <CustomModal
        visible={deleteModal.visible}
        type="warning"
        title="Eliminar reserva"
        message={`¿Estás seguro de que quieres eliminar "${deleteModal.reserva?.nombre}"?`}
        onClose={() => setDeleteModal({ visible: false, reserva: null })}
        primaryButton={{
          text: 'Eliminar',
          onPress: confirmDeleteReservation,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => {},
        }}
      />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  counterBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filtrosScroll: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  filtrosContainer: {
    gap: theme.spacing.xs,
  },
  filtroChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtroChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  filtroText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  filtroTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  dateHeaderCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingBottom: theme.spacing.md,
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
