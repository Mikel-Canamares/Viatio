/**
 * CONVERSATION HISTORY LIST
 *
 * Lista de conversaciones guardadas del asistente con estilo ChatGPT.
 * Features:
 * - Agrupación por fecha (Hoy, Ayer, Esta semana, etc.)
 * - Búsqueda de conversaciones
 * - Renombrar conversaciones
 * - Eliminar con confirmación
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
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
  onRename?: (conversacionId: string, nuevoTitulo: string) => void;
  onNewConversation?: () => void;
  loading?: boolean;
}

interface GroupedConversation {
  id: string;
  type: 'header' | 'item';
  title?: string;
  conversacion?: ConversacionGuardada;
}

// ============================================
// HELPERS
// ============================================

function getDateGroup(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'Esta semana';
  if (isThisMonth(date)) return 'Este mes';

  return format(date, 'MMMM yyyy', { locale: es });
}

function groupConversaciones(conversaciones: ConversacionGuardada[]): GroupedConversation[] {
  const grouped: GroupedConversation[] = [];
  let currentGroup = '';

  for (const conv of conversaciones) {
    const group = getDateGroup(conv.updatedAt);

    if (group !== currentGroup) {
      grouped.push({
        id: `header-${group}`,
        type: 'header',
        title: group,
      });
      currentGroup = group;
    }

    grouped.push({
      id: conv.id,
      type: 'item',
      conversacion: conv,
    });
  }

  return grouped;
}

// ============================================
// COMPONENT
// ============================================

export function ConversationHistoryList({
  conversaciones,
  onSelect,
  onDelete,
  onRename,
  onNewConversation,
  loading = false,
}: ConversationHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [conversacionToRename, setConversacionToRename] = useState<ConversacionGuardada | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Filtrar y agrupar conversaciones
  const groupedData = useMemo(() => {
    let filtered = conversaciones;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = conversaciones.filter(c =>
        c.titulo.toLowerCase().includes(query)
      );
    }

    return groupConversaciones(filtered);
  }, [conversaciones, searchQuery]);

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

  const handleRenamePress = (conversacion: ConversacionGuardada) => {
    setConversacionToRename(conversacion);
    setNewTitle(conversacion.titulo);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = () => {
    if (conversacionToRename && newTitle.trim() && onRename) {
      onRename(conversacionToRename.id, newTitle.trim());
    }
    setRenameModalVisible(false);
    setConversacionToRename(null);
    setNewTitle('');
  };

  const handleLongPress = (conversacion: ConversacionGuardada) => {
    Alert.alert(
      conversacion.titulo,
      undefined,
      [
        {
          text: 'Renombrar',
          onPress: () => handleRenamePress(conversacion),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(conversacion.id),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }: { item: GroupedConversation }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{item.title}</Text>
        </View>
      );
    }

    const conversacion = item.conversacion!;
    const fecha = format(new Date(conversacion.updatedAt), 'd MMM, HH:mm', { locale: es });

    return (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          pressed && styles.itemPressed,
        ]}
        onPress={() => onSelect(conversacion.id)}
        onLongPress={() => handleLongPress(conversacion)}
      >
        <View style={styles.itemContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="chatbubble-ellipses"
              size={20}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titulo} numberOfLines={1}>
              {conversacion.titulo}
            </Text>
            <Text style={styles.fecha}>{fecha}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {onRename && (
            <Pressable
              onPress={() => handleRenamePress(conversacion)}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
          <Pressable
            onPress={() => handleDelete(conversacion)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </Pressable>
        </View>
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

  return (
    <View style={styles.container}>
      {/* Botón Nueva conversación */}
      {onNewConversation && (
        <Pressable
          style={({ pressed }) => [
            styles.newConversationButton,
            pressed && styles.newConversationButtonPressed,
          ]}
          onPress={onNewConversation}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.newConversationText}>Nueva conversación</Text>
        </Pressable>
      )}

      {/* Barra de búsqueda */}
      {conversaciones.length > 3 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar conversaciones..."
            placeholderTextColor={theme.colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Lista de conversaciones */}
      {conversaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubbles-outline"
            size={64}
            color={theme.colors.textMuted}
          />
          <Text style={styles.emptyText}>No hay conversaciones guardadas</Text>
          <Text style={styles.emptyHint}>
            Inicia una nueva conversación con el asistente de viaje
          </Text>
        </View>
      ) : groupedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Sin resultados</Text>
          <Text style={styles.emptyHint}>
            No se encontraron conversaciones con "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de renombrar */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRenameModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Renombrar conversación</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Título de la conversación"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButtonConfirm,
                  !newTitle.trim() && styles.modalButtonDisabled,
                ]}
                onPress={handleRenameConfirm}
                disabled={!newTitle.trim()}
              >
                <Text style={styles.modalButtonConfirmText}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  // Nueva conversación
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
  },
  newConversationButtonPressed: {
    backgroundColor: theme.colors.primary + '20',
  },
  newConversationText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Búsqueda
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },

  // Headers de grupo
  headerContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },

  // Items
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  itemPressed: {
    backgroundColor: theme.colors.border,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  fecha: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },

  // Empty state
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.elevated,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
