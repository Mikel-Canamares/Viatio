/**
 * TRIP LIST SCREEN
 *
 * Pantalla principal que muestra la lista de viajes del usuario.
 * Incluye búsqueda, filtros y FAB para crear nuevo viaje.
 */

import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  TripCard,
  FloatingActionButton,
  PrimaryButton,
} from '@/components';
import { useViajesStore } from '@/store';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { repairViajesSinDias } from '@/services';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripList'>;

export default function TripListScreen({ navigation }: Props) {
  const { viajes, loading, fetchViajes } = useViajesStore();
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

  const handleTripPress = (viajeId: string) => {
    navigation.navigate('TripDetail', { viajeId });
  };

  const handleCreateTrip = () => {
    navigation.navigate('CreateTrip');
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
        <PageHeader title="Mis Viajes" />
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
      <PageHeader title="Mis Viajes" />
      <FlatList
        data={viajes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard
            viaje={item}
            onPress={() => handleTripPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        style={styles.list}
      />

      {/* Floating Action Button */}
      <FloatingActionButton icon="add" onPress={handleCreateTrip} />
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
    paddingBottom: 120, // Espacio para FAB
  },
  separator: {
    height: theme.spacing.md,
  },
});
