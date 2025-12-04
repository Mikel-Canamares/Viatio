import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader } from '@/components';
import { PlaceSearchBar } from '@/components/PlaceSearchBar';
import { PlaceDetailCard } from '@/components/PlaceDetailCard';
import { AddToTripModal } from '@/components/AddToTripModal';
import { SavedPlacesAccordion } from '@/components/SavedPlacesAccordion';
import { PlaceResult } from '@/types/googlePlaces';
import { Lugar, LUGAR_CATEGORIAS, CategoriaLugar } from '@/types/lugar';
import {
  searchNearbyPlaces,
  getPlaceDetails,
} from '@/services/googlePlacesService';
import {
  getLugaresByViajeId,
  createLugar,
  deleteLugar,
  toggleVisitado,
} from '@/services/lugaresService';
import { theme } from '@/config/theme';

type RouteParams = {
  TripMap: {
    viajeId: string;
  };
};

type ViewMode = 'map' | 'list';

// Región por defecto (Madrid)
const DEFAULT_REGION: Region = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function TripMapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'TripMap'>>();
  const { viajeId } = route.params;
  const mapRef = useRef<MapView>(null);

  // Estados
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [showPlaceCard, setShowPlaceCard] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [placeToAdd, setPlaceToAdd] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  // Cargar lugares guardados
  useFocusEffect(
    useCallback(() => {
      loadLugares();
    }, [viajeId])
  );

  const loadLugares = async () => {
    try {
      const data = await getLugaresByViajeId(viajeId);
      setLugares(data);

      // Centrar mapa en los lugares si hay
      if (data.length > 0) {
        const newRegion = calculateRegion(data);
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error('Error cargando lugares:', error);
    }
  };

  // Calcular región para que todos los lugares sean visibles
  const calculateRegion = (lugaresData: Lugar[]): Region => {
    const lugaresConCoords = lugaresData.filter((l) => l.latitud && l.longitud);

    if (lugaresConCoords.length === 0) return DEFAULT_REGION;

    if (lugaresConCoords.length === 1) {
      return {
        latitude: lugaresConCoords[0].latitud!,
        longitude: lugaresConCoords[0].longitud!,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const lats = lugaresConCoords.map((l) => l.latitud!);
    const lngs = lugaresConCoords.map((l) => l.longitud!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * 1.5 || 0.02;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.02;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };
  };

  // Manejar tap en el mapa
  const handleMapPress = async (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;

    // Verificar si tocó un POI (Point of Interest)
    const poiId = (event.nativeEvent as any).placeId;

    setLoading(true);

    try {
      let placeDetails: PlaceResult | null = null;

      if (poiId) {
        // Si tocó un POI, obtener detalles directamente
        console.log('[Map] POI tocado:', poiId);
        placeDetails = await getPlaceDetails(poiId);
      } else {
        // Si tocó cualquier punto, buscar lugar cercano
        console.log('[Map] Punto tocado:', coordinate);
        const nearbyPlaces = await searchNearbyPlaces(
          coordinate.latitude,
          coordinate.longitude,
          100, // 100 metros de radio
          1    // Solo el más cercano
        );

        if (nearbyPlaces.length > 0) {
          // Obtener detalles completos del lugar más cercano
          placeDetails = await getPlaceDetails(nearbyPlaces[0].placeId);
        }
      }

      if (placeDetails) {
        setSelectedPlace(placeDetails);
        setShowPlaceCard(true);

        // Centrar mapa en el lugar
        mapRef.current?.animateToRegion({
          latitude: placeDetails.latitude,
          longitude: placeDetails.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 300);
      } else {
        Alert.alert('Sin información', 'No se encontró información para este punto');
      }
    } catch (error) {
      console.error('Error obteniendo lugar:', error);
      Alert.alert('Error', 'No se pudo obtener información del lugar');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de lugar desde búsqueda
  const handleSelectSearchResult = async (place: PlaceResult) => {
    setLoading(true);

    try {
      // Obtener detalles completos
      const details = await getPlaceDetails(place.placeId);

      if (details) {
        setSelectedPlace(details);
        setShowPlaceCard(true);

        // Centrar mapa en el lugar
        mapRef.current?.animateToRegion({
          latitude: details.latitude,
          longitude: details.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 300);
      }
    } catch (error) {
      console.error('Error obteniendo detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Añadir lugar al viaje
  const handleAddToTrip = (place: PlaceResult) => {
    setPlaceToAdd(place);
    setShowPlaceCard(false);
    setShowAddModal(true);
  };

  // Confirmar añadir lugar
  const handleConfirmAdd = async (
    place: PlaceResult,
    diaId: string | null,
    categoria: CategoriaLugar
  ) => {
    setLoadingAdd(true);

    try {
      await createLugar({
        viajeId,
        diaId: diaId || undefined,
        nombre: place.name,
        descripcion: place.description,
        categoria,
        direccion: place.address,
        latitud: place.latitude,
        longitud: place.longitude,
      });

      Alert.alert('Lugar añadido', `"${place.name}" añadido a tu viaje`);
      setShowAddModal(false);
      setPlaceToAdd(null);
      setSelectedPlace(null);

      // Recargar lugares
      await loadLugares();
    } catch (error) {
      console.error('Error añadiendo lugar:', error);
      Alert.alert('Error', 'No se pudo añadir el lugar');
    } finally {
      setLoadingAdd(false);
    }
  };

  // Manejar selección de lugar guardado
  const handleSelectLugar = (lugar: Lugar) => {
    if (lugar.latitud && lugar.longitud) {
      mapRef.current?.animateToRegion({
        latitude: lugar.latitud,
        longitude: lugar.longitud,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 300);
      setViewMode('map');
    }
  };

  // Toggle visitado
  const handleToggleVisitado = async (lugar: Lugar) => {
    try {
      await toggleVisitado(lugar.id);
      await loadLugares();
    } catch (error) {
      console.error('Error actualizando lugar:', error);
    }
  };

  // Eliminar lugar
  const handleDeleteLugar = (lugar: Lugar) => {
    Alert.alert(
      'Eliminar lugar',
      `¿Eliminar "${lugar.nombre}" de tu viaje?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLugar(lugar.id);
              Alert.alert('Eliminado', 'Lugar eliminado del viaje');
              await loadLugares();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <PageHeader
        title="Mapa"
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            style={styles.headerButton}
          >
            <Ionicons
              name={viewMode === 'map' ? 'list-outline' : 'map-outline'}
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
        }
      />

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <PlaceSearchBar
              onSelectPlace={handleSelectSearchResult}
              latitude={region.latitude}
              longitude={region.longitude}
              placeholder="Buscar restaurantes, museos..."
            />
          </View>

          {/* Mapa */}
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onPress={handleMapPress}
            onPoiClick={(e) => handleMapPress(e as any)}
            showsUserLocation
            showsMyLocationButton
            showsPointsOfInterest={true}
            showsBuildings={true}
          >
            {/* Marcadores de lugares guardados */}
            {lugares.map((lugar) => {
              if (!lugar.latitud || !lugar.longitud) return null;
              const config = LUGAR_CATEGORIAS[lugar.categoria] || LUGAR_CATEGORIAS.other;

              return (
                <Marker
                  key={lugar.id}
                  coordinate={{
                    latitude: lugar.latitud,
                    longitude: lugar.longitud,
                  }}
                  title={lugar.nombre}
                  pinColor={config.color}
                  onPress={() => handleSelectLugar(lugar)}
                />
              );
            })}

            {/* Marcador del lugar seleccionado */}
            {selectedPlace && (
              <Marker
                coordinate={{
                  latitude: selectedPlace.latitude,
                  longitude: selectedPlace.longitude,
                }}
                pinColor={theme.colors.primaryLight}
              />
            )}
          </MapView>

          {/* Indicador de carga */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
          )}

          {/* Contador de lugares */}
          {lugares.length > 0 && (
            <Pressable
              style={styles.lugaresCounter}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="bookmark" size={16} color={theme.colors.primaryLight} />
              <Text style={styles.lugaresCounterText}>
                {lugares.length} {lugares.length === 1 ? 'lugar' : 'lugares'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      ) : (
        /* Vista de lista */
        <SavedPlacesAccordion
          lugares={lugares}
          onSelectLugar={handleSelectLugar}
          onToggleVisitado={handleToggleVisitado}
          onDeleteLugar={handleDeleteLugar}
        />
      )}

      {/* Tarjeta de detalle del lugar (Bottom Sheet) */}
      <Modal
        visible={showPlaceCard && selectedPlace !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaceCard(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPlaceCard(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedPlace && (
              <PlaceDetailCard
                place={selectedPlace}
                onClose={() => setShowPlaceCard(false)}
                onAddToTrip={handleAddToTrip}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para seleccionar día */}
      <AddToTripModal
        visible={showAddModal}
        place={placeToAdd}
        viajeId={viajeId}
        onClose={() => {
          setShowAddModal(false);
          setPlaceToAdd(null);
        }}
        onConfirm={handleConfirmAdd}
        loading={loadingAdd}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  map: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  lugaresCounter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lugaresCounterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
});
