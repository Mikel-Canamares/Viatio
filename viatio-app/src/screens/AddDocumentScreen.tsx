/**
 * ADD DOCUMENT SCREEN
 *
 * Pantalla para añadir un nuevo documento al viaje.
 * Permite seleccionar archivo, asignar nombre y categoría.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  PageHeader,
  Card,
  Input,
  PrimaryButton,
  SecondaryButton,
} from '@/components';
import { theme } from '@/config';
import { useDocumentosStore } from '@/store/documentosStore';
import { pickDocument, formatFileSize, isImageFile } from '@/services';
import type { CategoriaDocumento } from '@/types/documento';
import { DOCUMENTO_CATEGORIAS, MAX_FILE_SIZE } from '@/types/documento';
import { detectTipoArchivo } from '@/services/documentosService';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddDocument'>;

// ============================================
// TYPES
// ============================================

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// ============================================
// COMPONENT
// ============================================

export default function AddDocumentScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;
  const { addDocumento, loading } = useDocumentosStore();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDocumento | null>(null);

  // ============================================
  // HANDLERS
  // ============================================

  const handlePickFile = async () => {
    try {
      const result = await pickDocument();

      if (!result) {
        return; // Usuario canceló
      }

      // Validar tamaño
      if (result.size > MAX_FILE_SIZE) {
        Alert.alert(
          'Archivo muy grande',
          `El archivo debe ser menor a ${formatFileSize(MAX_FILE_SIZE)}`
        );
        return;
      }

      setSelectedFile({
        uri: result.uri,
        name: result.name,
        type: result.type,
        size: result.size,
      });

      // Pre-rellenar nombre si está vacío
      if (!nombre) {
        // Quitar extensión del nombre
        const nameWithoutExtension = result.name.replace(/\.[^/.]+$/, '');
        setNombre(nameWithoutExtension);
      }
    } catch (error) {
      console.error('[AddDocument] Error picking file:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!selectedFile) {
      Alert.alert('Error', 'Debes seleccionar un archivo');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'Debes ingresar un nombre para el documento');
      return;
    }

    if (!categoria) {
      Alert.alert('Error', 'Debes seleccionar una categoría');
      return;
    }

    try {
      const tipoArchivo = detectTipoArchivo(selectedFile.type);

      const documento = await addDocumento(
        {
          viajeId,
          nombre: nombre.trim(),
          categoria,
          tipoArchivo,
          rutaArchivo: selectedFile.name,
          tamano: selectedFile.size,
        },
        selectedFile.uri
      );

      if (documento) {
        Alert.alert('Éxito', 'Documento guardado correctamente', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo guardar el documento');
      }
    } catch (error) {
      console.error('[AddDocument] Error saving document:', error);
      Alert.alert('Error', 'No se pudo guardar el documento');
    }
  };

  // ============================================
  // RENDER: FILE SELECTOR
  // ============================================

  const renderFileSelector = () => {
    if (!selectedFile) {
      return (
        <Pressable onPress={handlePickFile}>
          <Card style={styles.uploadCard}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload" size={40} color={theme.colors.primaryLight} />
            </View>
            <Text style={styles.uploadTitle}>Toca para seleccionar un archivo</Text>
            <Text style={styles.uploadSubtitle}>PDF o imagen, máximo 10MB</Text>
          </Card>
        </Pressable>
      );
    }

    return (
      <Card style={styles.filePreviewCard}>
        <View style={styles.filePreviewContent}>
          {/* Miniatura o icono */}
          <View style={styles.fileIconContainer}>
            {isImageFile(selectedFile.type) ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.fileThumbnail} />
            ) : (
              <Ionicons
                name="document-text"
                size={32}
                color={theme.colors.primaryLight}
              />
            )}
          </View>

          {/* Info del archivo */}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
          </View>
        </View>

        {/* Botón cambiar */}
        <SecondaryButton onPress={handlePickFile}>Cambiar</SecondaryButton>
      </Card>
    );
  };

  // ============================================
  // RENDER: CATEGORY GRID
  // ============================================

  const renderCategoryGrid = () => {
    const categories: CategoriaDocumento[] = [
      'identidad',
      'transporte',
      'alojamiento',
      'seguro',
      'actividades',
      'otros',
    ];

    return (
      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const config = DOCUMENTO_CATEGORIAS[cat];
          const isSelected = categoria === cat;

          return (
            <Pressable
              key={cat}
              onPress={() => setCategoria(cat)}
              style={[
                styles.categoryOption,
                { backgroundColor: config.color + '10' },
                isSelected && {
                  borderColor: config.color,
                  borderWidth: 2,
                  backgroundColor: config.color + '20',
                },
              ]}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: '#FFFFFF' },
                ]}
              >
                <Ionicons
                  name={config.icon as any}
                  size={20}
                  color={config.color}
                />
              </View>
              <Text style={styles.categoryLabel}>{config.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // ============================================
  // RENDER: MAIN
  // ============================================

  return (
    <View style={styles.container}>
      <PageHeader title="Añadir documento" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Selector de archivo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seleccionar archivo</Text>
            {renderFileSelector()}
          </View>

          {/* Card 2: Información */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <Card style={styles.formCard}>
              <Input
                label="Nombre del documento"
                placeholder="Ej: Pasaporte - Juan Pérez"
                value={nombre}
                onChangeText={setNombre}
              />
            </Card>
          </View>

          {/* Card 3: Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <Card style={styles.formCard}>{renderCategoryGrid()}</Card>
          </View>

          {/* Espaciado para el botón fijo */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ScreenContainer>

      {/* Botón fijo */}
      <View style={styles.bottomButton}>
        {loading ? (
          <View style={styles.loadingButtonContainer}>
            <ActivityIndicator color={theme.colors.primaryLight} size="small" />
            <Text style={styles.loadingButtonText}>Guardando...</Text>
          </View>
        ) : (
          <PrimaryButton onPress={handleSave}>
            Guardar documento
          </PrimaryButton>
        )}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  uploadCard: {
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.primaryLight + '10',
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  filePreviewCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  filePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  fileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fileThumbnail: {
    width: '100%',
    height: '100%',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  fileSize: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  formCard: {
    padding: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  categoryOption: {
    width: '47%',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  loadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
});
