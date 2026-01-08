import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, PageHeader, PrimaryButton, Card, DateInput } from '@/components';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import { format, addDays } from 'date-fns';

export default function CreateSharedTripScreen() {
  const navigation = useNavigation<any>();
  const { createTrip } = useSharedTripsStore();

  const today = new Date();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(today, 7), 'yyyy-MM-dd'));
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Introduce un nombre para el viaje';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Introduce el destino';
    }

    if (!startDate) {
      newErrors.startDate = 'Selecciona la fecha de inicio';
    }

    if (!endDate) {
      newErrors.endDate = 'Selecciona la fecha de fin';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior al inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const trip = await createTrip({
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim(),
        startDate,
        endDate,
        currency,
      });

      if (trip) {
        Alert.alert('Viaje creado', name);
        navigation.replace('SharedTripDetail', { tripId: trip.id });
      } else {
        showToast.error('Error', 'No se pudo crear el viaje');
      }
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <PageHeader title="Nuevo viaje" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Text style={styles.inputLabel}>Nombre del viaje *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Escapada a la playa"
              placeholderTextColor={theme.colors.textMuted}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.inputLabel}>Destino *</Text>
            <TextInput
              style={[styles.input, errors.destination && styles.inputError]}
              value={destination}
              onChangeText={setDestination}
              placeholder="Ej: Barcelona, España"
              placeholderTextColor={theme.colors.textMuted}
            />
            {errors.destination && <Text style={styles.errorText}>{errors.destination}</Text>}

            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Añade una descripción..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </Card>

          <Card style={styles.card}>
            <DateInput
              label="Fecha de inicio *"
              value={startDate}
              onChangeDate={setStartDate}
              error={errors.startDate}
            />

            <DateInput
              label="Fecha de fin *"
              value={endDate}
              onChangeDate={setEndDate}
              minDate={startDate ? new Date(startDate) : undefined}
              error={errors.endDate}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.inputLabel}>Moneda</Text>
            <View style={styles.currencyOptions}>
              {['EUR', 'USD', 'GBP', 'MXN'].map((curr) => (
                <View
                  key={curr}
                  style={[
                    styles.currencyOption,
                    currency === curr && styles.currencyOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyOptionText,
                      currency === curr && styles.currencyOptionTextSelected,
                    ]}
                    onPress={() => setCurrency(curr)}
                  >
                    {curr}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.footer}>
            <PrimaryButton
              onPress={handleSubmit}
              loading={loading}
            >
              Crear viaje
            </PrimaryButton>
          </View>

          <Text style={styles.hint}>
            Después de crear el viaje podrás invitar a tus compañeros de viaje
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  currencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currencyOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  currencyOptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  currencyOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
  },
});
