/**
 * TRIP LIST SCREEN
 *
 * Pantalla principal que muestra la lista de viajes del usuario.
 * Incluye búsqueda, filtros y FAB para crear nuevo viaje.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, Alert, Pressable } from 'react-native';
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

type Props = NativeStackScreenProps<HomeStackParamList, 'TripList'>;

export default function TripListScreen({ navigation }: Props) {
  const { viajes, loading, fetchViajes, archiveViaje, deleteViajeCompletely } =
    useViajesStore();
  const { user } = useAuth();
  const [repairExecuted, setRepairExecuted] = useState(false);

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
      Alert.alert('Error', 'No se pudo archivar el viaje');
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
                Alert.alert('Error', 'No se pudo eliminar el viaje');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener información del viaje');
    }
  };

  const handleNavigateToArchived = () => {
    navigation.navigate('ArchivedTrips');
  };

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
              onPress={handleNavigateToArchived}
              style={styles.archivedButton}
            >
              <Ionicons name="archive-outline" size={24} color={theme.colors.primaryForeground} />
            </Pressable>
          }
        />
        <ScreenContainer>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="airplane-outline"
              size={80}
              color={theme.colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No tienes viajes</Text>
            <Text style={styles.emptyDescription}>
              Crea tu primer viaje para empezar a organizar tu aventura
            </Text>
            <PrimaryButton onPress={handleCreateTrip}>
              Crear viaje
            </PrimaryButton>
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
            onPress={handleNavigateToArchived}
            style={styles.archivedButton}
          >
            <Ionicons name="archive-outline" size={24} color={theme.colors.primaryForeground} />
          </Pressable>
        }
      />
      <FlatList
        data={viajes}
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
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
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
  archivedButton: {
    padding: theme.spacing.sm,
  },
});
