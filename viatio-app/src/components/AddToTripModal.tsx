import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult, mapGoogleTypeToCategoria } from '@/types/googlePlaces';
import { DiaViaje } from '@/types/diaViaje';
import { CategoriaLugar, LUGAR_CATEGORIAS } from '@/types/lugar';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { theme } from '@/config/theme';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AddToTripModalProps {
  visible: boolean;
  place: PlaceResult | null;
  viajeId: string;
  onClose: () => void;
  onConfirm: (place: PlaceResult, diaId: string | null, categoria: CategoriaLugar) => void;
  loading?: boolean;
}

export function AddToTripModal({
  visible,
  place,
  viajeId,
  onClose,
  onConfirm,
  loading = false,
}: AddToTripModalProps) {
  const [dias, setDias] = useState<DiaViaje[]>([]);
  const [selectedDiaId, setSelectedDiaId] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaLugar>('other');
  const [loadingDias, setLoadingDias] = useState(true);

  // Cargar días del viaje
  useEffect(() => {
    if (visible && viajeId) {
      loadDias();
    }
  }, [visible, viajeId]);

  // Detectar categoría automáticamente
  useEffect(() => {
    if (place) {
      const autoCategoria = mapGoogleTypeToCategoria(place.types) as CategoriaLugar;
      setSelectedCategoria(autoCategoria);
    }
  }, [place]);

  const loadDias = async () => {
    setLoadingDias(true);
    try {
      const diasViaje = await getDiasByViajeId(viajeId);
      setDias(diasViaje);
    } catch (error) {
      console.error('Error cargando días:', error);
    } finally {
      setLoadingDias(false);
    }
  };

  const handleConfirm = () => {
    if (place) {
      onConfirm(place, selectedDiaId, selectedCategoria);
    }
  };

  const formatDiaOption = (dia: DiaViaje): string => {
    try {
      const fecha = parseISO(dia.fecha);
      return format(fecha, "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return dia.fecha;
    }
  };

  if (!place) return null;

  const categorias = Object.entries(LUGAR_CATEGORIAS) as [CategoriaLugar, typeof LUGAR_CATEGORIAS[CategoriaLugar]][];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Añadir al viaje</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Nombre del lugar */}
          <View style={styles.placeInfo}>
            <Ionicons name="location" size={20} color={theme.colors.primaryLight} />
            <Text style={styles.placeName} numberOfLines={2}>
              {place.name}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Selector de categoría */}
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.categoriesGrid}>
              {categorias.map(([key, config]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.categoryItem,
                    selectedCategoria === key && {
                      backgroundColor: config.color + '20',
                      borderColor: config.color,
                    },
                  ]}
                  onPress={() => setSelectedCategoria(key)}
                >
                  <Ionicons
                    name={config.icon as any}
                    size={20}
                    color={selectedCategoria === key ? config.color : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategoria === key && { color: config.color },
                    ]}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Selector de día */}
            <Text style={styles.sectionTitle}>¿Qué día lo visitarás?</Text>

            {loadingDias ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <View style={styles.daysContainer}>
                {/* Opción sin asignar */}
                <Pressable
                  style={[
                    styles.dayOption,
                    selectedDiaId === null && styles.dayOptionSelected,
                  ]}
                  onPress={() => setSelectedDiaId(null)}
                >
                  <Ionicons
                    name={selectedDiaId === null ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedDiaId === null ? theme.colors.primaryLight : theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.dayOptionText,
                      selectedDiaId === null && styles.dayOptionTextSelected,
                    ]}
                  >
                    Sin asignar (decidir más tarde)
                  </Text>
                </Pressable>

                {/* Días del viaje */}
                {dias.map((dia, index) => (
                  <Pressable
                    key={dia.id}
                    style={[
                      styles.dayOption,
                      selectedDiaId === dia.id && styles.dayOptionSelected,
                    ]}
                    onPress={() => setSelectedDiaId(dia.id)}
                  >
                    <Ionicons
                      name={selectedDiaId === dia.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selectedDiaId === dia.id ? theme.colors.primaryLight : theme.colors.textMuted}
                    />
                    <View style={styles.dayOptionContent}>
                      <Text
                        style={[
                          styles.dayOptionText,
                          selectedDiaId === dia.id && styles.dayOptionTextSelected,
                        ]}
                      >
                        Día {index + 1}
                      </Text>
                      <Text style={styles.dayOptionDate}>
                        {formatDiaOption(dia)}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {dias.length === 0 && (
                  <Text style={styles.noDays}>
                    No hay días configurados en este viaje
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Botón confirmar */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Añadir lugar</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  placeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  scrollView: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dayOptionSelected: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.primaryLight + '08',
  },
  dayOptionContent: {
    flex: 1,
  },
  dayOptionText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  dayOptionTextSelected: {
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  dayOptionDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noDays: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  loader: {
    paddingVertical: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
