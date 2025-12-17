/**
 * TRIP DOCUMENTS SCREEN
 *
 * Pantalla para ver y gestionar documentos de un viaje.
 * Muestra documentos agrupados por categoría con opción de añadir nuevos.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  PageHeader,
  DocumentCard,
  PrimaryButton,
  Card,
} from '@/components';
import { theme } from '@/config';
import { useDocumentosStore } from '@/store/documentosStore';
import { openDocument } from '@/utils/documentViewer';
import type { Documento, CategoriaDocumento } from '@/types/documento';
import { DOCUMENTO_CATEGORIAS } from '@/types/documento';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDocuments'>;

// ============================================
// TYPES
// ============================================

interface DocumentSection {
  categoria: CategoriaDocumento;
  data: Documento[];
}

// ============================================
// COMPONENT
// ============================================

export default function TripDocumentsScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;
  const { documentos, loading, error, fetchDocumentos, removeDocumento, clearError } = useDocumentosStore();

  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadDocumentos();
  }, [viajeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  // ============================================
  // HANDLERS
  // ============================================

  const loadDocumentos = async () => {
    await fetchDocumentos(viajeId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocumentos();
    setRefreshing(false);
  };

  const handleViewDocument = async (documento: Documento) => {
    try {
      await openDocument(documento);
    } catch (error) {
      // El error ya se maneja en openDocument con Alert
      console.error('[TripDocuments] Error opening document:', error);
    }
  };

  const handleEditDocument = (documento: Documento) => {
    navigation.navigate('EditDocument', {
      documentoId: documento.id,
      nombreActual: documento.nombre,
    });
  };

  const handleAddDocument = () => {
    navigation.navigate('AddDocument', { viajeId });
  };

  const handleDeleteDocument = (documento: Documento) => {
    Alert.alert(
      'Eliminar documento',
      `¿Estás seguro de que quieres eliminar "${documento.nombre}"? Si está asociado a una reserva, se desvinculará automáticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeDocumento(documento.id);
            // Recargar lista
            await loadDocumentos();
          },
        },
      ]
    );
  };

  // ============================================
  // DATA PROCESSING
  // ============================================

  /**
   * Agrupa documentos por categoría para SectionList
   */
  const groupedDocuments = (): DocumentSection[] => {
    const groups: Record<CategoriaDocumento, Documento[]> = {
      identidad: [],
      transporte: [],
      alojamiento: [],
      seguro: [],
      actividades: [],
      otros: [],
    };

    // Agrupar documentos
    documentos.forEach((doc) => {
      groups[doc.categoria].push(doc);
    });

    // Convertir a array de secciones (solo categorías con documentos)
    return Object.entries(groups)
      .filter(([_, docs]) => docs.length > 0)
      .map(([categoria, data]) => ({
        categoria: categoria as CategoriaDocumento,
        data,
      }));
  };

  const sections = groupedDocuments();

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (loading && documentos.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader title="Documentos" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>Cargando documentos...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER: EMPTY STATE
  // ============================================

  if (documentos.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader title="Documentos" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.emptyContainer}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No tienes documentos</Text>
              <Text style={styles.emptyDescription}>
                Guarda tus billetes, reservas y documentos importantes
              </Text>
              <PrimaryButton onPress={handleAddDocument}>Añadir documento</PrimaryButton>
            </Card>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // ============================================
  // RENDER: SECTION HEADER
  // ============================================

  const renderSectionHeader = ({ section }: { section: DocumentSection }) => {
    const categoryConfig = DOCUMENTO_CATEGORIAS[section.categoria];

    return (
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconContainer,
            { backgroundColor: categoryConfig.color + '20' },
          ]}
        >
          <Ionicons
            name={categoryConfig.icon as any}
            size={24}
            color={categoryConfig.color}
          />
        </View>
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionTitle}>{categoryConfig.label}</Text>
          <Text style={styles.sectionSubtitle}>
            {section.data.length} {section.data.length === 1 ? 'archivo' : 'archivos'}
          </Text>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER: DOCUMENT ITEM
  // ============================================

  const renderItem = ({ item }: { item: Documento }) => (
    <View style={styles.itemContainer}>
      <DocumentCard
        documento={item}
        onPress={() => handleViewDocument(item)}
        onEdit={() => handleEditDocument(item)}
        onDelete={() => handleDeleteDocument(item)}
      />
    </View>
  );

  // ============================================
  // RENDER: MAIN
  // ============================================

  return (
    <View style={styles.container}>
      <PageHeader title="Documentos" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </ScreenContainer>

      {/* Botón fijo en la parte inferior */}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleAddDocument}>
          Añadir documento
        </PrimaryButton>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  itemContainer: {
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
