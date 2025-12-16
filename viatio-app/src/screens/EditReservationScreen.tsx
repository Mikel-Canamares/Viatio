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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  ScreenContainer,
  PageHeader,
  Card,
  Input,
  DateInput,
  SectionHeader,
  PrimaryButton,
  SubtypeSelector,
} from '@/components';
import { theme } from '@/config';
import { useReservasStore } from '@/store/reservasStore';
import { useDocumentosStore } from '@/store/documentosStore';
import { getViajeById } from '@/services';
import { getReservaById, getDocumentoByReservaId } from '@/services/reservasService';
import { updateDocumentoCategoria } from '@/services/documentosService';
import type {
  CreateReservaInput,
  CategoriaReserva,
  SubtipoTransporte,
  SubtipoAlojamiento,
  SubtipoActividad,
} from '@/types/reserva';
import {
  mapReservaToCategoriaDocumento,
  SUBTIPOS_TRANSPORTE,
  SUBTIPOS_ALOJAMIENTO,
  SUBTIPOS_ACTIVIDAD,
} from '@/types/reserva';
import type { Viaje } from '@/types/viaje';
import type { Documento } from '@/types/documento';
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
  const { addDocumento, removeDocumento } = useDocumentosStore();

  const [loading, setLoading] = useState(true);
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [formData, setFormData] = useState<Partial<CreateReservaInput>>({});

  // Document state
  const [existingDocument, setExistingDocument] = useState<Documento | null>(null);
  const [attachedFile, setAttachedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState(false);

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

      // Cargar documento asociado si existe
      if (reservaData.documentoId) {
        const doc = await getDocumentoByReservaId(reservaId);
        setExistingDocument(doc as Documento | null);
      }

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

  const updateMetadata = <K extends keyof NonNullable<CreateReservaInput['metadatos']>>(
    field: K,
    value: NonNullable<CreateReservaInput['metadatos']>[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      metadatos: { ...prev.metadatos, [field]: value },
    }));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setAttachedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          size: file.size || 0,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar imágenes');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const image = result.assets[0];
        const fileName = image.uri.split('/').pop() || 'imagen.jpg';
        setAttachedFile({
          uri: image.uri,
          name: fileName,
          type: image.mimeType || 'image/jpeg',
          size: 0,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleDeleteExistingDocument = () => {
    if (!existingDocument) return;

    Alert.alert(
      'Eliminar documento',
      '¿Deseas eliminar el documento asociado? Se eliminará al guardar los cambios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDocumentToDelete(true);
            setExistingDocument(null);
          },
        },
      ]
    );
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.categoria) {
      Alert.alert('Error', 'El nombre y la categoría son obligatorios');
      return;
    }

    try {
      // 1. Delete existing document if marked for deletion
      if (documentToDelete && existingDocument) {
        await removeDocumento(existingDocument.id);
      }

      // 2. Update existing document category if it exists and category changed
      if (existingDocument && !documentToDelete && formData.categoria) {
        const nuevaCategoriaDocumento = mapReservaToCategoriaDocumento(formData.categoria);
        // Solo actualizar si la categoría cambió
        if (existingDocument.categoria !== nuevaCategoriaDocumento) {
          await updateDocumentoCategoria(existingDocument.id, nuevaCategoriaDocumento);
          console.log('[EditReservation] Categoría de documento actualizada:', {
            documentoId: existingDocument.id,
            categoriaAnterior: existingDocument.categoria,
            categoriaNueva: nuevaCategoriaDocumento,
          });
        }
      }

      // 3. Create new document if attached
      let newDocumentoId: string | undefined;
      if (attachedFile && formData.viajeId && formData.categoria) {
        const categoriaDocumento = mapReservaToCategoriaDocumento(formData.categoria);
        const tipoArchivo = attachedFile.type.includes('pdf') ? 'pdf' : 'image';

        const documento = await addDocumento(
          {
            viajeId: formData.viajeId,
            nombre: attachedFile.name,
            categoria: categoriaDocumento,
            tipoArchivo,
            rutaArchivo: '',
            tamano: attachedFile.size,
          },
          attachedFile.uri
        );

        if (documento) {
          newDocumentoId = documento.id;
        }
      }

      // 4. Update reservation
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
        precio: formData.precio ? parseFloat(formData.precio as any) : undefined,
        moneda: formData.moneda || 'EUR',
        estadoPago: formData.estadoPago || 'pending',
        notas: formData.notas,
        metadatos: formData.metadatos, // Incluir metadatos
        documentoId: newDocumentoId,
      };

      await updateReserva(reservaId, input);
      navigation.goBack();
    } catch (error) {
      console.error('[EditReservationScreen] Error al guardar:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
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
              placeholder={
                formData.categoria === 'transport'
                  ? 'Ej: Vuelo Madrid - París'
                  : formData.categoria === 'accommodation'
                  ? 'Ej: Hotel Ritz'
                  : formData.categoria === 'food'
                  ? 'Ej: Restaurante La Viña'
                  : formData.categoria === 'activity'
                  ? 'Ej: Tour por el Museo del Prado'
                  : 'Nombre de la reserva'
              }
            />

            {/* Subtipo - Solo para Transport, Accommodation y Activity */}
            {formData.categoria === 'transport' && (
              <SubtypeSelector
                label="Tipo de transporte"
                options={SUBTIPOS_TRANSPORTE}
                value={formData.metadatos?.subtipoTransporte}
                onSelect={(value) => updateMetadata('subtipoTransporte', value as SubtipoTransporte)}
              />
            )}

            {formData.categoria === 'accommodation' && (
              <SubtypeSelector
                label="Tipo de alojamiento"
                options={SUBTIPOS_ALOJAMIENTO}
                value={formData.metadatos?.subtipoAlojamiento}
                onSelect={(value) => updateMetadata('subtipoAlojamiento', value as SubtipoAlojamiento)}
              />
            )}

            {formData.categoria === 'activity' && (
              <SubtypeSelector
                label="Tipo de actividad"
                options={SUBTIPOS_ACTIVIDAD}
                value={formData.metadatos?.subtipoActividad}
                onSelect={(value) => updateMetadata('subtipoActividad', value as SubtipoActividad)}
              />
            )}

            {/* Proveedor - Oculto para food */}
            {formData.categoria !== 'food' && (
              <Input
                label={
                  formData.categoria === 'transport'
                    ? 'Compañía'
                    : formData.categoria === 'accommodation'
                    ? 'Establecimiento'
                    : formData.categoria === 'activity'
                    ? 'Organizador'
                    : 'Proveedor'
                }
                value={formData.proveedor || ''}
                onChangeText={(value) => updateField('proveedor', value)}
                placeholder={
                  formData.categoria === 'transport'
                    ? 'Ej: Renfe, Iberia...'
                    : formData.categoria === 'accommodation'
                    ? 'Ej: Hotel Ritz'
                    : formData.categoria === 'activity'
                    ? 'Ej: Free Tours Madrid'
                    : 'Nombre del proveedor'
                }
              />
            )}

            {/* Contacto - Solo para Activity y Accommodation */}
            {(formData.categoria === 'activity' || formData.categoria === 'accommodation') && (
              <Input
                label="Contacto"
                value={formData.metadatos?.telefono || ''}
                onChangeText={(value) => updateMetadata('telefono', value)}
                placeholder="+34 600 000 000"
                keyboardType="phone-pad"
              />
            )}

            {/* Número de confirmación - Oculto para food */}
            {formData.categoria !== 'food' && (
              <Input
                label="Número de confirmación"
                value={formData.numeroConfirmacion || ''}
                onChangeText={(value) => updateField('numeroConfirmacion', value)}
                placeholder="ABC123456"
              />
            )}
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
            <SectionHeader
              title={
                formData.categoria === 'activity'
                  ? 'Punto de encuentro'
                  : 'Ubicación'
              }
            />
            <Input
              label={
                formData.categoria === 'activity'
                  ? 'Punto de encuentro'
                  : 'Nombre del lugar'
              }
              value={formData.ubicacion || ''}
              onChangeText={(value) => updateField('ubicacion', value)}
              placeholder={
                formData.categoria === 'transport'
                  ? 'Ej: Aeropuerto Charles de Gaulle'
                  : formData.categoria === 'accommodation'
                  ? 'Ej: Hotel Ritz Madrid'
                  : formData.categoria === 'food'
                  ? 'Ej: Restaurante La Viña'
                  : formData.categoria === 'activity'
                  ? 'Ej: Puerta del Sol'
                  : 'Nombre del lugar'
              }
            />
            {/* Dirección - Mostrar para todos excepto activity */}
            {formData.categoria !== 'activity' && (
              <Input
                label="Dirección"
                value={formData.direccion || ''}
                onChangeText={(value) => updateField('direccion', value)}
                placeholder="Dirección completa"
              />
            )}
          </Card>

          {/* Pago - Oculto para food */}
          {formData.categoria !== 'food' && (
            <Card style={styles.formCard}>
              <SectionHeader title="Pago" />
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label="Precio"
                    value={formData.precio?.toString() || ''}
                    onChangeText={(value) => {
                      // Solo permitir números y un punto decimal
                      const filteredText = value.replace(/[^0-9.]/g, '');
                      // Evitar múltiples puntos decimales
                      const parts = filteredText.split('.');
                      if (parts.length > 2) return;
                      // Mantener como número pero permitir el punto decimal mientras se escribe
                      updateField('precio', filteredText as any);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
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

          <Card style={styles.formCard}>
            <SectionHeader title="Documento adjunto" />

            {/* Existing document */}
            {existingDocument && !documentToDelete && (
              <View style={styles.documentPreview}>
                <View style={styles.documentRow}>
                  <View style={styles.documentIconContainer}>
                    <Ionicons
                      name={existingDocument.tipoArchivo === 'pdf' ? 'document-text' : 'image'}
                      size={24}
                      color={theme.colors.primaryLight}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{existingDocument.nombre}</Text>
                    <Text style={styles.documentMeta}>
                      {existingDocument.tipoArchivo.toUpperCase()} • {(existingDocument.tamano / 1024).toFixed(0)} KB
                    </Text>
                  </View>
                  <Pressable onPress={handleDeleteExistingDocument} style={styles.deleteIconButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Attached file preview */}
            {attachedFile && (
              <View style={styles.documentPreview}>
                <View style={styles.documentRow}>
                  {attachedFile.type.includes('image') ? (
                    <Image source={{ uri: attachedFile.uri }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.documentIconContainer}>
                      <Ionicons name="document-text" size={24} color={theme.colors.primaryLight} />
                    </View>
                  )}
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{attachedFile.name}</Text>
                    <Text style={styles.documentMeta}>
                      {attachedFile.type.includes('pdf') ? 'PDF' : 'Imagen'}
                    </Text>
                  </View>
                  <Pressable onPress={handleRemoveAttachedFile} style={styles.deleteIconButton}>
                    <Ionicons name="close-circle" size={24} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Attach buttons */}
            {!existingDocument && !attachedFile && (
              <View style={styles.attachButtons}>
                <Pressable onPress={handlePickDocument} style={styles.attachButton}>
                  <Ionicons name="document-attach-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>Adjuntar PDF</Text>
                </Pressable>
                <Pressable onPress={handlePickImage} style={styles.attachButton}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>Adjuntar imagen</Text>
                </Pressable>
              </View>
            )}

            {(existingDocument && !attachedFile) && (
              <View style={styles.attachButtons}>
                <Pressable onPress={handlePickDocument} style={styles.attachButton}>
                  <Ionicons name="document-attach-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>Adjuntar PDF</Text>
                </Pressable>
                <Pressable onPress={handlePickImage} style={styles.attachButton}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>Adjuntar imagen</Text>
                </Pressable>
              </View>
            )}
          </Card>

          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleSave} loading={storeLoading}>
              Guardar cambios
            </PrimaryButton>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  documentPreview: {
    padding: theme.spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  documentMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  deleteIconButton: {
    padding: 8,
  },
  imagePreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  attachButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  attachButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#FFFFFF',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
});
