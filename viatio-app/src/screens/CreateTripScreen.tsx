/**
 * CREATE TRIP SCREEN
 *
 * Pantalla para crear un nuevo viaje.
 * Incluye formulario con información básica y detalles adicionales.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PageHeader,
  Card,
  Input,
  DateRangePicker,
  PrimaryButton,
  LoadingOverlay,
  PlaceAutocompleteInput,
  ScreenContainer,
} from '@/components';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { useViajesStore } from '@/store';
import { useAuth } from '@/context';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import { getPlaceDetails } from '@/services/googlePlacesService';
import { getTimeZoneFromCoordinates } from '@/services/timezoneService';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateTrip'>;

export default function CreateTripScreen({ navigation }: Props) {
  const { addViaje, loading, error: storeError, clearError } = useViajesStore();
  const { user } = useAuth();

  // Form state
  const [destino, setDestino] = useState('');
  const [destinoPlaceId, setDestinoPlaceId] = useState<string | undefined>(undefined);
  const [tripTimeZone, setTripTimeZone] = useState<string | undefined>(undefined);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [moneda, setMoneda] = useState('EUR');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Destino requerido
    if (!destino.trim()) {
      newErrors.destino = 'El destino es requerido';
    }

    // Fecha inicio requerida
    if (!fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }

    // Fecha fin requerida
    if (!fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es requerida';
    }

    // Fecha fin >= Fecha inicio
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (fin < inicio) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar selección de lugar desde el autocompletado
  const handlePlaceSelect = async (placeId: string, description: string) => {
    setDestinoPlaceId(placeId);
    console.log('[CreateTrip] Lugar seleccionado:', description, 'ID:', placeId);

    // Obtener detalles del lugar para derivar la timezone
    try {
      const placeDetails = await getPlaceDetails(placeId);

      if (placeDetails && placeDetails.latitude && placeDetails.longitude) {
        // Derivar timezone IANA desde las coordenadas usando tz-lookup
        const tz = getTimeZoneFromCoordinates(placeDetails.latitude, placeDetails.longitude);

        if (tz) {
          setTripTimeZone(tz);
          console.log('[CreateTrip] Timezone detectada:', tz);
        } else {
          console.warn('[CreateTrip] No se pudo derivar timezone para el lugar');
        }
      }
    } catch (error) {
      console.error('[CreateTrip] Error obteniendo detalles del lugar:', error);
      // No es un error crítico, continuar sin timezone
    }
  };

  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    if (!user?.uid) {
      showToast.error('Error', 'No se pudo identificar el usuario. Inicia sesión nuevamente.');
      return;
    }

    // Limpiar error previo del store
    clearError();

    const viaje = await addViaje(
      {
        destino: destino.trim(),
        destinoPlaceId: destinoPlaceId,
        tripTimeZone: tripTimeZone,
        fechaInicio,
        fechaFin,
        moneda,
      },
      user.uid
    );

    if (viaje) {
      showToast.success('Éxito', 'Viaje creado correctamente');
      navigation.goBack();
    } else {
      // Mostrar error específico del store (puede incluir info de solapamiento)
      const errorMsg = storeError || 'No se pudo crear el viaje. Inténtalo de nuevo.';
      showToast.error('Error', errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Nuevo viaje" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
          >
          {/* Información del viaje */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primaryLight} />
              </View>
              <Text style={styles.sectionTitle}>Información del viaje</Text>
            </View>

            <PlaceAutocompleteInput
              label="Destino"
              value={destino}
              onChangeText={setDestino}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Ej: París, Francia"
              error={errors.destino}
            />

            <DateRangePicker
              label="Fechas del viaje"
              startDate={fechaInicio}
              endDate={fechaFin}
              onChangeRange={(range) => {
                setFechaInicio(range.startDate);
                setFechaFin(range.endDate);
              }}
              placeholder="Seleccionar fechas"
              error={errors.fechaInicio || errors.fechaFin}
            />

            <CurrencyPicker
              value={moneda}
              onChange={setMoneda}
              label="Divisa del viaje"
            />
          </Card>

          {/* Botón crear */}
          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleCreate} disabled={loading}>
              Crear viaje
            </PrimaryButton>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
      <LoadingOverlay visible={loading} message="Creando viaje..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    paddingTop: theme.spacing.md,
  },
});
