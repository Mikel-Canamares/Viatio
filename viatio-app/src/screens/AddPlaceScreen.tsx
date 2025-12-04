/**
 * SCREEN: AddPlaceScreen
 *
 * Pantalla para añadir un nuevo lugar de interés a un viaje.
 * Permite seleccionar ubicación en mapa, categoría y asignar a un día.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  Card,
  SectionHeader,
  Input,
  PrimaryButton,
} from '@/components';
import { theme } from '@/config';
import { createLugar } from '@/services/lugaresService';
import type { CategoriaLugar } from '@/types/lugar';
import { LUGAR_CATEGORIAS } from '@/types/lugar';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddPlace'>;

// Region por defecto (Madrid, España)
const DEFAULT_REGION: Region = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const CATEGORIAS: CategoriaLugar[] = [
  'restaurant',
  'hotel',
  'attraction',
  'shopping',
  'transport',
  'other',
];

export default function AddPlaceScreen({ route, navigation }: Props) {
  const { viajeId, initialLocation } = route.params;
  const mapRef = useRef<MapView>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaLugar | null>(null);
  const [direccion, setDireccion] = useState('');
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  const [selectedDia] = useState<string | null>(null);
  // TODO: Implementar setSelectedDia cuando se tenga el selector de días
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const mapRegion: Region = coordinates
    ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setCoordinates({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  const handleChangeLocation = () => {
    setShowMap(true);
  };

  const handleSave = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del lugar es obligatorio');
      return;
    }

    if (!categoria) {
      Alert.alert('Error', 'Debes seleccionar una categoría');
      return;
    }

    try {
      setLoading(true);

      await createLugar({
        viajeId,
        diaId: selectedDia || undefined,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria,
        direccion: direccion.trim() || undefined,
        latitud: coordinates?.latitude,
        longitud: coordinates?.longitude,
      });

      Alert.alert('Éxito', 'Lugar añadido correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('[AddPlaceScreen] Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el lugar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Añadir lugar" onBack={() => navigation.goBack()} />

      <ScreenContainer>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card: Ubicación */}
          <Card style={styles.card}>
            <SectionHeader title="Ubicación" />

            {!coordinates || showMap ? (
              <>
                <Text style={styles.helpText}>Toca en el mapa para seleccionar la ubicación</Text>
                <View style={styles.mapContainer}>
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={mapRegion}
                    onPress={handleMapPress}
                    provider={PROVIDER_GOOGLE}
                  >
                    {coordinates && (
                      <Marker
                        coordinate={coordinates}
                        pinColor={categoria ? LUGAR_CATEGORIAS[categoria].color : theme.colors.primary}
                      />
                    )}
                  </MapView>
                </View>
                {coordinates && showMap && (
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => setShowMap(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirmar ubicación</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <View style={styles.mapPreviewContainer}>
                  <MapView
                    style={styles.mapPreview}
                    initialRegion={mapRegion}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    provider={PROVIDER_GOOGLE}
                  >
                    <Marker
                      coordinate={coordinates}
                      pinColor={categoria ? LUGAR_CATEGORIAS[categoria].color : theme.colors.primary}
                    />
                  </MapView>
                </View>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={16} color={theme.colors.primary} />
                  <Text style={styles.coordinatesText}>
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
                <Pressable
                  style={styles.changeLocationButton}
                  onPress={handleChangeLocation}
                >
                  <Ionicons name="pencil" size={16} color={theme.colors.primaryLight} />
                  <Text style={styles.changeLocationText}>Cambiar ubicación</Text>
                </Pressable>
              </>
            )}
          </Card>

          {/* Card: Información */}
          <Card style={styles.card}>
            <SectionHeader title="Información" />

            <Input
              label="Nombre del lugar *"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Torre Eiffel, Restaurante La Paella..."
            />

            <Input
              label="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Información adicional sobre el lugar..."
              multiline
              numberOfLines={4}
            />

            <Input
              label="Dirección"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej: Champ de Mars, 5 Avenue Anatole France"
            />
          </Card>

          {/* Card: Categoría */}
          <Card style={styles.card}>
            <SectionHeader title="Categoría" />
            <Text style={styles.helpText}>Selecciona el tipo de lugar</Text>

            <View style={styles.categoriesGrid}>
              {CATEGORIAS.map((cat) => {
                const config = LUGAR_CATEGORIAS[cat];
                const isSelected = categoria === cat;

                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryOption,
                      isSelected && {
                        backgroundColor: config.color + '15',
                        borderColor: config.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setCategoria(cat)}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: config.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={config.icon as any}
                        size={24}
                        color={config.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && { color: config.color, fontWeight: '600' },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Card: Día del viaje (TODO: cargar días del viaje) */}
          <Card style={styles.card}>
            <SectionHeader title="Día del viaje (opcional)" />
            <Text style={styles.helpText}>
              Asigna este lugar a un día específico de tu viaje
            </Text>

            <Pressable
              style={styles.daySelector}
              onPress={() => {
                // TODO: Mostrar selector de días
                Alert.alert('Próximamente', 'Selector de días en desarrollo');
              }}
            >
              <View style={styles.daySelectorContent}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                <Text style={styles.daySelectorText}>
                  {selectedDia ? `Día ${selectedDia}` : 'Sin asignar a ningún día'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </ScreenContainer>

      {/* Botón guardar fijo */}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleSave} loading={loading}>
          Guardar lugar
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPreviewContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
  },
  coordinatesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#FFFFFF',
  },
  changeLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  confirmButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryOption: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  daySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  daySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  daySelectorText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  bottomPadding: {
    height: 100,
  },
  buttonContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
