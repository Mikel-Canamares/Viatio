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
  Alert,
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
} from '@/components';
import { useViajesStore } from '@/store';
import { useAuth } from '@/context';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateTrip'>;

export default function CreateTripScreen({ navigation }: Props) {
  const { addViaje, loading, error: storeError, clearError } = useViajesStore();
  const { user } = useAuth();

  // Form state
  const [destino, setDestino] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [numViajeros, setNumViajeros] = useState('1');

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

  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'No se pudo identificar el usuario. Inicia sesión nuevamente.');
      return;
    }

    // Limpiar error previo del store
    clearError();

    const viaje = await addViaje(
      {
        destino: destino.trim(),
        fechaInicio,
        fechaFin,
        descripcion: descripcion.trim() || undefined,
        presupuesto: presupuesto ? parseFloat(presupuesto) : undefined,
        numViajeros: parseInt(numViajeros) || 1,
      },
      user.uid
    );

    if (viaje) {
      Alert.alert('Éxito', 'Viaje creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      // Mostrar error específico del store (puede incluir info de solapamiento)
      const errorMsg = storeError || 'No se pudo crear el viaje. Inténtalo de nuevo.';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <PageHeader title="Nuevo viaje" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
          {/* Card 1: Información básica */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primaryLight} />
              </View>
              <Text style={styles.sectionTitle}>Información básica</Text>
            </View>

            <PlaceAutocompleteInput
              label="Destino"
              value={destino}
              onChangeText={setDestino}
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

            <Input
              label="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Añade notas sobre tu viaje..."
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Card 2: Detalles adicionales */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, styles.iconContainerAmber]}>
                <Ionicons name="wallet-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>Detalles adicionales</Text>
            </View>

            <Input
              label="Presupuesto estimado (opcional)"
              value={presupuesto}
              onChangeText={(text) => {
                // Permitir solo números y un punto decimal
                const filteredText = text.replace(/[^0-9.]/g, '');
                const parts = filteredText.split('.');
                // Evitar múltiples puntos decimales
                if (parts.length > 2) return;
                setPresupuesto(filteredText);
              }}
              placeholder="€"
              keyboardType="decimal-pad"
            />

            <Input
              label="Número de viajeros"
              value={numViajeros}
              onChangeText={setNumViajeros}
              placeholder="1"
              keyboardType="numeric"
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
      </View>

      <LoadingOverlay visible={loading} message="Creando viaje..." />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  iconContainerAmber: {
    backgroundColor: '#FEF3C7',
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
