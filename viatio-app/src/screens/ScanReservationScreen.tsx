/**
 * SCAN RESERVATION SCREEN
 *
 * Pantalla para escanear documentos de reserva usando OCR con Gemini AI.
 * Permite capturar foto o seleccionar imagen, procesarla y extraer datos automáticamente.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
} from '@/components';
import { theme } from '@/config';
import { pickImage, pickDocument, readFileAsBase64, isImageFile, extractReservaFromImage } from '@/services';
import type { CreateReservaInput } from '@/types/reserva';
import type { HomeStackParamList } from '@/navigation/types';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScanReservation'>;

type Step = 'select' | 'preview' | 'processing' | 'result';

// Tipo para datos extraídos del OCR (incluye campos adicionales del backend)
interface OcrExtractedData extends Partial<CreateReservaInput> {
  confianza?: 'alta' | 'media' | 'baja';
  metadatos?: Record<string, any>;
}

interface OcrResult {
  success: boolean;
  data?: OcrExtractedData;
  confianza?: 'alta' | 'media' | 'baja';
  error?: string;
}

interface FileItem {
  uri: string;
  base64: string;
  name: string;
  type: string;
}

export default function ScanReservationScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;

  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // HANDLERS
  // ============================================

  const handlePickImage = async (useCamera: boolean) => {
    try {
      // Usar calidad 0.6 para OCR (menor tamaño, sigue siendo legible para IA)
      const imageResult = await pickImage(useCamera, 0.6);

      if (!imageResult) {
        return; // Usuario canceló
      }

      if (!imageResult.base64) {
        showToast.error('Error', 'No se pudo obtener los datos de la imagen');
        return;
      }

      console.log('[ScanReservation] Imagen capturada, tamaño base64:', (imageResult.base64.length / 1024).toFixed(2), 'KB');

      const newFile: FileItem = {
        uri: imageResult.uri,
        base64: imageResult.base64,
        name: `Imagen ${files.length + 1}`,
        type: 'image/jpeg',
      };

      setFiles([...files, newFile]);
      setStep('preview');
      setError(null);
    } catch (error) {
      console.error('[ScanReservation] Error picking image:', error);
      showToast.error('Error', error instanceof Error ? error.message : 'No se pudo seleccionar la imagen'
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const docResult = await pickDocument();

      if (!docResult) {
        return; // Usuario canceló
      }

      // Leer archivo como base64
      const base64 = await readFileAsBase64(docResult.uri);

      const newFile: FileItem = {
        uri: docResult.uri,
        base64,
        name: docResult.name,
        type: docResult.type,
      };

      setFiles([...files, newFile]);
      setStep('preview');
      setError(null);
    } catch (error) {
      console.error('[ScanReservation] Error picking document:', error);
      showToast.error('Error', error instanceof Error ? error.message : 'No se pudo seleccionar el documento'
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (files.length === 1) {
      setStep('select');
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      showToast.error('Error', 'No hay archivos para procesar');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      console.log('[ScanReservation] Procesando', files.length, 'archivos');

      // Validar tamaño de cada imagen (máximo ~4MB de base64 por imagen)
      const maxBase64Size = 4 * 1024 * 1024; // 4MB
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`[ScanReservation] Imagen ${i + 1}: tamaño=${(file.base64.length / 1024).toFixed(2)}KB`);

        if (file.base64.length > maxBase64Size) {
          throw new Error(
            `La imagen ${i + 1} es demasiado grande (${(file.base64.length / 1024 / 1024).toFixed(2)}MB). ` +
            `Máximo permitido: 4MB por imagen`
          );
        }
      }

      let ocrResult;

      if (files.length === 1) {
        // UNA sola imagen: usar modo legacy
        console.log('[ScanReservation] Procesando UNA imagen con OCR');
        ocrResult = await extractReservaFromImage(files[0].base64, files[0].type);
      } else {
        // MÚLTIPLES imágenes: usar nuevo modo de array
        console.log('[ScanReservation] Procesando MÚLTIPLES imágenes con OCR:', files.length);

        const images = files.map((file) => ({
          base64: file.base64,
          mimeType: file.type,
        }));

        ocrResult = await extractReservaFromImage(images);
      }

      setResult(ocrResult);
      setStep('result');

      if (!ocrResult.success) {
        setError(ocrResult.error || 'Error al procesar el archivo');
      }
    } catch (error) {
      console.error('[ScanReservation] Error processing files:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setStep('result');
      setResult({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  const handleUseData = () => {
    if (!result?.success || !result.data) {
      showToast.error('Error', 'No hay datos para usar');
      return;
    }

    // Transformar datos del backend al formato del formulario
    // Eliminamos 'confianza' y 'metadatos' que no van al formulario
    const { confianza, metadatos, ...cleanData } = result.data;

    // Crear objeto con viajeId incluido
    const formData: Partial<CreateReservaInput> = {
      viajeId,
      ...cleanData,
      // Asegurar valores por defecto para campos requeridos
      estadoPago: 'pending',
      moneda: cleanData.moneda || 'EUR',
    };

    console.log('[ScanReservation] Datos transformados para formulario:', formData);

    // Navegar a AddReservation con datos pre-llenados y archivos escaneados
    navigation.navigate('AddReservation', {
      viajeId,
      prefillData: formData,
      scannedFiles: files, // Pasamos los archivos escaneados para crear el documento
    });
  };

  const handleRetry = () => {
    setStep('select');
    setFiles([]);
    setResult(null);
    setError(null);
  };

  const handleBack = () => {
    if (step === 'select') {
      navigation.goBack();
    } else if (step === 'preview') {
      if (files.length > 0) {
        Alert.alert(
          'Descartar archivos',
          '¿Quieres volver atrás y descartar los archivos seleccionados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => {
                setStep('select');
                setFiles([]);
              },
            },
          ]
        );
      } else {
        setStep('select');
      }
    } else {
      handleRetry();
    }
  };

  // ============================================
  // RENDER: SELECT
  // ============================================

  if (step === 'select') {
    return (
      <View style={styles.container}>
        <PageHeader title="Escanear documento" onBack={handleBack} />
        <ScreenContainer>
          <View style={styles.content}>
            <Card style={styles.selectCard}>
              <View style={styles.selectContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="camera" size={48} color="#A855F7" />
                </View>
                <Text style={styles.selectTitle}>Toma una foto o selecciona una imagen</Text>
                <Text style={styles.selectSubtitle}>
                  Escanea tu billete, reserva de hotel o cualquier documento de viaje
                </Text>

                <View style={styles.buttonContainer}>
                  <View style={styles.buttonRow}>
                    <View style={styles.halfButton}>
                      <SecondaryButton onPress={() => handlePickImage(false)}>
                        Galería
                      </SecondaryButton>
                    </View>
                    <View style={styles.halfButton}>
                      <PrimaryButton onPress={() => handlePickImage(true)}>
                        Cámara
                      </PrimaryButton>
                    </View>
                  </View>
                  <SecondaryButton onPress={handlePickDocument}>
                    Seleccionar documento (PDF/Imagen)
                  </SecondaryButton>
                </View>
              </View>
            </Card>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER: PREVIEW
  // ============================================

  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <PageHeader
          title={`Archivos (${files.length})`}
          onBack={handleBack}
        />
        <ScreenContainer>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Lista de archivos */}
            {files.map((file, index) => (
              <Card key={index} style={styles.fileCard}>
                <View style={styles.fileHeader}>
                  <View style={styles.fileInfo}>
                    <Ionicons
                      name={isImageFile(file.type) ? 'image' : 'document'}
                      size={20}
                      color={theme.colors.primaryLight}
                    />
                    <Text style={styles.fileName}>{file.name}</Text>
                  </View>
                  <Pressable onPress={() => handleRemoveFile(index)} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                  </Pressable>
                </View>
                {isImageFile(file.type) && (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="contain" />
                )}
              </Card>
            ))}

            {/* Botón para añadir más archivos */}
            <Card style={styles.addMoreCard}>
              <Text style={styles.addMoreTitle}>¿Más documentos para esta reserva?</Text>
              <Text style={styles.addMoreSubtitle}>
                Añade todos los documentos relacionados (billetes, confirmaciones, etc.)
              </Text>
              <View style={styles.buttonRow}>
                <View style={styles.halfButton}>
                  <SecondaryButton onPress={() => handlePickImage(false)}>
                    Galería
                  </SecondaryButton>
                </View>
                <View style={styles.halfButton}>
                  <SecondaryButton onPress={handlePickDocument}>
                    Documento
                  </SecondaryButton>
                </View>
              </View>
            </Card>

            {/* Botones de acción */}
            <View style={styles.buttonColumn}>
              <PrimaryButton onPress={handleProcess}>
                Procesar con IA
              </PrimaryButton>
              <SecondaryButton onPress={handleRetry}>
                Descartar todo
              </SecondaryButton>
            </View>
          </ScrollView>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER: PROCESSING
  // ============================================

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <PageHeader title="Procesando..." onBack={() => {}} />
        <ScreenContainer>
          <View style={styles.content}>
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primaryLight} />
              <Text style={styles.loadingText}>
                {`Analizando ${files.length} ${files.length === 1 ? 'documento' : 'documentos'}...`}
              </Text>
              <Text style={styles.loadingSubtext}>Esto puede tardar unos segundos</Text>
            </View>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER: RESULT
  // ============================================

  if (step === 'result') {
    // Success
    if (result?.success && result.data) {
      const confianzaColor =
        result.confianza === 'alta' ? '#10B981' : result.confianza === 'media' ? '#F59E0B' : '#F97316';

      return (
        <View style={styles.container}>
          <PageHeader title="Datos extraídos" onBack={handleBack} />
          <ScreenContainer>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Badge de confianza */}
              <View style={styles.confianzaBadge}>
                <View style={[styles.confianzaDot, { backgroundColor: confianzaColor }]} />
                <Text style={styles.confianzaText}>
                  {`Confianza: ${result.confianza === 'alta' ? 'Alta' : result.confianza === 'media' ? 'Media' : 'Baja'}`}
                </Text>
              </View>

              {/* Datos extraídos */}
              <Card style={styles.resultCard}>
                <Text style={styles.resultTitle}>Datos detectados</Text>

                {result.data.nombre && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Nombre:</Text>
                    <Text style={styles.resultValue}>{result.data.nombre}</Text>
                  </View>
                )}

                {result.data.categoria && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Categoría:</Text>
                    <Text style={styles.resultValue}>
                      {result.data.categoria === 'transport' ? 'Transporte' : result.data.categoria === 'accommodation' ? 'Alojamiento' : result.data.categoria === 'food' ? 'Comida' : result.data.categoria === 'activity' ? 'Actividad' : 'Otro'}
                    </Text>
                  </View>
                )}

                {result.data.proveedor && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Proveedor:</Text>
                    <Text style={styles.resultValue}>{result.data.proveedor}</Text>
                  </View>
                )}

                {result.data.numeroConfirmacion && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Nº Confirmación:</Text>
                    <Text style={styles.resultValue}>{result.data.numeroConfirmacion}</Text>
                  </View>
                )}

                {result.data.fechaInicio && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Fecha inicio:</Text>
                    <Text style={styles.resultValue}>{result.data.fechaInicio}</Text>
                  </View>
                )}

                {result.data.ubicacion && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Ubicación:</Text>
                    <Text style={styles.resultValue}>{result.data.ubicacion}</Text>
                  </View>
                )}

                {result.data.precio && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Precio:</Text>
                    <Text style={styles.resultValue}>
                      {`${result.data.precio} ${result.data.moneda || 'EUR'}`}
                    </Text>
                  </View>
                )}
              </Card>

              <View style={styles.buttonColumn}>
                <PrimaryButton onPress={handleUseData}>
                  Usar estos datos
                </PrimaryButton>
                <SecondaryButton onPress={handleRetry}>
                  Intentar de nuevo
                </SecondaryButton>
              </View>
            </ScrollView>
          </ScreenContainer>
        </View>
      );
    }

    // Error
    return (
      <View style={styles.container}>
        <PageHeader title="Error" onBack={handleBack} />
        <ScreenContainer>
          <View style={styles.content}>
            <Card style={styles.errorCard}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
              </View>
              <Text style={styles.errorTitle}>No se pudo procesar la imagen</Text>
              <Text style={styles.errorMessage}>{error || 'Error desconocido'}</Text>
            </Card>

            <PrimaryButton onPress={handleRetry}>
              Intentar de nuevo
            </PrimaryButton>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  selectCard: {
    padding: theme.spacing.xl,
  },
  selectContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  buttonColumn: {
    gap: theme.spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  fileCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  addMoreCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F9FAFB',
  },
  addMoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addMoreSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  previewCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 300,
    marginTop: theme.spacing.sm,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  confianzaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  confianzaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  confianzaText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  resultCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 120,
  },
  resultValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  errorCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
