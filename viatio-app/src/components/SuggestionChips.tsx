/**
 * SUGGESTIONCHIPS COMPONENT
 *
 * Chips horizontales con sugerencias de mensajes.
 * Permite iniciar conversación con un toque.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

// ============================================
// PROPS
// ============================================

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SuggestionChips({
  suggestions,
  onSelect,
  disabled = false
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={index}
          onPress={() => !disabled && onSelect(suggestion)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            pressed && !disabled && styles.chipPressed,
            disabled && styles.chipDisabled,
          ]}
        >
          <Text style={[
            styles.chipText,
            disabled && styles.chipTextDisabled,
          ]}>
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },

  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
  },
  chipPressed: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },

  chipText: {
    ...theme.typography.body,
    color: theme.colors.primaryLight,
  },
  chipTextDisabled: {
    color: theme.colors.textMuted,
  },
});
