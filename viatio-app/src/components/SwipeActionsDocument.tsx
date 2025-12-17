/**
 * SWIPE ACTIONS DOCUMENT COMPONENT
 *
 * Botones de acción que aparecen al deslizar una tarjeta de documento.
 * Muestra iconos de Editar y Borrar con colores del tema.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

interface SwipeActionsDocumentProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SwipeActionsDocument: React.FC<SwipeActionsDocumentProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      {/* Botón de Editar */}
      {onEdit && (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.button,
            styles.editButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={theme.colors.primary}
          />
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
      )}

      {/* Botón de Borrar */}
      {onDelete && (
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.button,
            styles.deleteButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="trash" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Borrar</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    minWidth: 80,
    height: '90%',
    gap: theme.spacing.xs,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  editButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  editText: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteText: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
