/**
 * TRIP LIST SCREEN
 *
 * Pantalla principal que muestra la lista de viajes del usuario.
 * Incluye búsqueda, filtros y FAB para crear nuevo viaje.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScreenContainer,
  PageHeader,
  TripCard,
  PrimaryButton,
} from '@/components';
import { useViajesStore } from '@/store';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { repairViajesSinDias, getViajeRelatedCounts } from '@/services';
import { showToast } from '@/utils/toast';
import type { Viaje } from '@/types/viaje';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripList'>;

type FilterType = 'activos' | 'completados';

/**
 * Determina si un viaje está completado (archivado o fecha fin pasada)
 */
function isViajeCompletado(viaje: Viaje): boolean {
  if (viaje.archived === 1) return true;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaFin = new Date(viaje.fechaFin);
  fechaFin.setHours(0, 0, 0, 0);

  return fechaFin < hoy;
}

export default function TripListScreen({ navigation }: Props) {
  const { viajes, loading, fetchViajes, archiveViaje, deleteViajeCompletely } =
    useViajesStore();
  const { user } = useAuth();
  const [repairExecuted, setRepairExecuted] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('activos');

  useEffect(() => {
    if (user?.uid) {
      fetchViajes(user.uid);

      // Ejecutar reparación de viajes sin días (solo una vez por sesión)
      if (!repairExecuted) {
        repairViajesSinDias(user.uid)
          .then((count) => {
            if (count > 0) {
              console.log('[TripListScreen] Viajes reparados:', count);
              // Recargar viajes si hubo reparaciones
              fetchViajes(user.uid);
            }
          })
          .catch((error) => {
            console.error('[TripListScreen] Error en reparación:', error);
          })
          .finally(() => {
            setRepairExecuted(true);
          });
      }
    }
  }, [user?.uid, fetchViajes, repairExecuted]);

  // Recargar viajes al volver a la pantalla (por ejemplo, después de desarchivar)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchViajes(user.uid);
      }
    }, [user?.uid, fetchViajes])
  );

  const handleTripPress = (viajeId: string) => {
    navigation.navigate('TripDetail', { viajeId });
  };

  const handleCreateTrip = () => {
    navigation.navigate('CreateTrip');
  };

  const handleArchiveTrip = async (viajeId: string) => {
    try {
      await archiveViaje(viajeId);
    } catch (error) {
      showToast.error('Error', 'No se pudo archivar el viaje');
    }
  };

  const handleDeleteTrip = async (viajeId: string, destino: string) => {
    try {
      // Obtener conteo de elementos relacionados
      const counts = await getViajeRelatedCounts(viajeId);
      const totalItems =
        counts.reservas + counts.lugares + counts.documentos + counts.gastos;

      const message =
        totalItems > 0
          ? `Se eliminarán:\n• ${counts.reservas} reserva(s)\n• ${counts.lugares} lugar(es)\n• ${counts.documentos} documento(s)\n• ${counts.gastos} gasto(s)\n\nEsta acción no se puede deshacer.`
          : 'Esta acción no se puede deshacer.';

      Alert.alert(
        '¿Eliminar viaje?',
        `Vas a eliminar "${destino}".\n\n${message}`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteViajeCompletely(viajeId);
              } catch (error) {
                showToast.error('Error', 'No se pudo eliminar el viaje');
              }
            },
          },
        ]
      );
    } catch (error) {
      showToast.error('Error', 'No se pudo obtener información del viaje');
    }
  };

  const handleJoinTrip = () => {
    navigation.navigate('JoinTripByCode');
  };

  // Filtrar viajes según el filtro activo
  const viajesFiltrados = useMemo(() => {
    if (filterType === 'activos') {
      return viajes.filter((v) => !isViajeCompletado(v));
    } else {
      return viajes.filter((v) => isViajeCompletado(v));
    }
  }, [viajes, filterType]);

  // Estado de carga
  if (loading && viajes.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader title="Mis Viajes" />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando viajes...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // Empty state
  if (viajes.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Mis Viajes"
          rightElement={
            <Pressable
              onPress={handleJoinTrip}
              style={styles.headerButton}
            >
              <Ionicons name="qr-code-outline" size={24} color={theme.colors.primaryForeground} />
            </Pressable>
          }
        />
        <ScreenContainer>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="airplane-outline"
              size={120}
              color={theme.colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No tienes viajes</Text>
            <Text style={styles.emptyDescription}>
              Crea tu primer viaje o únete a uno compartido con un código de invitación
            </Text>
            <View style={styles.emptyButtonContainer}>
              <Pressable
                onPress={handleCreateTrip}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.createButtonPressed,
                ]}
              >
                <Text style={styles.createButtonText}>Crear viaje</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleJoinTrip} style={styles.joinButton}>
              <Ionicons name="qr-code-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.joinButtonText}>Tengo un código de invitación</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // Lista de viajes
  return (
    <View style={styles.container}>
      <PageHeader
        title="Mis Viajes"
        rightElement={
          <Pressable
            onPress={handleJoinTrip}
            style={styles.headerButton}
          >
            <Ionicons name="qr-code-outline" size={24} color={theme.colors.primaryForeground} />
          </Pressable>
        }
      />

      {/* Filtros de viajes */}
      <View style={styles.filtersContainer}>
        <Pressable
          onPress={() => setFilterType('activos')}
          style={[
            styles.filterButton,
            filterType === 'activos' && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'activos' && styles.filterButtonTextActive,
            ]}
          >
            Activos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterType('completados')}
          style={[
            styles.filterButton,
            filterType === 'completados' && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'completados' && styles.filterButtonTextActive,
            ]}
          >
            Completados
          </Text>
        </Pressable>
      </View>

      {viajesFiltrados.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          <Ionicons
            name={filterType === 'activos' ? 'airplane-outline' : 'checkmark-circle-outline'}
            size={80}
            color={theme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyFilterTitle}>
            {filterType === 'activos' ? 'No tienes viajes activos' : 'No tienes viajes completados'}
          </Text>
          <Text style={styles.emptyFilterDescription}>
            {filterType === 'activos'
              ? 'Crea un nuevo viaje para comenzar'
              : 'Los viajes archivados o finalizados aparecerán aquí'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={viajesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              viaje={item}
              onPress={() => handleTripPress(item.id)}
              onArchive={() => handleArchiveTrip(item.id)}
              onDelete={() => handleDeleteTrip(item.id, item.destino)}
              isArchived={false}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
        />
      )}

      {/* Botón fijo en la parte inferior */}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleCreateTrip}>
          Añadir viaje
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.xl,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl * 1.5,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.sm,
  },
  emptyButtonContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  createButton: {
    width: '100%',
    backgroundColor: theme.colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonPressed: {
    backgroundColor: theme.colors.accentHover,
  },
  createButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  separator: {
    height: theme.spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  joinButtonText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  filterButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.primaryForeground,
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyFilterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyFilterDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
