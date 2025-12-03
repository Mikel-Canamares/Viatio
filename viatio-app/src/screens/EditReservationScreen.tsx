/**
 * EDIT RESERVATION SCREEN
 *
 * Pantalla para editar una reserva existente.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  Card,
  Input,
  DateInput,
  SectionHeader,
  PrimaryButton,
} from '@/components';
import { theme } from '@/config';
import { useReservasStore } from '@/store/reservasStore';
import { getViajeById, getReservaById } from '@/services';
import type { CreateReservaInput, CategoriaReserva } from '@/types/reserva';
import type { Viaje } from '@/types/viaje';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditReservation'>;

const CATEGORIAS_OPTIONS: Array<{ value: CategoriaReserva; label: string }> = [
  { value: 'transport', label: 'Transporte' },
  { value: 'accommodation', label: 'Alojamiento' },
  { value: 'food', label: 'Comida' },
  { value: 'activity', label: 'Actividad' },
  { value: 'other', label: 'Otro' },
];

const ESTADO_PAGO_OPTIONS = [
  { value: 'paid', label: 'Pagado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Parcial' },
];

export default function EditReservationScreen({ route, navigation }: Props) {
  const { reservaId } = route.params;
  const { updateReserva, loading: storeLoading } = useReservasStore();

  const [loading, setLoading] = useState(true);
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [formData, setFormData] = useState<Partial<CreateReservaInput>>({});

  useEffect(() => {
    loadData();
  }, [reservaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const reservaData = await getReservaById(reservaId);

      if (!reservaData) {
        Alert.alert('Error', 'No se encontró la reserva');
        navigation.goBack();
        return;
      }

      // Cargar viaje para limitar fechas
      const viajeData = await getViajeById(reservaData.viajeId);
      setViaje(viajeData);

      // Precargar formulario con datos existentes
      setFormData({
        viajeId: reservaData.viajeId,
        categoria: reservaData.categoria,
        nombre: reservaData.nombre,
        proveedor: reservaData.proveedor,
        numeroConfirmacion: reservaData.numeroConfirmacion,
        fechaInicio: reservaData.fechaInicio,
        horaInicio: reservaData.horaInicio,
        fechaFin: reservaData.fechaFin,
        horaFin: reservaData.horaFin,
        ubicacion: reservaData.ubicacion,
        direccion: reservaData.direccion,
        precio: reservaData.precio,
        moneda: reservaData.moneda,
        estadoPago: reservaData.estadoPago,
        notas: reservaData.notas,
      });
    } catch (error) {
      console.error('[EditReservationScreen] Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudo cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CreateReservaInput>(
    field: K,
    value: CreateReservaInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.categoria) {
      Alert.alert('Error', 'El nombre y la categoría son obligatorios');
      return;
    }

    const input: Partial<CreateReservaInput> = {
      categoria: formData.categoria,
      nombre: formData.nombre,
      proveedor: formData.proveedor,
      numeroConfirmacion: formData.numeroConfirmacion,
      fechaInicio: formData.fechaInicio,
      horaInicio: formData.horaInicio,
      fechaFin: formData.fechaFin,
      horaFin: formData.horaFin,
      ubicacion: formData.ubicacion,
      direccion: formData.direccion,
      precio: formData.precio,
      moneda: formData.moneda || 'EUR',
      estadoPago: formData.estadoPago || 'pending',
      notas: formData.notas,
    };

    await updateReserva(reservaId, input);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Editar reserva" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Editar reserva" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          <Card style={styles.formCard}>
            <SectionHeader title="Tipo de reserva" />
            <View style={styles.categoriaGrid}>
              {CATEGORIAS_OPTIONS.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => updateField('categoria', cat.value)}
                  style={[
                    styles.categoriaOption,
                    formData.categoria === cat.value && styles.categoriaOptionActive,
                  ]}
                >
                  <Ionicons
                    name={
                      cat.value === 'transport'
                        ? 'airplane'
                        : cat.value === 'accommodation'
                        ? 'bed'
                        : cat.value === 'food'
                        ? 'restaurant'
                        : cat.value === 'activity'
                        ? 'ticket'
                        : 'ellipsis-horizontal'
                    }
                    size={24}
                    color={
                      formData.categoria === cat.value
                        ? theme.colors.primaryLight
                        : theme.colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.categoriaOptionText,
                      formData.categoria === cat.value && styles.categoriaOptionTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.formCard}>
            <SectionHeader title="Información básica" />
            <Input
              label="Nombre"
              value={formData.nombre || ''}
              onChangeText={(value) => updateField('nombre', value)}
              placeholder="Ej: Vuelo Madrid - París"
            />
            <Input
              label="Proveedor"
              value={formData.proveedor || ''}
              onChangeText={(value) => updateField('proveedor', value)}
              placeholder="Ej: Air France"
            />
            <Input
              label="Número de confirmación"
              value={formData.numeroConfirmacion || ''}
              onChangeText={(value) => updateField('numeroConfirmacion', value)}
              placeholder="ABC123456"
            />
          </Card>

          <Card style={styles.formCard}>
            <SectionHeader title="Fecha y hora" />
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <DateInput
                  label="Fecha inicio"
                  value={formData.fechaInicio || ''}
                  onChangeDate={(value) => updateField('fechaInicio', value)}
                  minDate={viaje ? new Date(viaje.fechaInicio) : undefined}
                  maxDate={viaje ? new Date(viaje.fechaFin) : undefined}
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Hora inicio"
                  value={formData.horaInicio || ''}
                  onChangeText={(value) => updateField('horaInicio', value)}
                  placeholder="10:00"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <DateInput
                  label="Fecha fin (opcional)"
                  value={formData.fechaFin || ''}
                  onChangeDate={(value) => updateField('fechaFin', value)}
                  minDate={viaje ? new Date(viaje.fechaInicio) : undefined}
                  maxDate={viaje ? new Date(viaje.fechaFin) : undefined}
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Hora fin"
                  value={formData.horaFin || ''}
                  onChangeText={(value) => updateField('horaFin', value)}
                  placeholder="18:00"
                />
              </View>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <SectionHeader title="Ubicación" />
            <Input
              label="Nombre del lugar"
              value={formData.ubicacion || ''}
              onChangeText={(value) => updateField('ubicacion', value)}
              placeholder="Ej: Aeropuerto Charles de Gaulle"
            />
            <Input
              label="Dirección"
              value={formData.direccion || ''}
              onChangeText={(value) => updateField('direccion', value)}
              placeholder="Dirección completa"
            />
          </Card>

          <Card style={styles.formCard}>
            <SectionHeader title="Pago" />
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Precio"
                  value={formData.precio?.toString() || ''}
                  onChangeText={(value) =>
                    updateField('precio', value ? parseFloat(value) : undefined)
                  }
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Moneda"
                  value={formData.moneda || 'EUR'}
                  onChangeText={(value) => updateField('moneda', value)}
                  placeholder="EUR"
                />
              </View>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.inputLabel}>Estado del pago</Text>
              <View style={styles.estadoGrid}>
                {ESTADO_PAGO_OPTIONS.map((estado) => (
                  <Pressable
                    key={estado.value}
                    onPress={() => updateField('estadoPago', estado.value as any)}
                    style={[
                      styles.estadoChip,
                      formData.estadoPago === estado.value && styles.estadoChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.estadoText,
                        formData.estadoPago === estado.value && styles.estadoTextActive,
                      ]}
                    >
                      {estado.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <SectionHeader title="Notas" />
            <Input
              label="Notas adicionales"
              value={formData.notas || ''}
              onChangeText={(value) => updateField('notas', value)}
              placeholder="Información adicional sobre la reserva..."
              multiline
              numberOfLines={4}
            />
          </Card>

          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleSave} loading={storeLoading}>
              Guardar cambios
            </PrimaryButton>
          </View>
        </ScrollView>
      </ScreenContainer>
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
  formContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  formCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  categoriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoriaOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoriaOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: theme.colors.primaryLight,
  },
  categoriaOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  categoriaOptionTextActive: {
    color: theme.colors.primaryLight,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  estadoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  estadoChip: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  estadoChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  estadoTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
  },
});
