/**
 * CHECKLIST ITEM CARD
 *
 * Componente minimalista para mostrar un item de checklist con checkbox interactivo.
 */

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChecklistItem } from '@/types/checklist';
import { theme } from '@/config/theme';

interface ChecklistItemCardProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onDelete?: (id: string) => void;
}

export function ChecklistItemCard({
  item,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.texto);

  const handleEdit = () => {
    if (onEdit) {
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== item.texto && onEdit) {
      onEdit(item.id, editText.trim());
    } else {
      setEditText(item.texto);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(item.texto);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {/* Checkbox */}
      <Pressable onPress={() => onToggle(item.id)} style={styles.checkboxContainer}>
        <Ionicons
          name={item.completado ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.completado ? theme.colors.primary : '#D1D5DB'}
        />
      </Pressable>

      {/* Texto o Input de edición */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={editText}
            onChangeText={setEditText}
            onBlur={handleSaveEdit}
            onSubmitEditing={handleSaveEdit}
            autoFocus
            returnKeyType="done"
          />
        </View>
      ) : (
        <Pressable onPress={handleEdit} style={styles.textContainer}>
          <Text
            style={[
              styles.texto,
              item.completado && styles.textoCompletado,
            ]}
            numberOfLines={2}
          >
            {item.texto}
          </Text>
        </Pressable>
      )}

      {/* Botón eliminar */}
      {onDelete && !isEditing && (
        <Pressable
          onPress={() => onDelete(item.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  texto: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  textoCompletado: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
    opacity: 0.5,
  },
  editContainer: {
    flex: 1,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  deleteButtonPressed: {
    opacity: 0.5,
  },
});
