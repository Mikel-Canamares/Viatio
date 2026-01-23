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
  TimeInput,
  SectionHeader,
  PrimaryButton,
  SubtypeSelector,
  CustomModal,
} from '@/components';
import { DatePickerInput } from '@/components/DatePickerInput';
import { MemberChipsSelector } from '@/components/shared/MemberChipsSelector';
import { SplitMethodSelector } from '@/components/shared/SplitMethodSelector';
import { SharesEditor } from '@/components/shared/SharesEditor';
import { theme } from '@/config';
import { useReservasStore } from '@/store/reservasStore';
import { useDocumentosStore } from '@/store/documentosStore';
import { getViajeById } from '@/services';
import { getReservaById } from '@/services/reservasService';
import {
  getDocumentosByReservaId,
  updateDocumentoCategoria,
  unlinkDocumentoFromReserva,
  linkDocumentoToReserva,
} from '@/services/documentosService';
import { parseLocalDate } from '@/utils';
import { useTripMembers } from '@/hooks';
import type {
  CreateReservaInput,
  CategoriaReserva,
  SubtipoTransporte,
  SubtipoAlojamiento,
  SubtipoActividad,
} from '@/types/reserva';
import type { SplitMethod, ExpenseShare } from '@/types/shared';
import {
  mapReservaToCategoriaDocumento,
  SUBTIPOS_TRANSPORTE,
  SUBTIPOS_ALOJAMIENTO,
  SUBTIPOS_ACTIVIDAD,
} from '@/types/reserva';
import type { Viaje } from '@/types/viaje';
import type { Documento } from '@/types/documento';
import type { HomeStackParamList } from '@/navigation/types';
import { showToast } from '@/utils/toast';

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

  // Document state - ahora soporta múltiples documentos
  const [existingDocuments, setExistingDocuments] = useState<Documento[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  // Hook para obtener miembros del viaje compartido
  const { members, loading: loadingMembers } = useTripMembers(viaje?.firestoreId || null);

  // Estados para el sistema de reparto
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [participantUids, setParticipantUids] = useState<string[]>([]);
  const [shares, setShares] = useState<Omit<ExpenseShare, 'calculatedAmount'>[]>([]);

  // Estados para fechas límite
  const [fechaLimitePago, setFechaLimitePago] = useState<string>('');
  const [cancelacionGratuita, setCancelacionGratuita] = useState<boolean>(false);
  const [fechaLimiteCancelacion, setFechaLimiteCancelacion] = useState<string>('');

  // Estados para modales
  const [permissionModal, setPermissionModal] = useState(false);
  const [deleteDocModal, setDeleteDocModal] = useState<{
    visible: boolean;
    documentoId: string | null;
  }>({ visible: false, documentoId: null });

  useEffect(() => {
    loadData();
  }, [reservaId]);

  // Inicializar participantes cuando hay miembros y alguien pagó
  useEffect(() => {
    if (members.length > 0 && formData.paidByUserId && participantUids.length === 0 && !loading) {
      // Por defecto, todos los miembros participan (solo si no hay datos previos)
      const allUids = members.map((m) => m.uid);
      setParticipantUids(allUids);
    }
  }, [members, formData.paidByUserId, loading]);

  // Actualizar shares cuando cambian los participantes o el método
  useEffect(() => {
    if (participantUids.length > 0 && !loading) {
      const newShares = participantUids.map((uid) => {
        const member = members.find((m) => m.uid === uid);
        const existingShare = shares.find((s) => s.uid === uid);
        return {
          uid,
          displayName: member?.displayName || 'Desconocido',
          value: existingShare?.value || (splitMethod === 'shares' ? 1 : 0),
        };
      });
      setShares(newShares);
    } else if (participantUids.length === 0 && !loading) {
      setShares([]);
    }
  }, [participantUids, splitMethod, members, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const reservaData = await getReservaById(reservaId);

      if (!reservaData) {
        showToast.error('Error', 'No se encontró la reserva');
        navigation.goBack();
        return;
      }

      // Cargar viaje para limitar fechas
      const viajeData = await getViajeById(reservaData.viajeId);
      setViaje(viajeData);

      // Cargar documentos asociados desde tabla intermedia
      const docs = await getDocumentosByReservaId(reservaId);
      setExistingDocuments(docs);

      // DEBUG: Verificar metadatos cargados
      console.log('[EditReservationScreen] Reserva cargada:', reservaData.id);
      console.log('[EditReservationScreen] Metadatos recibidos:', JSON.stringify(reservaData.metadatos, null, 2));
      console.log('[EditReservationScreen] Tipo de metadatos:', typeof reservaData.metadatos);

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
        paidByUserId: reservaData.paidByUserId,
        notas: reservaData.notas,
        metadatos: reservaData.metadatos, // CRITICAL: Incluir metadatos para que se cargue el subtipo
      });

      // DEBUG: Verificar formData después de setear
      console.log('[EditReservationScreen] FormData.metadatos después de setear:', JSON.stringify(reservaData.metadatos, null, 2));

      // Cargar datos de reparto si existen
      if (reservaData.splitMethod) {
        setSplitMethod(reservaData.splitMethod);
      }
      if (reservaData.participantUids && reservaData.participantUids.length > 0) {
        setParticipantUids(reservaData.participantUids);
      }
      if (reservaData.shares && reservaData.shares.length > 0) {
        // Convertir de ExpenseShare a Omit<ExpenseShare, 'calculatedAmount'>
        setShares(
          reservaData.shares.map((s) => ({
            uid: s.uid,
            displayName: s.displayName,
            value: s.value,
          }))
        );
      }

      // Cargar fechas límite desde metadatos
      if (reservaData.metadatos?.fechaLimitePago) {
        setFechaLimitePago(reservaData.metadatos.fechaLimitePago);
      }
      if (reservaData.metadatos?.cancelacionGratuita) {
        setCancelacionGratuita(reservaData.metadatos.cancelacionGratuita);
      }
      if (reservaData.metadatos?.fechaLimiteCancelacion) {
        setFechaLimiteCancelacion(reservaData.metadatos.fechaLimiteCancelacion);
      }
    } catch (error) {
      console.error('[EditReservationScreen] Error al cargar datos:', error);
      showToast.error('Error', 'No se pudo cargar la reserva');
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
      showToast.error('Error', 'No se pudo seleccionar el documento');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setPermissionModal(true);
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
      showToast.error('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleDeleteExistingDocument = (documentoId: string) => {
    setDeleteDocModal({ visible: true, documentoId });
  };

  const confirmDeleteDocument = () => {
    if (deleteDocModal.documentoId) {
      // Añadir a lista de documentos a eliminar
      setDocumentsToDelete((prev) => [...prev, deleteDocModal.documentoId!]);
      // Remover de lista de documentos existentes
      setExistingDocuments((prev) => prev.filter((d) => d.id !== deleteDocModal.documentoId));
      setDeleteDocModal({ visible: false, documentoId: null });
    }
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.categoria) {
      showToast.error('Error', 'El nombre y la categoría son obligatorios');
      return;
    }

    try {
      // 1. Desvincular y eliminar documentos marcados para eliminación
      for (const docId of documentsToDelete) {
        await unlinkDocumentoFromReserva(reservaId, docId);
        await removeDocumento(docId);
      }

      // 2. Actualizar categoría de documentos existentes si la categoría de la reserva cambió
      if (existingDocuments.length > 0 && formData.categoria) {
        const nuevaCategoriaDocumento = mapReservaToCategoriaDocumento(formData.categoria);
        for (const doc of existingDocuments) {
          if (doc.categoria !== nuevaCategoriaDocumento) {
            await updateDocumentoCategoria(doc.id, nuevaCategoriaDocumento);
            console.log('[EditReservation] Categoría de documento actualizada:', {
              documentoId: doc.id,
              categoriaAnterior: doc.categoria,
              categoriaNueva: nuevaCategoriaDocumento,
            });
          }
        }
      }

      // 3. Crear y vincular nuevo documento si se adjuntó
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
          await linkDocumentoToReserva(reservaId, documento.id);
          console.log('[EditReservation] Nuevo documento vinculado a la reserva');
        }
      }

      // 4. Actualizar la reserva
      // Preparar metadatos con fechas límite
      const metadatosCompletos = {
        ...formData.metadatos,
        fechaLimitePago: fechaLimitePago || undefined,
        cancelacionGratuita: cancelacionGratuita || undefined,
        fechaLimiteCancelacion: cancelacionGratuita ? (fechaLimiteCancelacion || undefined) : undefined,
      };

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
        paidByUserId: formData.paidByUserId,
        splitMethod: participantUids.length > 0 ? splitMethod : undefined,
        participantUids: participantUids.length > 0 ? participantUids : undefined,
        shares: shares.length > 0 ? shares : undefined,
        notas: formData.notas,
        metadatos: metadatosCompletos,
      };

      await updateReserva(reservaId, input);
      navigation.goBack();
    } catch (error) {
      console.error('[EditReservationScreen] Error al guardar:', error);
      showToast.error('Error', 'No se pudieron guardar los cambios');
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
              <>
                {console.log('[EditReservationScreen] Renderizando SubtypeSelector')}
                {console.log('[EditReservationScreen] formData.metadatos:', formData.metadatos)}
                {console.log('[EditReservationScreen] formData.metadatos?.subtipoAlojamiento:', formData.metadatos?.subtipoAlojamiento)}
                <SubtypeSelector
                  label="Tipo de alojamiento"
                  options={SUBTIPOS_ALOJAMIENTO}
                  value={formData.metadatos?.subtipoAlojamiento}
                  onSelect={(value) => updateMetadata('subtipoAlojamiento', value as SubtipoAlojamiento)}
                />

                {/* Cancelación gratuita - Solo para accommodation */}
                <Pressable
                  onPress={() => {
                    const newValue = !cancelacionGratuita;
                    setCancelacionGratuita(newValue);
                    if (!newValue) {
                      setFechaLimiteCancelacion('');
                    }
                  }}
                  style={styles.checkboxRow}
                >
                  <View style={[
                    styles.checkbox,
                    cancelacionGratuita && styles.checkboxSelected
                  ]}>
                    {cancelacionGratuita && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Cancelación gratuita</Text>
                </Pressable>

                {cancelacionGratuita && (
                  <DatePickerInput
                    label="Fecha límite de cancelación"
                    value={fechaLimiteCancelacion}
                    onChange={setFechaLimiteCancelacion}
                    minDate={new Date()}
                    maxDate={formData.fechaInicio ? new Date(formData.fechaInicio) : undefined}
                  />
                )}
              </>
            )}

            {formData.categoria === 'activity' && (
              <SubtypeSelector
                label="Tipo de actividad"
                options={SUBTIPOS_ACTIVIDAD}
                value={formData.metadatos?.subtipoActividad}
                onSelect={(value) => updateMetadata('subtipoActividad', value as SubtipoActividad)}
              />
            )}

            {/* Dirección - Para accommodation y food */}
            {(formData.categoria === 'accommodation' || formData.categoria === 'food') && (
              <Input
                label="Dirección"
                value={formData.direccion || ''}
                onChangeText={(value) => updateField('direccion', value)}
                placeholder="Dirección completa"
              />
            )}

            {/* Proveedor - Oculto para food y accommodation */}
            {formData.categoria !== 'food' && formData.categoria !== 'accommodation' && (
              <Input
                label={
                  formData.categoria === 'transport'
                    ? 'Compañía'
                    : formData.categoria === 'activity'
                    ? 'Organizador'
                    : 'Proveedor'
                }
                value={formData.proveedor || ''}
                onChangeText={(value) => updateField('proveedor', value)}
                placeholder={
                  formData.categoria === 'transport'
                    ? 'Ej: Renfe, Iberia...'
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
                  minDate={viaje ? parseLocalDate(viaje.fechaInicio) : undefined}
                  maxDate={viaje ? parseLocalDate(viaje.fechaFin) : undefined}
                />
              </View>
              <View style={styles.halfWidth}>
                <TimeInput
                  label="Hora inicio"
                  value={formData.horaInicio || ''}
                  onChangeTime={(value) => updateField('horaInicio', value)}
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
                  minDate={viaje ? parseLocalDate(viaje.fechaInicio) : undefined}
                  maxDate={viaje ? parseLocalDate(viaje.fechaFin) : undefined}
                />
              </View>
              <View style={styles.halfWidth}>
                <TimeInput
                  label="Hora fin"
                  value={formData.horaFin || ''}
                  onChangeTime={(value) => updateField('horaFin', value)}
                  placeholder="18:00"
                />
              </View>
            </View>
          </Card>

          {/* Ubicación - Solo para transport y activity */}
          {(formData.categoria === 'transport' || formData.categoria === 'activity') && (
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
                    : formData.categoria === 'activity'
                    ? 'Ej: Entrada principal del museo'
                    : 'Nombre del lugar'
                }
              />
              <Input
                label="Dirección"
                value={formData.direccion || ''}
                onChangeText={(value) => updateField('direccion', value)}
                placeholder={
                  formData.categoria === 'activity'
                    ? 'Ej: Paseo del Prado, s/n, Madrid'
                    : 'Dirección completa'
                }
              />
            </Card>
          )}

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

              {/* Fecha límite de pago - Solo si está pendiente */}
              {formData.estadoPago === 'pending' && (
                <DatePickerInput
                  label="Fecha límite de pago (opcional)"
                  value={fechaLimitePago}
                  onChange={setFechaLimitePago}
                  minDate={new Date()}
                />
              )}

              {/* Selector de quién pagó - Solo en viajes compartidos y si el estado es pagado o parcial */}
              {viaje?.isShared && members.length > 0 && (formData.estadoPago === 'paid' || formData.estadoPago === 'partial') && (
                <>
                  <MemberChipsSelector
                    members={members}
                    selectedUids={formData.paidByUserId ? [formData.paidByUserId] : []}
                    onToggle={(uid) => updateField('paidByUserId', uid)}
                    singleSelect={true}
                    label="Pagado por"
                  />

                  {/* Sistema de reparto - Solo si hay precio y alguien pagó */}
                  {formData.precio && formData.paidByUserId && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.sectionTitle}>Reparto del gasto</Text>

                      <MemberChipsSelector
                        members={members}
                        selectedUids={participantUids}
                        onToggle={(uid) => {
                          setParticipantUids((prev) =>
                            prev.includes(uid)
                              ? prev.filter((id) => id !== uid)
                              : [...prev, uid]
                          );
                        }}
                        singleSelect={false}
                        label="Participantes"
                      />

                      {participantUids.length > 0 && (
                        <>
                          <SplitMethodSelector
                            selected={splitMethod}
                            onSelect={setSplitMethod}
                          />

                          <SharesEditor
                            members={members}
                            participantUids={participantUids}
                            splitMethod={splitMethod}
                            shares={shares}
                            onChange={setShares}
                            totalAmount={Math.round(parseFloat(formData.precio.toString()) * 100)}
                            currency={formData.moneda || 'EUR'}
                          />
                        </>
                      )}
                    </>
                  )}
                </>
              )}
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
            <SectionHeader title={existingDocuments.length > 1 ? "Documentos adjuntos" : "Documento adjunto"} />

            {/* Existing documents */}
            {existingDocuments.map((doc) => (
              <View key={doc.id} style={styles.documentPreview}>
                <View style={styles.documentRow}>
                  <View style={styles.documentIconContainer}>
                    <Ionicons
                      name={doc.tipoArchivo === 'pdf' ? 'document-text' : 'image'}
                      size={24}
                      color={theme.colors.primaryLight}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.nombre}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.tipoArchivo.toUpperCase()} • {(doc.tamano / 1024).toFixed(0)} KB
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDeleteExistingDocument(doc.id)} style={styles.deleteIconButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            ))}

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

            {/* Attach buttons - siempre disponibles para añadir más documentos */}
            {!attachedFile && (
              <View style={styles.attachButtons}>
                <Pressable onPress={handlePickDocument} style={styles.attachButton}>
                  <Ionicons name="document-attach-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>
                    {existingDocuments.length > 0 ? 'Añadir PDF' : 'Adjuntar PDF'}
                  </Text>
                </Pressable>
                <Pressable onPress={handlePickImage} style={styles.attachButton}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.primaryLight} />
                  <Text style={styles.attachButtonText}>
                    {existingDocuments.length > 0 ? 'Añadir imagen' : 'Adjuntar imagen'}
                  </Text>
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

      <CustomModal
        visible={permissionModal}
        type="error"
        title="Permiso denegado"
        message="Se necesita acceso a la galería para seleccionar imágenes"
        onClose={() => setPermissionModal(false)}
        primaryButton={{
          text: 'OK',
          onPress: () => {},
        }}
      />

      <CustomModal
        visible={deleteDocModal.visible}
        type="warning"
        title="Eliminar documento"
        message="¿Deseas eliminar el documento asociado? Se eliminará al guardar los cambios."
        onClose={() => setDeleteDocModal({ visible: false, documentoId: null })}
        primaryButton={{
          text: 'Eliminar',
          onPress: confirmDeleteDocument,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => {},
        }}
      />
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  checkboxLabel: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
});
