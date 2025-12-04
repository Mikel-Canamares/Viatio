/**
 * ADD RESERVATION SCREEN
 *
 * Pantalla para añadir una nueva reserva.
 * Permite añadir manualmente o escanear documento (Fase 10).
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
import { useDocumentosStore } from '@/store/documentosStore';
import { getViajeById, pickDocument, pickImage } from '@/services';
import { detectTipoArchivo } from '@/services/documentosService';
import type { CreateReservaInput, CategoriaReserva } from '@/types/reserva';
import { mapReservaToCategoriaDocumento } from '@/types/reserva';
import type { Viaje } from '@/types/viaje';
import type { HomeStackParamList } from '@/navigation/types';

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

type Props = NativeStackScreenProps<HomeStackParamList, 'AddReservation'>;

type ScreenMode = 'select' | 'manual' | 'scan';

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

export default function AddReservationScreen({ route, navigation }: Props) {
  const { viajeId, prefillData, scannedFiles } = route.params;
  const { addReserva, loading } = useReservasStore();
  const { addDocumento } = useDocumentosStore();

  const [mode, setMode] = useState<ScreenMode>(prefillData ? 'manual' : 'select');
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [formData, setFormData] = useState<Partial<CreateReservaInput>>(
    prefillData || {
      viajeId,
      categoria: 'transport',
      estadoPago: 'pending',
      moneda: 'EUR',
    }
  );
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [pickingFile, setPickingFile] = useState(false);

  // Cargar datos del viaje para limitar fechas
  useEffect(() => {
    loadViaje();
  }, [viajeId]);

  const loadViaje = async () => {
    try {
      const viajeData = await getViajeById(viajeId);
      setViaje(viajeData);
    } catch (error) {
      console.error('[AddReservationScreen] Error al cargar viaje:', error);
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

    try {
      let documentoId: string | undefined;

      // Determinar qué archivo usar: escaneados o adjuntados manualmente
      const fileToAttach = scannedFiles?.[0]
        ? { uri: scannedFiles[0].uri, name: scannedFiles[0].name, type: scannedFiles[0].type, size: scannedFiles[0].uri.length }
        : attachedFile;

      // Si hay un archivo (escaneado o manual), crear el documento primero
      if (fileToAttach) {
        const tipoArchivo = detectTipoArchivo(fileToAttach.type);
        const categoriaDocumento = mapReservaToCategoriaDocumento(formData.categoria);

        console.log('[AddReservation] Categoría reserva:', formData.categoria);
        console.log('[AddReservation] Categoría documento mapeada:', categoriaDocumento);

        // Crear documento
        const documento = await addDocumento(
          {
            viajeId,
            nombre: formData.nombre, // Usar el mismo nombre que la reserva
            categoria: categoriaDocumento,
            tipoArchivo,
            rutaArchivo: fileToAttach.name,
            tamano: fileToAttach.size,
          },
          fileToAttach.uri
        );

        if (documento) {
          documentoId = documento.id;
        }
      }

      // Crear la reserva con el documentoId si existe
      const input: CreateReservaInput = {
        viajeId,
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
        documentoId, // Asociar el documento si se creó
      };

      const result = await addReserva(input);
      if (result) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo crear la reserva');
      }
    } catch (error) {
      console.error('[AddReservation] Error al guardar:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar la reserva y el documento');
    }
  };

  const handleScan = () => {
    navigation.navigate('ScanReservation', { viajeId });
  };

  const handlePickDocument = async () => {
    try {
      setPickingFile(true);
      const result = await pickDocument();

      if (result) {
        setAttachedFile({
          uri: result.uri,
          name: result.name,
          type: result.type || 'application/pdf',
          size: result.size || 0,
        });
      }
    } catch (error) {
      console.error('[AddReservation] Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    } finally {
      setPickingFile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setPickingFile(true);
      const result = await pickImage();

      if (result) {
        // Generar nombre de archivo basado en timestamp
        const timestamp = Date.now();
        const fileName = `image_${timestamp}.jpg`;

        setAttachedFile({
          uri: result.uri,
          name: fileName,
          type: 'image/jpeg',
          size: result.base64 ? result.base64.length : 0,
        });
      }
    } catch (error) {
      console.error('[AddReservation] Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setPickingFile(false);
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      'Eliminar archivo',
      '¿Deseas eliminar el archivo adjunto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setAttachedFile(null)
        },
      ]
    );
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <PageHeader title="Añadir reserva" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.selectContent}>
            <Pressable onPress={() => setMode('manual')}>
              <Card style={styles.optionCard}>
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, styles.iconManual]}>
                    <Ionicons name="create-outline" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Añadir manualmente</Text>
                    <Text style={styles.optionDescription}>
                      Introduce los datos de tu reserva
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>

            <Pressable onPress={handleScan}>
              <Card style={styles.optionCard}>
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, styles.iconScan]}>
                    <Ionicons name="scan-outline" size={24} color="#9333EA" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Escanear documento</Text>
                    <Text style={styles.optionDescription}>
                      Extrae datos automáticamente con IA
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Nueva reserva"
        onBack={() => (prefillData ? navigation.goBack() : setMode('select'))}
      />
      <ScreenContainer>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Banner de datos extraídos */}
          {prefillData && (
            <View style={styles.aiBanner}>
              <Ionicons name="sparkles" size={20} color="#2563EB" />
              <Text style={styles.aiBannerText}>
                Datos extraídos automáticamente - Revisa y completa la información
              </Text>
            </View>
          )}

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

          {/* Sección de documentos - solo visible en modo manual sin archivos escaneados */}
          {!scannedFiles && (
            <Card style={styles.formCard}>
              <SectionHeader title="Documento adjunto (opcional)" />

              {attachedFile ? (
                // Preview del archivo seleccionado
                <View style={styles.filePreview}>
                  <View style={styles.filePreviewContent}>
                    <View style={styles.fileIconContainer}>
                      <Ionicons
                        name={attachedFile.type.includes('pdf') ? 'document-text' : 'image'}
                        size={28}
                        color={theme.colors.primaryLight}
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {attachedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {(attachedFile.size / 1024).toFixed(0)} KB
                      </Text>
                    </View>
                    <Pressable onPress={handleRemoveFile} style={styles.removeButton}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                // Botones para seleccionar archivo
                <View style={styles.attachmentButtons}>
                  <Pressable
                    onPress={handlePickDocument}
                    style={styles.attachButton}
                    disabled={pickingFile}
                  >
                    {pickingFile ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryLight} />
                    ) : (
                      <>
                        <Ionicons name="document-attach" size={20} color={theme.colors.primaryLight} />
                        <Text style={styles.attachButtonText}>Adjuntar PDF</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handlePickImage}
                    style={styles.attachButton}
                    disabled={pickingFile}
                  >
                    {pickingFile ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryLight} />
                    ) : (
                      <>
                        <Ionicons name="image" size={20} color={theme.colors.primaryLight} />
                        <Text style={styles.attachButtonText}>Adjuntar imagen</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              <Text style={styles.attachmentHint}>
                Puedes adjuntar el documento de confirmación de tu reserva
              </Text>
            </Card>
          )}

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
            <PrimaryButton onPress={handleSave} loading={loading}>
              Guardar reserva
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
  selectContent: {
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  aiBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  optionCard: {
    padding: theme.spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconManual: {
    backgroundColor: '#DBEAFE',
  },
  iconScan: {
    backgroundColor: '#F3E8FF',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
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
  section: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    gap: theme.spacing.xs,
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
  categoriaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoriaChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  categoriaText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  categoriaTextActive: {
    color: '#FFFFFF',
  },
  estadoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  estadoChip: {
    flex: 1,
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
  // Estilos para adjuntar documentos
  attachmentButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  attachButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  attachmentHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  filePreview: {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  filePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fileSize: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  removeButton: {
    padding: 4,
  },
});
