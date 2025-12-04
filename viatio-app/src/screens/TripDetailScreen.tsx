/**
 * TRIP DETAIL SCREEN
 *
 * Pantalla de detalle de un viaje con estadísticas y navegación a subsecciones.
 * Incluye imagen hero, stats y menú de navegación.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Card } from '@/components';
import { getViajeById, getViajeStats } from '@/services';
import type { Viaje, ViajeStats } from '@/types/viaje';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDetail'>;

export default function TripDetailScreen({ navigation, route }: Props) {
  const { viajeId } = route.params;
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [stats, setStats] = useState<ViajeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [viajeId]);

  // Refrescar stats al volver de otras pantallas
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, viajeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viajeData, statsData] = await Promise.all([
        getViajeById(viajeId),
        getViajeStats(viajeId),
      ]);
      setViaje(viajeData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading trip detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'agenda':
        navigation.navigate('TripAgenda', { viajeId });
        break;
      case 'reservations':
        navigation.navigate('TripReservations', { viajeId });
        break;
      case 'map':
        // TODO: Implementar cuando exista TripMap
        console.log('Navigate to: map for trip:', viajeId);
        break;
      case 'documents':
        navigation.navigate('TripDocuments', { viajeId });
        break;
      default:
        console.log('Unknown screen:', screen);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryLight} />
      </View>
    );
  }

  if (!viaje) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el viaje</Text>
      </View>
    );
  }

  const fechasFormateadas = `${format(new Date(viaje.fechaInicio), 'd MMM', { locale: es })} – ${format(new Date(viaje.fechaFin), 'd MMM', { locale: es })}`;

  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll}>
        {/* Hero Image con overlay */}
        <View style={styles.heroContainer}>
          {viaje.imagenUrl ? (
            <Image source={{ uri: viaje.imagenUrl }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroImage}
            />
          )}

          {/* Overlay oscuro */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
            style={styles.heroOverlay}
          />

          {/* Botón back */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Información sobre la imagen */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{viaje.destino}</Text>
            <Text style={styles.heroSubtitle}>{fechasFormateadas}</Text>
          </View>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {/* Estadísticas */}
          {stats && (
            <View style={styles.statsRow}>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statNumber}>{stats.diasTotales}</Text>
                <Text style={styles.statLabel}>días</Text>
              </Card>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statNumber}>{stats.reservasCount}</Text>
                <Text style={styles.statLabel}>reservas</Text>
              </Card>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statNumber}>{stats.lugaresCount}</Text>
                <Text style={styles.statLabel}>lugares</Text>
              </Card>
            </View>
          )}

          {/* Menú de navegación */}
          <View style={styles.menuContainer}>
            {/* Agenda */}
            <Card onPress={() => handleNavigate('agenda')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={24} color={theme.colors.primaryLight} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Agenda</Text>
                  <Text style={styles.menuDescription}>Tu itinerario día a día</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>

            {/* Reservas */}
            <Card onPress={() => handleNavigate('reservations')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="receipt-outline" size={24} color={theme.colors.primaryLight} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Reservas</Text>
                  <Text style={styles.menuDescription}>Vuelos, hoteles y más</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>

            {/* Mapa */}
            <Card onPress={() => handleNavigate('map')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="map-outline" size={24} color={theme.colors.primaryLight} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Mapa</Text>
                  <Text style={styles.menuDescription}>Lugares por visitar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>

            {/* Documentos */}
            <Card onPress={() => handleNavigate('documents')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-outline" size={24} color={theme.colors.primaryLight} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Documentos</Text>
                  <Text style={styles.menuDescription}>Billetes y confirmaciones</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primaryLight,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  menuContainer: {
    gap: theme.spacing.sm,
  },
  menuCard: {
    marginBottom: theme.spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
