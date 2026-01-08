/**
 * TRIP DOCUMENTS SCREEN
 *
 * Pantalla para ver y gestionar documentos de un viaje.
 * Muestra documentos agrupados por categoría con opción de añadir nuevos.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useDocumentosStore, documentosSelectors } from '@/store/documentosStore';
import { openDocument } from '@/utils/documentViewer';
import { getViajeById } from '@/services/viajesService';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import type { Documento, CategoriaDocumento } from '@/types/documento';
import type { Viaje } from '@/types/viaje';
import type { HomeStackParamList } from '@/navigation/types';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDocuments'>;

// ============================================
// COMPONENT
// ============================================

export default function TripDocumentsScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;

  // Usar selectors para prevenir re-renders innecesarios
  const documentos = useDocumentosStore(documentosSelectors.documentos);
  const loading = useDocumentosStore(documentosSelectors.loading);
  const error = useDocumentosStore(documentosSelectors.error);

  // Seleccionar acciones individualmente para evitar crear nuevos objetos
  const fetchDocumentos = useDocumentosStore((state) => state.fetchDocumentos);
  const removeDocumento = useDocumentosStore((state) => state.removeDocumento);
  const clearError = useDocumentosStore((state) => state.clearError);

  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Cargar datos del viaje
  useEffect(() => {
    const loadViaje = async () => {
      const viajeData = await getViajeById(viajeId);
      setViaje(viajeData);
    };
    loadViaje();
  }, [viajeId]);

  // Memoizar loadDocumentos para que sea estable entre renders
  // fetchDocumentos es ahora una referencia estable gracias a los selectors
  const loadDocumentos = useCallback(async () => {
    console.log('[TripDocuments] 📂 Cargando documentos para viajeId:', viajeId);
    await fetchDocumentos(viajeId);
    console.log('[TripDocuments] 📊 Carga completada');
  }, [viajeId, fetchDocumentos]);

  useEffect(() => {
    loadDocumentos();
  }, [loadDocumentos]);

  useEffect(() => {
    if (error) {
      showToast.error('Error', error);
      clearError();
    }
  }, [error, clearError]);

  // Callback memoizado para sincronización en tiempo real con debounce
  // Previene múltiples recargas cuando hay 2 listeners activos
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleDocumentsChange = useCallback(() => {
    // Cancelar recarga anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Programar nueva recarga con pequeño delay
    debounceTimerRef.current = setTimeout(() => {
      console.log('[TripDocuments] Documentos actualizados, recargando...');
      loadDocumentos();
      debounceTimerRef.current = null;
    }, 100); // 100ms de delay para consolidar múltiples eventos
  }, [loadDocumentos]);

  // Sincronización en tiempo real para viajes compartidos
  // Usar useMemo para evitar que cambios en viaje disparen re-montaje de useRealtimeSync
  const syncConfig = useMemo(() => {
    if (!viaje) {
      return { isShared: false, firestoreId: null };
    }
    return {
      isShared: viaje.isShared === 1,
      firestoreId: viaje.firestoreId || null,
    };
  }, [viaje?.isShared, viaje?.firestoreId]);

  useRealtimeSync(syncConfig.firestoreId, viajeId, syncConfig.isShared, {
    onDocumentsChange: handleDocumentsChange,
  });

  // ============================================
  // HANDLERS
  // ============================================

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
