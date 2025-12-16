/**
 * ARCHIVED TRIPS SCREEN
 *
 * Pantalla que muestra los viajes archivados del usuario.
 * Permite desarchivar o eliminar permanentemente los viajes.
 */

import { useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PageHeader, TripCard } from '@/components';
import { useViajesStore } from '@/store';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { getViajeRelatedCounts } from '@/services';

type Props = NativeStackScreenProps<HomeStackParamList, 'ArchivedTrips'>;

export default function ArchivedTripsScreen({ navigation }: Props) {
  const { viajes, loading, fetchArchivedViajes, unarchiveViaje, deleteViajeCompletely } =
    useViajesStore();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchArchivedViajes(user.uid);
    }
  }, [user?.uid, fetchArchivedViajes]);

  const handleTripPress = (viajeId: string) => {
    navigation.navigate('TripDetail', { viajeId });
  };

  const handleUnarchiveTrip = async (viajeId: string) => {
    try {
      await unarchiveViaje(viajeId);
      // Recargar lista de archivados para reflejar el cambio
      if (user?.uid) {
        await fetchArchivedViajes(user.uid);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo desarchivar el viaje');
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
        `Vas a eliminar permanentemente "${destino}".\n\n${message}`,
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

  // Estado de carga
  if (loading && viajes.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Viajes Archivados"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
          <Text style={styles.loadingText}>Cargando viajes archivados...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (viajes.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Viajes Archivados"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="archive-outline"
            size={80}
            color={theme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No tienes viajes archivados</Text>
          <Text style={styles.emptyDescription}>
            Los viajes se archivan automáticamente al día siguiente de su fecha de fin.
            También puedes archivar manualmente deslizando una tarjeta.
          </Text>
        </View>
      </View>
    );
  }

  // Lista de viajes archivados
  return (
    <View style={styles.container}>
      <PageHeader
        title="Viajes Archivados"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={viajes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard
            viaje={item}
            onPress={() => handleTripPress(item.id)}
            onArchive={() => handleUnarchiveTrip(item.id)}
            onDelete={() => handleDeleteTrip(item.id, item.destino)}
            isArchived={true}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        style={styles.list}
      />
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
});
