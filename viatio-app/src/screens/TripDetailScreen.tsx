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
import { ScreenContainer, Card, MembersSection, ShareTripModal, DualTimeDisplay } from '@/components';
import { getViajeById } from '@/services'; // getViajeStats temporalmente desactivado
import type { Viaje } from '@/types/viaje'; // ViajeStats temporalmente desactivado
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { parseLocalDate } from '@/utils';
import { showToast } from '@/utils/toast';
import { useRealtimeSync } from '@/hooks';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { getDeviceTimeZone } from '@/services/timezoneService';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDetail'>;

export default function TripDetailScreen({ navigation, route }: Props) {
  const { viajeId } = route.params;
  const [viaje, setViaje] = useState<Viaje | null>(null);
  // const [stats, setStats] = useState<ViajeStats | null>(null); // TEMPORALMENTE DESACTIVADO
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const { config } = useConfiguracionStore();

  // Memoizar loadData para evitar recrearlo en cada render
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const viajeData = await getViajeById(viajeId);
      // Stats temporalmente desactivadas
      // const [viajeData, statsData] = await Promise.all([
      //   getViajeById(viajeId),
      //   getViajeStats(viajeId),
      // ]);
      setViaje(viajeData);
      // setStats(statsData);
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

  // Refs para debounce de recarga de stats
  const reloadStatsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Callbacks memoizados con debounce para evitar recargas múltiples
  const handleReservationsChange = useCallback(() => {
    console.log('[TripDetail] Reservas actualizadas, programando recarga de stats...');

    // Cancelar timeout pendiente si existe
    if (reloadStatsTimeoutRef.current) {
      clearTimeout(reloadStatsTimeoutRef.current);
    }

    // Programar recarga con debounce de 500ms
    reloadStatsTimeoutRef.current = setTimeout(() => {
      console.log('[TripDetail] Ejecutando recarga de stats');
      // getViajeStats(viajeId).then(setStats).catch(console.error); // TEMPORALMENTE DESACTIVADO
    }, 500);
  }, [viajeId]);

  const handlePlacesChange = useCallback(() => {
    console.log('[TripDetail] Lugares actualizados, programando recarga de stats...');

    // Cancelar timeout pendiente si existe
    if (reloadStatsTimeoutRef.current) {
      clearTimeout(reloadStatsTimeoutRef.current);
    }

    // Programar recarga con debounce de 500ms
    reloadStatsTimeoutRef.current = setTimeout(() => {
      console.log('[TripDetail] Ejecutando recarga de stats');
      // getViajeStats(viajeId).then(setStats).catch(console.error); // TEMPORALMENTE DESACTIVADO
    }, 500);
  }, [viajeId]);

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (reloadStatsTimeoutRef.current) {
        clearTimeout(reloadStatsTimeoutRef.current);
      }
    };
  }, []);

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
      case 'checklist':
        navigation.navigate('TripChecklist', { viajeId });
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

  // Obtener timezones para mostrar dual time
  const tripTimeZone = viaje.tripTimeZone;
  const homeTimeZone = config.homeTimeZone || getDeviceTimeZone();
  const showDualTime = tripTimeZone && homeTimeZone && tripTimeZone !== homeTimeZone;

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
          {/* Dual Time Display - Mostrar solo si hay timezone del viaje y es diferente a la home */}
          {showDualTime && (
            <DualTimeDisplay
              tripTimeZone={tripTimeZone!}
              homeTimeZone={homeTimeZone}
              style={styles.dualTimeContainer}
            />
          )}

          {/* Estadísticas - TEMPORALMENTE OCULTAS */}
          {/* {stats && (
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
          )} */}

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

            {/* Checklist */}
            <Card onPress={() => handleNavigate('checklist')} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={[styles.iconContainer, styles.iconChecklist]}>
                  <Ionicons name="checkbox-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Checklist</Text>
                  <Text style={styles.menuDescription}>Cosas pendientes del viaje</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>

            {/* Asistente */}
            <Card onPress={() => navigation.navigate('Assistant', { viajeId })} style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={[styles.iconContainer, styles.iconAsistente]}>
                  <Ionicons name="sparkles" size={24} color="#6366F1" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Asistente</Text>
                  <Text style={styles.menuDescription}>Tu copiloto de viaje IA</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>
          </View>

          {/* Sección de miembros / compartir viaje */}
          <MembersSection
            viaje={viaje}
            onShareTrip={handleShareTrip}
            onViewMembers={handleViewMembers}
            onInvite={handleInvite}
          />
        </View>
      </ScrollView>

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
  dualTimeContainer: {
    marginBottom: theme.spacing.lg,
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
  iconChecklist: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Verde checklist
  },
  iconAsistente: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // Índigo
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
