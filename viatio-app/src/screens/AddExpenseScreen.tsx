/**
 * ADD EXPENSE SCREEN
 *
 * Pantalla para añadir un nuevo gasto al viaje.
 * Incluye input de monto, selector de categoría y detalles adicionales.
 *
 * NOTA: Si el viaje es compartido (isShared=1), redirige a AddSharedExpenseScreen
 * que incluye funcionalidad de reparto entre participantes.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useGastosStore } from '@/store/gastosStore';
import { parseLocalDate } from '@/utils';
import { CategoriaGasto, GASTO_CATEGORIAS } from '@/types/gasto';
import { getViajeById } from '@/services';
import type { Viaje } from '@/types/viaje';
import { theme } from '@/config';
import type { HomeStackParamList } from '@/navigation/types';
import { showToast } from '@/utils/toast';

// ============================================
// TIPOS
// ============================================

type AddExpenseScreenRouteProp = RouteProp<HomeStackParamList, 'AddExpense'>;
type AddExpenseScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface DiaViaje {
  numeroDia: number;
  fecha: Date;
  fechaISO: string;
  label: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const { viajeId } = route.params;

  const { addGasto, loading } = useGastosStore();

  // Estado del viaje
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loadingViaje, setLoadingViaje] = useState(true);
  const [diasViaje, setDiasViaje] = useState<DiaViaje[]>([]);

  // NOTA: Esta pantalla solo maneja gastos individuales (SQLite).
  // Para gastos compartidos, ExpensesScreen navega a AddSharedExpenseScreen.

  // Estado del formulario
  const [monto, setMonto] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaViaje | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Cargar viaje y generar días
  useEffect(() => {
    loadViaje();
  }, [viajeId]);

  const loadViaje = async () => {
    try {
      setLoadingViaje(true);
      const viajeData = await getViajeById(viajeId);
      if (!viajeData) {
        showToast.error('Error', 'No se encontró el viaje');
        navigation.goBack();
        return;
      }

      setViaje(viajeData);

      // Generar lista de días del viaje (parseLocalDate evita problemas de zona horaria)
      const fechaInicio = parseLocalDate(viajeData.fechaInicio);
      const fechaFin = parseLocalDate(viajeData.fechaFin);
      const totalDias = differenceInDays(fechaFin, fechaInicio) + 1;

      const dias: DiaViaje[] = [];
      for (let i = 0; i < totalDias; i++) {
        const fecha = addDays(fechaInicio, i);
        const fechaISO = fecha.toISOString();
        const label = `Día ${i + 1} - ${format(fecha, 'd MMM', { locale: es })}`;

        dias.push({
          numeroDia: i + 1,
          fecha,
          fechaISO,
          label,
        });
      }

      setDiasViaje(dias);

      // Seleccionar el primer día por defecto
      if (dias.length > 0) {
        setDiaSeleccionado(dias[0]);
      }
    } catch (error) {
      console.error('Error loading viaje:', error);
      showToast.error('Error', 'No se pudo cargar el viaje');
      navigation.goBack();
    } finally {
      setLoadingViaje(false);
    }
  };

  // Handlers
  const handleBack = () => navigation.goBack();

  const handleMontoChange = (text: string) => {
    // Solo permitir números y un punto decimal
    const filteredText = text.replace(/[^0-9.]/g, '');
    // Evitar múltiples puntos decimales
    const parts = filteredText.split('.');
    if (parts.length > 2) return;
    setMonto(filteredText);
  };

  const handleCategoriaSelect = (cat: CategoriaGasto) => {
    setCategoria(cat);
  };

  const validateForm = (): boolean => {
    // Validar monto
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      showToast.error('Error', 'El monto debe ser mayor a 0');
      return false;
    }

    // Validar descripción
    if (!descripcion.trim()) {
      showToast.error('Error', 'La descripción es requerida');
      return false;
    }

    // Validar categoría
    if (!categoria) {
      showToast.error('Error', 'Debes seleccionar una categoría');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!diaSeleccionado) {
      showToast.error('Error', 'Debes seleccionar un día del viaje');
      return;
    }

    const montoNum = parseFloat(monto);

    const result = await addGasto({
      viajeId,
      categoria: categoria!,
      descripcion: descripcion.trim(),
      monto: montoNum,
      moneda: viaje?.moneda || '€',
      fecha: diaSeleccionado.fechaISO,
      diaId: undefined, // Por ahora no usamos diaId
    });

    if (result) {
      navigation.goBack();
    } else {
      showToast.error('Error', 'No se pudo guardar el gasto');
    }
  };

  const handleDaySelect = (dia: DiaViaje) => {
    setDiaSeleccionado(dia);
    setShowDayPicker(false);
  };

  // Lista de categorías para el grid
  const categoriasList: CategoriaGasto[] = [
    'transporte',
    'alojamiento',
    'comida',
    'actividades',
    'compras',
    'otros',
  ];

  // Mostrar loading mientras carga el viaje
  if (loadingViaje) {
    return (
      <ScreenContainer>
        <PageHeader title="Añadir gasto" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      </ScreenContainer>
    );
  }

  if (!viaje) {
    return (
      <ScreenContainer>
        <PageHeader title="Añadir gasto" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No se encontró el viaje</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader title="Añadir gasto" onBack={handleBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Input de monto grande */}
        <View style={styles.montoContainer}>
          <View style={styles.montoInputWrapper}>
            <Text style={styles.montoSymbol}>€</Text>
            <TextInput
              style={styles.montoInput}
              value={monto}
              onChangeText={handleMontoChange}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              maxLength={10}
              autoFocus
            />
          </View>
        </View>

        {/* Card - Categoría */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Categoría</Text>
          <View style={styles.categoriasGrid}>
            {categoriasList.map((cat) => {
              const categoriaInfo = GASTO_CATEGORIAS[cat];
              const isSelected = categoria === cat;

              return (
                <Pressable
                  key={cat}
                  onPress={() => handleCategoriaSelect(cat)}
                  style={({ pressed }) => [
                    styles.categoriaItem,
                    isSelected && {
                      backgroundColor: `${categoriaInfo.color}15`,
                      borderColor: categoriaInfo.color,
                      borderWidth: 2,
                    },
                    pressed && styles.categoriaItemPressed,
                  ]}
                >
                  <Ionicons
                    name={categoriaInfo.icon as any}
                    size={24}
                    color={isSelected ? categoriaInfo.color : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoriaLabel,
                      isSelected && { color: categoriaInfo.color, fontWeight: '600' },
                    ]}
                  >
                    {categoriaInfo.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Card - Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles</Text>

          {/* Input: Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={styles.textInput}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ej: Cena en restaurante"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={100}
            />
          </View>

          {/* Select: Día del viaje */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Día del viaje</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowDayPicker(true)}
            >
              <View style={styles.selectButtonContent}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primaryLight} />
                <Text style={styles.selectButtonTextActive}>
                  {diaSeleccionado?.label || 'Seleccionar día'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Espacio para el botón fijo */}
        <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botón fijo en la parte inferior */}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleSave} loading={loading} disabled={loading}>
          Guardar gasto
        </PrimaryButton>
      </View>

      {/* Modal: Selector de días */}
      <Modal
        visible={showDayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDayPicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona el día</Text>
              <Pressable onPress={() => setShowDayPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.daysList}>
              {diasViaje.map((dia) => {
                const isSelected = diaSeleccionado?.numeroDia === dia.numeroDia;

                return (
                  <Pressable
                    key={dia.numeroDia}
                    style={({ pressed }) => [
                      styles.dayItem,
                      isSelected && styles.dayItemSelected,
                      pressed && styles.dayItemPressed,
                    ]}
                    onPress={() => handleDaySelect(dia)}
                  >
                    <View style={styles.dayItemContent}>
                      <View style={[
                        styles.dayNumberBadge,
                        isSelected && { backgroundColor: theme.colors.primaryLight }
                      ]}>
                        <Text style={[
                          styles.dayNumberText,
                          isSelected && { color: '#FFFFFF' }
                        ]}>
                          {dia.numeroDia}
                        </Text>
                      </View>
                      <View style={styles.dayTextContainer}>
                        <Text style={[
                          styles.dayLabel,
                          isSelected && { color: theme.colors.primaryLight, fontWeight: '600' }
                        ]}>
                          {dia.label}
                        </Text>
                        <Text style={styles.dayDate}>
                          {format(dia.fecha, 'EEEE, d MMMM yyyy', { locale: es })}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primaryLight} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  // Monto
  montoContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  montoInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  montoSymbol: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  montoInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    minWidth: 150,
    padding: 0,
  },

  // Cards
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Grid de categorías
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  categoriaItem: {
    width: '47%',
    aspectRatio: 1.5,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  categoriaItemPressed: {
    opacity: 0.7,
  },
  categoriaLabel: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },

  // Inputs de detalles
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  selectButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectButtonTextActive: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },

  // Botón fijo
  bottomSpacer: {
    height: 100, // Espacio para el botón fijo
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.card,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '80%',
    ...theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  daysList: {
    maxHeight: 500,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayItemSelected: {
    backgroundColor: `${theme.colors.primaryLight}10`,
  },
  dayItemPressed: {
    opacity: 0.7,
  },
  dayItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  dayNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayTextContainer: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
