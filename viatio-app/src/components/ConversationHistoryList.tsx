/**
 * CONVERSATION HISTORY LIST
 *
 * Lista de conversaciones guardadas del asistente.
 * Permite ver, reanudar y borrar conversaciones.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { theme } from '@/config/theme';
import type { ConversacionGuardada } from '@/types/asistente';

// ============================================
// TIPOS
// ============================================

interface ConversationHistoryListProps {
  conversaciones: ConversacionGuardada[];
  onSelect: (conversacionId: string) => void;
  onDelete: (conversacionId: string) => void;
  loading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ConversationHistoryList({
  conversaciones,
  onSelect,
  onDelete,
  loading = false,
}: ConversationHistoryListProps) {
  const handleDelete = (conversacion: ConversacionGuardada) => {
    Alert.alert(
      'Eliminar conversación',
      `¿Seguro que quieres eliminar "${conversacion.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(conversacion.id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ConversacionGuardada }) => {
    const fecha = format(new Date(item.updatedAt), 'd MMM yyyy, HH:mm', { locale: es });

    return (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          pressed && styles.itemPressed,
        ]}
        onPress={() => onSelect(item.id)}
      >
        <View style={styles.itemContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="chatbubble-ellipses"
              size={24}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titulo} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text style={styles.fecha}>{fecha}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </Pressable>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Cargando historial...</Text>
      </View>
    );
  }

  if (conversaciones.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="chatbubbles-outline"
          size={64}
          color={theme.colors.textMuted}
        />
        <Text style={styles.emptyText}>No hay conversaciones guardadas</Text>
        <Text style={styles.emptyHint}>
          Las conversaciones se guardan automáticamente cuando chateas con el asistente
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversaciones}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  list: {
    padding: theme.spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
