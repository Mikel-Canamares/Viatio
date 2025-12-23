import { useState, useRef, useCallback, useEffect } from 'react';
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
import * as Location from 'expo-location';
import { ScreenContainer, PageHeader } from '@/components';
import { PlaceSearchBar } from '@/components/PlaceSearchBar';
import { PlaceDetailCard } from '@/components/PlaceDetailCard';
import { AddToTripModal } from '@/components/AddToTripModal';
import { SavedPlacesAccordion } from '@/components/SavedPlacesAccordion';
import { MapMarker, SelectedPlaceMarker } from '@/components/MapMarker';
import { PlaceResult } from '@/types/googlePlaces';
import { Lugar, LUGAR_CATEGORIAS, CategoriaLugar } from '@/types/lugar';
import { Viaje } from '@/types/viaje';
import { Reserva } from '@/types/reserva';
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
import { getReservasByViajeId } from '@/services/reservasService';
import { getViajeById } from '@/services/viajesService';
import { theme } from '@/config/theme';

type RouteParams = {
  TripMap: {
    viajeId: string;
    lugarId?: string;
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
  const { viajeId, lugarId } = route.params;
  const mapRef = useRef<MapView>(null);

  // Estados
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]); // Necesario para obtener iconos de subtipo
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [showPlaceCard, setShowPlaceCard] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [placeToAdd, setPlaceToAdd] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [initialMapCentered, setInitialMapCentered] = useState(false);

  // Cargar viaje y centrar mapa en destino al montar (solo si no viene de agenda)
  useEffect(() => {
    loadViajeAndCenterMap();
    requestLocationPermission();
  }, []);

  // Cargar viaje y centrar mapa en el destino
  const loadViajeAndCenterMap = async () => {
    try {
      console.log('[TripMapScreen] Cargando viaje:', viajeId);
      const viajeData = await getViajeById(viajeId);

      if (!viajeData) {
        console.error('[TripMapScreen] Viaje no encontrado');
        return;
      }

      setViaje(viajeData);
      console.log('[TripMapScreen] Viaje cargado:', viajeData.destino, 'PlaceId:', viajeData.destinoPlaceId);

      // SOLO centrar en destino si NO se proporcionó lugarId (navegación normal desde viaje)
      if (!lugarId && viajeData.destinoPlaceId) {
        console.log('[TripMapScreen] Obteniendo coordenadas del destino...');
        const destinoDetails = await getPlaceDetails(viajeData.destinoPlaceId);

        if (destinoDetails) {
          const destinoRegion: Region = {
            latitude: destinoDetails.latitude,
            longitude: destinoDetails.longitude,
            latitudeDelta: 0.1, // Zoom amplio para ver la ciudad completa
            longitudeDelta: 0.1,
          };

          console.log('[TripMapScreen] ✓ Centrando mapa en:', viajeData.destino, destinoRegion);
          setRegion(destinoRegion);
          setInitialMapCentered(true);

          // Animar al destino con delay para asegurar que el mapa está montado
          setTimeout(() => {
            mapRef.current?.animateToRegion(destinoRegion, 1000);
          }, 500);
        } else {
          console.log('[TripMapScreen] No se pudieron obtener coordenadas del destino');
        }
      } else if (lugarId) {
        console.log('[TripMapScreen] Navegación desde agenda con lugarId, omitiendo centrado en destino');
        setInitialMapCentered(true); // Marcar como centrado para que loadLugares pueda proceder
      } else {
        console.log('[TripMapScreen] Viaje sin destinoPlaceId, usando región por defecto');
      }
    } catch (error) {
      console.error('[TripMapScreen] Error cargando viaje:', error);
    }
  };

  // Solicitar permisos de ubicación
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setHasLocationPermission(true);

        // Obtener ubicación actual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation(location);
        console.log('[TripMapScreen] Ubicación del usuario obtenida');
      } else {
        setHasLocationPermission(false);
        Alert.alert(
          'Permisos de ubicación',
          'Para mostrarte en el mapa, necesitamos acceso a tu ubicación.'
        );
      }
    } catch (error) {
      console.error('Error solicitando permisos de ubicación:', error);
    }
  };

  // Cargar lugares guardados y reservas
  useFocusEffect(
    useCallback(() => {
      loadLugaresAndReservas();
    }, [viajeId])
  );

  const loadLugaresAndReservas = async () => {
    try {
      // Cargar lugares y reservas en paralelo
      const [lugaresData, reservasData] = await Promise.all([
        getLugaresByViajeId(viajeId),
        getReservasByViajeId(viajeId),
      ]);

      console.log('[TripMapScreen] Lugares cargados:', lugaresData.length);
      console.log('[TripMapScreen] Reservas cargadas:', reservasData.length);
      console.log('[TripMapScreen] Lugares con coordenadas:', lugaresData.filter(l => l.latitud && l.longitud).length);

      // Log detallado de cada lugar
      lugaresData.forEach(lugar => {
        console.log(`[TripMapScreen] Lugar: ${lugar.nombre}, lat: ${lugar.latitud}, lng: ${lugar.longitud}, categoria: ${lugar.categoria}`);
      });

      setLugares(lugaresData);
      setReservas(reservasData);

      // Si se proporciona lugarId, centrar en ese lugar específico
      if (lugarId) {
        const lugarSeleccionado = lugaresData.find(l => l.id === lugarId);
        if (lugarSeleccionado) {
          console.log('[TripMapScreen] Centrando en lugar desde agenda:', lugarSeleccionado.nombre);
          await handleSelectLugar(lugarSeleccionado);
        }
      } else if (lugaresData.length > 0 && initialMapCentered) {
        // Solo centrar mapa en lugares si:
        // 1. Hay lugares guardados
        // 2. Ya se hizo el centrado inicial en el destino (para no interferir con el centrado automático)
        const newRegion = calculateRegion(lugaresData);
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error('Error cargando lugares y reservas:', error);
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
        googlePlaceId: place.placeId, // Guardar el ID de Google Places
      });

      Alert.alert('Lugar añadido', `"${place.name}" añadido a tu viaje`);
      setShowAddModal(false);
      setPlaceToAdd(null);
      setSelectedPlace(null);

      // Recargar lugares y reservas
      await loadLugaresAndReservas();
    } catch (error) {
      console.error('Error añadiendo lugar:', error);
      Alert.alert('Error', 'No se pudo añadir el lugar');
    } finally {
      setLoadingAdd(false);
    }
  };

  // Convertir Lugar de BD a PlaceResult para mostrar en tarjeta
  const lugarToPlaceResult = (lugar: Lugar): PlaceResult => {
    return {
      placeId: lugar.id,
      name: lugar.nombre,
      address: lugar.direccion || '',
      latitude: lugar.latitud || 0,
      longitude: lugar.longitud || 0,
      types: [lugar.categoria],
      primaryType: lugar.categoria,
      description: lugar.descripcion,
    };
  };

  // Manejar selección de lugar guardado
  const handleSelectLugar = async (lugar: Lugar) => {
    if (!lugar.latitud || !lugar.longitud) return;

    // Paso A: Activar estado de carga
    setLoading(true);

    try {
      // Cambiar a vista mapa PRIMERO (para que se renderice el MapView)
      setViewMode('map');

      // Esperar un frame para que el MapView se renderice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Zoom natural tipo Google Maps (~500m vista)
      mapRef.current?.animateToRegion({
        latitude: lugar.latitud,
        longitude: lugar.longitud,
        latitudeDelta: 0.005, // Zoom natural (~500m)
        longitudeDelta: 0.005,
      }, 800);

      // Paso B & C: Fetch - Obtener detalles completos de Google Places
      let placeDetails: PlaceResult | null = null;

      if (lugar.googlePlaceId) {
        // Si tenemos el googlePlaceId guardado, usarlo directamente (ÓPTIMO)
        console.log('[handleSelectLugar] Usando googlePlaceId guardado:', lugar.googlePlaceId);
        placeDetails = await getPlaceDetails(lugar.googlePlaceId);
      } else {
        // Fallback: Buscar por coordenadas y nombre (para lugares antiguos sin googlePlaceId)
        console.log('[handleSelectLugar] googlePlaceId no disponible, buscando por coordenadas');
        const nearbyPlaces = await searchNearbyPlaces(
          lugar.latitud,
          lugar.longitud,
          50, // Radio de 50 metros
          5
        );

        const matchingPlace = nearbyPlaces.find(p =>
          p.name.toLowerCase().includes(lugar.nombre.toLowerCase()) ||
          lugar.nombre.toLowerCase().includes(p.name.toLowerCase())
        );

        if (matchingPlace) {
          console.log('[handleSelectLugar] Lugar encontrado por coordenadas:', matchingPlace.name);
          placeDetails = await getPlaceDetails(matchingPlace.placeId);
        }
      }

      if (placeDetails) {
        // Usar datos RICOS de Google Places
        setSelectedPlace(placeDetails);
        setShowPlaceCard(true);
      } else {
        // Fallback a datos locales si no se pudieron obtener detalles
        console.log('[handleSelectLugar] No se pudieron obtener detalles de Google, usando datos locales');
        const placeResult = lugarToPlaceResult(lugar);
        setSelectedPlace(placeResult);
        setShowPlaceCard(true);
      }
    } catch (error) {
      console.error('[handleSelectLugar] Error obteniendo detalles:', error);
      // Fallback a datos locales en caso de error
      const placeResult = lugarToPlaceResult(lugar);
      setSelectedPlace(placeResult);
      setShowPlaceCard(true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle visitado
  const handleToggleVisitado = async (lugar: Lugar) => {
    try {
      await toggleVisitado(lugar.id);
      await loadLugaresAndReservas();
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
              await loadLugaresAndReservas();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  // Centrar mapa en ubicación del usuario
  const handleCenterOnUserLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu ubicación para mostrarte en el mapa.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Permitir',
            onPress: () => requestLocationPermission(),
          },
        ]
      );
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);

      // Animar mapa a ubicación del usuario
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    }
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
              if (!lugar.latitud || !lugar.longitud) {
                console.log('[TripMapScreen] Lugar sin coordenadas, no se renderiza:', lugar.nombre);
                return null;
              }

              console.log('[TripMapScreen] Renderizando marcador:', lugar.nombre, lugar.latitud, lugar.longitud);

              return (
                <Marker
                  key={lugar.id}
                  coordinate={{
                    latitude: lugar.latitud,
                    longitude: lugar.longitud,
                  }}
                  title={lugar.nombre}
                  description={lugar.descripcion}
                  onPress={() => handleSelectLugar(lugar)}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <MapMarker categoria={lugar.categoria} size={40} />
                </Marker>
              );
            })}

            {/* Marcador del lugar seleccionado (solo si NO está en lugares guardados) */}
            {selectedPlace && !lugares.some(l => l.id === selectedPlace.placeId) && (
              <Marker
                coordinate={{
                  latitude: selectedPlace.latitude,
                  longitude: selectedPlace.longitude,
                }}
                title={selectedPlace.name}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <SelectedPlaceMarker color={theme.colors.primary} size={40} />
              </Marker>
            )}
          </MapView>

          {/* Indicador de carga */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
          )}

          {/* Botón de Mi Ubicación */}
          <Pressable
            style={styles.myLocationButton}
            onPress={handleCenterOnUserLocation}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="locate" size={24} color={theme.colors.primary} />
          </Pressable>

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
          reservas={reservas}
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
                hideAddButton={
                  // Verificar si ya está guardado por ID (lugares creados desde lista)
                  // o por nombre y coordenadas (lugares creados desde mapa/búsqueda)
                  lugares.some(l =>
                    l.id === selectedPlace.placeId ||
                    (l.nombre === selectedPlace.name &&
                     Math.abs((l.latitud || 0) - selectedPlace.latitude) < 0.0001 &&
                     Math.abs((l.longitud || 0) - selectedPlace.longitude) < 0.0001)
                  )
                }
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
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
});
