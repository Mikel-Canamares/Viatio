/**
 * DOCUMENT CATEGORY GROUP COMPONENT
 *
 * Componente desplegable que agrupa documentos de una misma categoría.
 * Muestra el resumen de la categoría y permite expandir para ver el detalle.
 * Cada documento mantiene el gesto swipeable para editar/borrar.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DocumentCard from './DocumentCard';
import { Documento, DOCUMENTO_CATEGORIAS, CategoriaDocumento } from '@/types/documento';
import { theme } from '@/config';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================
// TIPOS
// ============================================

interface DocumentCategoryGroupProps {
  categoria: CategoriaDocumento;
  documentos: Documento[];
  onViewDocument: (documento: Documento) => void;
  onEditDocument: (documento: Documento) => void;
  onDeleteDocument: (documento: Documento) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DocumentCategoryGroup({
  categoria,
  documentos,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
}: DocumentCategoryGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const categoriaInfo = DOCUMENTO_CATEGORIAS[categoria];
  const cantidadDocumentos = documentos.length;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      {/* Header - Siempre visible */}
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        onPress={toggleExpand}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoriaInfo.color}20` }]}>
            <Ionicons name={categoriaInfo.icon as any} size={24} color={categoriaInfo.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.categoriaLabel}>{categoriaInfo.label}</Text>
            <Text style={styles.cantidadText}>
              {cantidadDocumentos} {cantidadDocumentos === 1 ? 'archivo' : 'archivos'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Lista de documentos - Solo visible cuando está expandido */}
      {expanded && (
        <View style={styles.documentosContainer}>
          {documentos.map((documento, index) => {
            const isLast = index === documentos.length - 1;

            return (
              <View
                key={documento.id}
                style={[
                  styles.documentoItem,
                  !isLast && styles.documentoItemMargin,
                ]}
              >
                <DocumentCard
                  documento={documento}
                  onPress={() => onViewDocument(documento)}
                  onEdit={() => onEditDocument(documento)}
                  onDelete={() => onDeleteDocument(documento)}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  headerPressed: {
    backgroundColor: theme.colors.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  categoriaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cantidadText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  headerRight: {
    marginLeft: theme.spacing.sm,
  },

  // Lista de documentos
  documentosContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  documentoItem: {
    // El DocumentCard ya tiene sus propios estilos
  },
  documentoItemMargin: {
    marginBottom: theme.spacing.md,
  },
});
