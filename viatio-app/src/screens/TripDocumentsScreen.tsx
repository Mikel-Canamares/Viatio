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
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  PageHeader,
  PrimaryButton,
  Card,
  DocumentCategoryGroup,
} from '@/components';
import { theme } from '@/config';
import { useDocumentosStore } from '@/store/documentosStore';
import { openDocument } from '@/utils/documentViewer';
import type { Documento, CategoriaDocumento } from '@/types/documento';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDocuments'>;

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
   * Agrupa documentos por categoría
   */
  const documentosPorCategoria = documentos.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = [];
    }
    acc[doc.categoria].push(doc);
    return acc;
  }, {} as Record<CategoriaDocumento, Documento[]>);

  /**
   * Ordena categorías por cantidad de documentos (mayor a menor)
   */
  const categoriasOrdenadas = Object.keys(documentosPorCategoria)
    .map((cat) => cat as CategoriaDocumento)
    .sort((a, b) => {
      const totalA = documentosPorCategoria[a].length;
      const totalB = documentosPorCategoria[b].length;
      return totalB - totalA;
    });

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
  // RENDER: MAIN
  // ============================================

  return (
    <View style={styles.container}>
      <PageHeader title="Documentos" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Grupos de documentos por categoría */}
          {categoriasOrdenadas.map((categoria) => (
            <DocumentCategoryGroup
              key={categoria}
              categoria={categoria}
              documentos={documentosPorCategoria[categoria]}
              onViewDocument={handleViewDocument}
              onEditDocument={handleEditDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          ))}

          {/* Espaciado para el botón fijo */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Espacio para el botón fijo
  },
  bottomSpacer: {
    height: theme.spacing.lg,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary,
    ...theme.shadows.card,
  },
});
