/**
 * CREATE TRIP SCREEN
 *
 * Pantalla para crear un nuevo viaje.
 * Incluye formulario con información básica y detalles adicionales.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PageHeader,
  Card,
  Input,
  DateInput,
  PrimaryButton,
  LoadingOverlay,
} from '@/components';
import { useViajesStore } from '@/store';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';

// TODO: Obtener usuarioId del auth store cuando esté implementado
const TEMP_USER_ID = 'user-1';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateTrip'>;

export default function CreateTripScreen({ navigation }: Props) {
  const { addViaje, loading } = useViajesStore();

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

    const viaje = await addViaje(
      {
        destino: destino.trim(),
        fechaInicio,
        fechaFin,
        descripcion: descripcion.trim() || undefined,
        presupuesto: presupuesto ? parseFloat(presupuesto) : undefined,
        numViajeros: parseInt(numViajeros) || 1,
      },
      TEMP_USER_ID
    );

    if (viaje) {
      Alert.alert('Éxito', 'Viaje creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo crear el viaje. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <View style={styles.container}>
        <PageHeader title="Nuevo viaje" onBack={() => navigation.goBack()} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Card 1: Información básica */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primaryLight} />
              </View>
              <Text style={styles.sectionTitle}>Información básica</Text>
            </View>

            <Input
              label="Destino"
              value={destino}
              onChangeText={setDestino}
              placeholder="Ej: París, Francia"
              error={errors.destino}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <DateInput
                  label="Fecha de inicio"
                  value={fechaInicio}
                  onChangeDate={setFechaInicio}
                  placeholder="dd/mm/aaaa"
                  error={errors.fechaInicio}
                />
              </View>
              <View style={styles.halfInput}>
                <DateInput
                  label="Fecha de fin"
                  value={fechaFin}
                  onChangeDate={setFechaFin}
                  placeholder="dd/mm/aaaa"
                  error={errors.fechaFin}
                  minDate={fechaInicio ? new Date(fechaInicio) : undefined}
                />
              </View>
            </View>

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
              onChangeText={setPresupuesto}
              placeholder="€"
              keyboardType="numeric"
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    paddingTop: theme.spacing.md,
  },
});
