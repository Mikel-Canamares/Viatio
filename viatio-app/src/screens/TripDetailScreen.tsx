/**
 * TRIP DETAIL SCREEN
 *
 * Pantalla de detalle de un viaje con estadísticas y navegación a subsecciones.
 * Incluye imagen hero, stats y menú de navegación.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { ScreenContainer, Card, CopilotFAB, MembersSection, ShareTripModal } from '@/components';
import { getViajeById, getViajeStats } from '@/services';
import type { Viaje, ViajeStats } from '@/types/viaje';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { parseLocalDate } from '@/utils';
import { showToast } from '@/utils/toast';
import { useRealtimeSync } from '@/hooks';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDetail'>;

export default function TripDetailScreen({ navigation, route }: Props) {
  const { viajeId } = route.params;
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [stats, setStats] = useState<ViajeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  // Memoizar loadData para evitar recrearlo en cada render
  const loadData = useCallback(async () => {
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
  }, [viajeId]);

  // Usar ref para el firestoreId y isShared para evitar que cambien en cada render
  const isSharedRef = useRef(viaje?.isShared === 1);
  const firestoreIdRef = useRef(viaje?.firestoreId || null);

  // Actualizar refs cuando cambia el viaje
  useEffect(() => {
    isSharedRef.current = viaje?.isShared === 1;
    firestoreIdRef.current = viaje?.firestoreId || null;
  }, [viaje]);

  // Callbacks memoizados para evitar recrearlos
  const handleReservationsChange = useCallback(() => {
    console.log('[TripDetail] Reservas actualizadas, recargando stats...');
    getViajeStats(viajeId).then(setStats).catch(console.error);
  }, [viajeId]);

  const handlePlacesChange = useCallback(() => {
    console.log('[TripDetail] Lugares actualizados, recargando stats...');
    getViajeStats(viajeId).then(setStats).catch(console.error);
  }, [viajeId]);

  // Sincronización en tiempo real para viajes compartidos
  // Solo usar valores derivados del viaje una vez cargado
  const isShared = viaje?.isShared === 1;
  const firestoreId = viaje?.firestoreId || null;

  useRealtimeSync(firestoreId, viajeId, isShared, {
    onReservationsChange: handleReservationsChange,
    onPlacesChange: handlePlacesChange,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refrescar stats al volver de otras pantallas
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, loadData]);

  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'agenda':
        navigation.navigate('TripAgenda', { viajeId });
        break;
      case 'reservations':
        navigation.navigate('TripReservations', { viajeId });
        break;
      case 'map':
        navigation.navigate('TripMap', { viajeId });
        break;
      case 'documents':
        navigation.navigate('TripDocuments', { viajeId });
        break;
      case 'expenses':
        navigation.navigate('Expenses', { viajeId });
        break;
      default:
        console.log('Unknown screen:', screen);
    }
  };

  // Handlers para compartir viaje
  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  const handleShareSuccess = (firestoreId: string) => {
    setShowShareModal(false);
    showToast.success('Viaje compartido correctamente');
    // Recargar datos para mostrar el estado actualizado
    loadData();
    // Navegar a invitar miembros
    navigation.navigate('InviteToTrip', { viajeId, firestoreId });
  };

  const handleViewMembers = () => {
    if (viaje?.firestoreId) {
      navigation.navigate('TripMembers', { viajeId, firestoreId: viaje.firestoreId });
    }
  };

  const handleInvite = () => {
    if (viaje?.firestoreId) {
      navigation.navigate('InviteToTrip', { viajeId, firestoreId: viaje.firestoreId });
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

  const fechasFormateadas = `${format(parseLocalDate(viaje.fechaInicio), 'd MMM', { locale: es })} – ${format(parseLocalDate(viaje.fechaFin), 'd MMM', { locale: es })}`;

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
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
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

          {/* Sección de miembros / compartir viaje */}
          <MembersSection
            viaje={viaje}
            onShareTrip={handleShareTrip}
            onViewMembers={handleViewMembers}
            onInvite={handleInvite}
          />

          {/* Menú de navegación */}
          <View style={styles.menuContainer}>
            {/* Agenda */}
            <Card onPress={() => handleNavigate('agenda')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={[styles.iconContainer, styles.iconAgenda]}>
                  <Ionicons name="calendar-outline" size={24} color="#0066CC" />
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
                <View style={[styles.iconContainer, styles.iconReservas]}>
                  <Ionicons name="receipt-outline" size={24} color="#16A34A" />
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
                <View style={[styles.iconContainer, styles.iconMapa]}>
                  <Ionicons name="map-outline" size={24} color="#9333EA" />
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
                <View style={[styles.iconContainer, styles.iconDocumentos]}>
                  <Ionicons name="document-outline" size={24} color="#EA580C" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Documentos</Text>
                  <Text style={styles.menuDescription}>Billetes y confirmaciones</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>

            {/* Gastos */}
            <Card onPress={() => handleNavigate('expenses')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={[styles.iconContainer, styles.iconGastos]}>
                  <Ionicons name="wallet-outline" size={24} color="#FFC043" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Gastos</Text>
                  <Text style={styles.menuDescription}>Control de presupuesto</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* COPILOT TEMPORALMENTE DESACTIVADO - Mantener implementación pero ocultar acceso
      <CopilotFAB
        onPress={() => navigation.navigate('Assistant', { viajeId })}
      />
      */}

      {/* Modal de compartir viaje */}
      <ShareTripModal
        visible={showShareModal}
        viajeId={viajeId}
        viajeDestino={viaje.destino}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleShareSuccess}
      />
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  // Colores temáticos para cada sección
  iconAgenda: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)', // Azul
  },
  iconReservas: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)', // Verde
  },
  iconMapa: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)', // Morado
  },
  iconDocumentos: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)', // Naranja
  },
  iconGastos: {
    backgroundColor: 'rgba(255, 192, 67, 0.1)', // Amarillo
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
