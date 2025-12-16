/**
 * SWIPE ACTIONS COMPONENT
 *
 * Botones de acción que aparecen al deslizar una tarjeta.
 * Muestra iconos de Archivar y Borrar con colores del tema.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

interface SwipeActionsProps {
  onArchive?: () => void;
  onDelete: () => void;
  isArchived?: boolean;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({
  onArchive,
  onDelete,
  isArchived = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Botón de Archivar/Desarchivar */}
      {onArchive && (
        <Pressable
          onPress={onArchive}
          style={({ pressed }) => [
            styles.button,
            styles.archiveButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name={isArchived ? 'arrow-undo' : 'archive'}
            size={22}
            color={theme.colors.primary}
          />
          <Text style={styles.archiveText}>
            {isArchived ? 'Desarchivar' : 'Archivar'}
          </Text>
        </Pressable>
      )}

      {/* Botón de Borrar */}
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
  archiveButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  archiveText: {
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
