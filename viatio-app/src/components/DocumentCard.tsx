/**
 * DOCUMENT CARD
 *
 * Tarjeta para mostrar información de un documento de viaje.
 * Muestra icono de categoría, nombre, tipo, tamaño y fecha.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { theme } from '@/config';
import type { Documento } from '@/types/documento';
import { DOCUMENTO_CATEGORIAS } from '@/types/documento';
import { formatFileSize } from '@/services/fileService';

// ============================================
// TYPES
// ============================================

interface DocumentCardProps {
  documento: Documento;
  onPress: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Formatea la fecha de creación del documento
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Retorna estilos del badge según el tipo de archivo
 */
function getTypeBadgeStyles(tipo: string): {
  backgroundColor: string;
  color: string;
  label: string;
} {
  switch (tipo) {
    case 'pdf':
      return {
        backgroundColor: '#FEE2E2', // red-100
        color: '#DC2626', // red-600
        label: 'PDF',
      };
    case 'image':
      return {
        backgroundColor: '#DBEAFE', // blue-100
        color: '#2563EB', // blue-600
        label: 'Imagen',
      };
    default:
      return {
        backgroundColor: '#F3F4F6', // gray-100
        color: '#6B7280', // gray-500
        label: 'Archivo',
      };
  }
}

// ============================================
// COMPONENT
// ============================================

export default function DocumentCard({ documento, onPress, onDownload, onDelete }: DocumentCardProps) {
  const categoryConfig = DOCUMENTO_CATEGORIAS[documento.categoria];
  const typeBadge = getTypeBadgeStyles(documento.tipoArchivo);

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        {/* Row principal */}
        <View style={styles.mainRow}>
          {/* Icono de categoría */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: categoryConfig.color + '20' }, // 20% opacity
            ]}
          >
            <Ionicons
              name={categoryConfig.icon as any}
              size={24}
              color={categoryConfig.color}
            />
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            {/* Nombre del documento */}
            <Text style={styles.nombre} numberOfLines={1}>
              {documento.nombre}
            </Text>

            {/* Row: tipo + tamaño */}
            <View style={styles.metadataRow}>
              {/* Badge tipo de archivo */}
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeBadge.backgroundColor },
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>
                  {typeBadge.label}
                </Text>
              </View>

              {/* Tamaño del archivo */}
              <Text style={styles.fileSize}>
                {formatFileSize(documento.tamano)}
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionsContainer}>
            {/* Botón download */}
            {onDownload && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                style={styles.actionButton}
              >
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={theme.colors.primaryLight}
                />
              </Pressable>
            )}

            {/* Botón delete */}
            {onDelete && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.actionButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#EF4444"
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Row inferior: fecha */}
        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatDate(documento.createdAt)}</Text>
        </View>
      </Pressable>
    </Card>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  pressable: {
    padding: theme.spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fileSize: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
