/**
 * ADD EVENTO SCREEN
 *
 * Pantalla para crear un nuevo evento personalizado.
 * Incluye selector de categoría, campos de formulario y validaciones.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  PrimaryButton,
  SectionHeader,
  Input,
  EventoCategoriaSelector,
  DayPicker,
  useDiasViaje,
  TimeInput,
  CustomModal,
} from '@/components';
import type { DiaViaje } from '@/components';
import { useEventosStore } from '@/store/eventosStore';
import { CategoriaEvento, PrioridadEvento } from '@/types/evento';
import { getViajeById } from '@/services';
import { showToast } from '@/utils/toast';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { getEventoById, linkEventoToLugar } from '@/services/eventosService';
import {
  searchPlacesForEvento,
  mapEventoCategoriaToLugarCategoria,
  confirmPlaceSuggestion,
} from '@/services/placeMatchingService';
import type { Viaje } from '@/types/viaje';
import { theme } from '@/config/theme';

// ============================================
// TIPOS
// ============================================

type RootStackParamList = {
  AddEvento: { viajeId: string; diaId?: string; eventoId?: string };
};

type AddEventoScreenRouteProp = RouteProp<RootStackParamList, 'AddEvento'>;
type AddEventoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AddEventoScreen() {
  const navigation = useNavigation<AddEventoScreenNavigationProp>();
  const route = useRoute<AddEventoScreenRouteProp>();
  const { viajeId, diaId, eventoId } = route.params;

  const isEditMode = !!eventoId;
  const { addEvento, updateEvento, loading } = useEventosStore();

  // Estado del viaje y días
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loadingViaje, setLoadingViaje] = useState(true);
  const [diasViaje, setDiasViaje] = useState<DiaViaje[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Estado del formulario
  const [categoria, setCategoria] = useState<CategoriaEvento | null>(null);
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string | undefined>(undefined);
  const [horaFin, setHoraFin] = useState<string | undefined>(undefined);
  const [ubicacion, setUbicacion] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [prioridad] = useState<PrioridadEvento>('media');
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaViaje | null>(null);

  // Estado para modal de sugerencia de lugar
  const [placeSuggestionModal, setPlaceSuggestionModal] = useState<{
    visible: boolean;
    type: 'single' | 'multiple' | null;
    suggestions: any[];
    eventoCreado: any;
  }>({ visible: false, type: null, suggestions: [], eventoCreado: null });

  // Cargar datos del viaje, días y evento (si estamos en modo edición)
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

      // Cargar días del viaje desde la BD
      const diasDB = await getDiasByViajeId(viajeId);

      // Generar lista completa de días con la función helper
      const diasCompletos = generateDiasViaje(
        viajeData.fechaInicio,
        viajeData.fechaFin,
        diasDB
      );

      setDiasViaje(diasCompletos);

      // MODO EDICIÓN: Cargar evento existente
      if (isEditMode && eventoId) {
        const eventoData = await getEventoById(eventoId);
        if (!eventoData) {
          showToast.error('Error', 'No se encontró el evento');
          navigation.goBack();
          return;
        }

        // Prellenar el formulario con los datos del evento
        setCategoria(eventoData.categoria);
        setNombre(eventoData.nombre);
        setDescripcion(eventoData.descripcion || '');
        setHoraInicio(eventoData.horaInicio);
        setHoraFin(eventoData.horaFin);
        setUbicacion(eventoData.ubicacion || '');
        setNotas(eventoData.notas || '');

        // Seleccionar el día del evento
        if (eventoData.diaId) {
          const diaEvento = diasCompletos.find(d => d.diaId === eventoData.diaId);
          if (diaEvento) {
            setDiaSeleccionado(diaEvento);
            console.log('[AddEvento] Día del evento cargado:', diaEvento.label);
          }
        }
      }
      // MODO CREACIÓN: Pre-seleccionar día si viene en params
      else {
        if (diaId) {
          const diaPreseleccionado = diasCompletos.find(d => d.diaId === diaId);
          if (diaPreseleccionado) {
            setDiaSeleccionado(diaPreseleccionado);
            console.log('[AddEvento] Día pre-seleccionado:', diaPreseleccionado.label);
          }
        }
        // Si no, seleccionar el primer día por defecto
        else if (diasCompletos.length > 0) {
          setDiaSeleccionado(diasCompletos[0]);
          console.log('[AddEvento] Día seleccionado por defecto:', diasCompletos[0].label);
        }
      }
    } catch (error) {
      console.error('Error loading viaje:', error);
      showToast.error('Error', 'No se pudo cargar el viaje');
      navigation.goBack();
    } finally {
      setLoadingViaje(false);
    }
  };

  // Función helper para generar días del viaje
  const generateDiasViaje = (
    fechaInicio: string,
    fechaFin: string,
    diasDB: any[]
  ): DiaViaje[] => {
    return useDiasViaje(fechaInicio, fechaFin, diasDB);
  };

  // Handlers
  const handleBack = () => navigation.goBack();

  const handleDaySelect = (dia: DiaViaje) => {
    setDiaSeleccionado(dia);
    setShowDayPicker(false);
  };

  const validateForm = (): boolean => {
    // Validar categoría
    if (!categoria) {
      showToast.error('Error', 'Por favor selecciona una categoría');
      return false;
    }

    // Validar nombre
    if (!nombre.trim()) {
      showToast.error('Error', 'El nombre del evento es obligatorio');
      return false;
    }

    // Validar día seleccionado
    if (!diaSeleccionado) {
      showToast.error('Error', 'Debes seleccionar un día del viaje');
      return false;
    }

    // Validar que hora fin sea posterior a hora inicio
    if (horaInicio && horaFin) {
      const [hIni, mIni] = horaInicio.split(':').map(Number);
      const [hFin, mFin] = horaFin.split(':').map(Number);
      const minutosInicio = hIni * 60 + mIni;
      const minutosFin = hFin * 60 + mFin;

      if (minutosFin <= minutosInicio) {
        showToast.error('Error', 'La hora de fin debe ser posterior a la hora de inicio');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Debug: Verificar día seleccionado
    console.log('[AddEvento] Día seleccionado al guardar:', {
      label: diaSeleccionado?.label,
      diaId: diaSeleccionado?.diaId,
      numeroDia: diaSeleccionado?.numeroDia,
    });

    // Validar que tengamos diaId
    if (!diaSeleccionado?.diaId) {
      console.error('[AddEvento] ERROR: diaId es undefined');
      showToast.error('Error', 'No se pudo identificar el día seleccionado. Por favor, intenta de nuevo.'
      );
      return;
    }

    const eventoData = {
      viajeId,
      diaId: diaSeleccionado.diaId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      categoria: categoria!,
      horaInicio: horaInicio,
      horaFin: horaFin,
      ubicacion: ubicacion.trim() || undefined,
      notas: notas.trim() || undefined,
      prioridad,
    };

    let eventoCreado;

    if (isEditMode && eventoId) {
      // MODO EDICIÓN: actualizar evento existente
      const success = await updateEvento(eventoId, eventoData);
      if (!success) {
        showToast.error('Error', 'No se pudo actualizar el evento');
        return;
      }
      console.log('[AddEvento] Evento actualizado');
      // En modo edición, simplemente volver atrás sin hacer place matching
      navigation.goBack();
      return;
    } else {
      // MODO CREACIÓN: crear nuevo evento
      eventoCreado = await addEvento(eventoData);
      if (!eventoCreado) {
        return;
      }
      console.log('[AddEvento] Evento creado:', eventoCreado);
    }

    if (eventoCreado) {
      // PLACE MATCHING: Buscar lugares automáticamente si hay ubicación
      if (ubicacion.trim()) {
        console.log('[AddEvento] Buscando lugar para el evento:', ubicacion);

        try {
          const matchResult = await searchPlacesForEvento(
            {
              id: eventoCreado.id,
              viajeId: eventoCreado.viajeId,
              diaId: eventoCreado.diaId,
              nombre: eventoCreado.nombre,
              ubicacion: eventoCreado.ubicacion,
              categoria: eventoCreado.categoria,
              latitud: eventoCreado.latitud,
              longitud: eventoCreado.longitud,
            },
            {
              threshold: 70,
              showConfirmation: false,
              notifyUser: true,
            }
          );

          if (matchResult.type === 'exact' && matchResult.lugar) {
            // Lugar creado automáticamente, vincular con el evento
            await linkEventoToLugar(eventoCreado.id, matchResult.lugar.id);
            console.log('[AddEvento] Lugar vinculado automáticamente:', matchResult.lugar.nombre);

            showToast.success(
              'Evento creado',
              `Se ha creado el evento y se ha añadido "${matchResult.lugar.nombre}" al mapa.`
            );
            navigation.goBack();
          } else if (matchResult.type === 'suggested' && matchResult.suggestions) {
            // Sugerencia única - preguntar al usuario con modal
            setPlaceSuggestionModal({
              visible: true,
              type: 'single',
              suggestions: matchResult.suggestions,
              eventoCreado,
            });
          } else if (matchResult.type === 'multiple' && matchResult.suggestions) {
            // Múltiples opciones - mostrar modal con opciones
            setPlaceSuggestionModal({
              visible: true,
              type: 'multiple',
              suggestions: matchResult.suggestions.slice(0, 3),
              eventoCreado,
            });
          } else {
            // No se encontró lugar
            showToast.success('Evento creado', 'El evento se ha creado correctamente.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('[AddEvento] Error en place matching:', error);
          // Si falla el place matching, igual mostrar que el evento se creó
          showToast.success('Evento creado', 'El evento se ha creado correctamente.');
          navigation.goBack();
        }
      } else {
        // Sin ubicación, solo confirmar creación
        showToast.success('Evento creado', 'El evento se ha creado correctamente.');
        navigation.goBack();
      }
    }
  };

  const handlePlaceSuggestionConfirm = async () => {
    if (!placeSuggestionModal.eventoCreado || placeSuggestionModal.suggestions.length === 0) {
      return;
    }

    const categoria = mapEventoCategoriaToLugarCategoria(placeSuggestionModal.eventoCreado.categoria);
    const lugar = await confirmPlaceSuggestion(
      placeSuggestionModal.eventoCreado.id,
      placeSuggestionModal.eventoCreado.viajeId,
      placeSuggestionModal.eventoCreado.diaId,
      placeSuggestionModal.suggestions[0],
      categoria
    );

    if (lugar) {
      await linkEventoToLugar(placeSuggestionModal.eventoCreado.id, lugar.id);
      console.log('[AddEvento] Lugar confirmado y vinculado:', lugar.nombre);
    }

    setPlaceSuggestionModal({ visible: false, type: null, suggestions: [], eventoCreado: null });
    navigation.goBack();
  };

  const handlePlaceSuggestionDecline = () => {
    setPlaceSuggestionModal({ visible: false, type: null, suggestions: [], eventoCreado: null });
    navigation.goBack();
  };

  const headerTitle = isEditMode ? 'Editar evento' : 'Nuevo evento';
  const submitButtonText = isEditMode ? 'Guardar evento' : 'Crear evento';

  // Mostrar loading mientras carga el viaje
  if (loadingViaje) {
    return (
      <View style={styles.container}>
        <PageHeader title={headerTitle} onBack={handleBack} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (!viaje) {
    return (
      <View style={styles.container}>
        <PageHeader title={headerTitle} onBack={handleBack} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>No se encontró el viaje</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title={headerTitle} onBack={handleBack} />
      <ScreenContainer>
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selector de categoría */}
          <View style={styles.section}>
            <SectionHeader title="Categoría" />
            <View style={styles.sectionContent}>
              <EventoCategoriaSelector
                selected={categoria}
                onSelect={setCategoria}
                columns={3}
              />
            </View>
          </View>

          {/* Información básica */}
          <View style={styles.section}>
            <SectionHeader title="Información básica" />
            <View style={styles.sectionContent}>
              <Input
                label="Nombre del evento"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Visita al Louvre"
              />

              <Input
                label="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe el evento (opcional)"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Día del viaje */}
          <View style={styles.section}>
            <SectionHeader title="Día del viaje" />
            <View style={styles.sectionContent}>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowDayPicker(true)}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.colors.primaryLight}
                  />
                  <Text style={styles.selectButtonTextActive}>
                    {diaSeleccionado?.label || 'Seleccionar día'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Horario */}
          <View style={styles.section}>
            <SectionHeader title="Horario (opcional)" />
            <View style={styles.sectionContent}>
              <TimeInput
                label="Hora de inicio"
                value={horaInicio || ''}
                onChangeTime={(time) => setHoraInicio(time || undefined)}
                placeholder="Seleccionar hora"
              />

              <TimeInput
                label="Hora de fin"
                value={horaFin || ''}
                onChangeTime={(time) => setHoraFin(time || undefined)}
                placeholder="Seleccionar hora"
              />
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.section}>
            <SectionHeader title="Ubicación (opcional)" />
            <View style={styles.sectionContent}>
              <Input
                label="Lugar"
                value={ubicacion}
                onChangeText={setUbicacion}
                placeholder="Ej: Museo del Louvre, Barrio de las Letras"
              />
              <Text style={styles.ubicacionHint}>
                Si añades una ubicación, buscaremos el lugar automáticamente en Google Maps
              </Text>
            </View>
          </View>

          {/* Notas adicionales */}
          <View style={styles.section}>
            <SectionHeader title="Notas adicionales" />
            <View style={styles.sectionContent}>
              <Input
                label="Notas"
                value={notas}
                onChangeText={setNotas}
                placeholder="Añade cualquier información adicional"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Botón de acción */}
          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleSubmit} loading={loading}>
              {submitButtonText}
            </PrimaryButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selector de día */}
      <DayPicker
        visible={showDayPicker}
        diasViaje={diasViaje}
        selectedDia={diaSeleccionado}
        onSelect={handleDaySelect}
        onClose={() => setShowDayPicker(false)}
      />

      {/* Modal de sugerencia de lugar */}
      <CustomModal
        visible={placeSuggestionModal.visible}
        type="info"
        title="Evento creado"
        message={
          placeSuggestionModal.type === 'single' && placeSuggestionModal.suggestions.length > 0
            ? `¿Quieres añadir "${placeSuggestionModal.suggestions[0].name}" al mapa?`
            : 'Hemos encontrado varios lugares posibles. El más relevante se añadirá al mapa.'
        }
        onClose={handlePlaceSuggestionDecline}
        primaryButton={{
          text: placeSuggestionModal.type === 'single' ? 'Sí' : 'Añadir',
          onPress: handlePlaceSuggestionConfirm,
        }}
        secondaryButton={{
          text: 'No',
          onPress: handlePlaceSuggestionDecline,
        }}
      />
      </ScreenContainer>
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 32,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionContent: {
    marginTop: theme.spacing.md,
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
  buttonContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  ubicacionHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});
