/**
 * ACTION BUTTON
 *
 * Botón para ejecutar acciones propuestas por el Copilot.
 * Muestra el label, icono y estado de carga/éxito/error.
 */

import { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import type { AgentAction } from '@/types/asistente';

interface ActionButtonProps {
  action: AgentAction;
  onPress: (action: AgentAction) => Promise<void>;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export function ActionButton({
  action,
  onPress,
  disabled = false,
  size = 'medium',
}: ActionButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');

  const handlePress = async () => {
    if (state === 'loading' || disabled) return;

    setState('loading');
    try {
      await onPress(action);
      setState('success');
      // Resetear después de mostrar éxito
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('error');
      // Resetear después de mostrar error
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (state === 'success') return 'checkmark-circle';
    if (state === 'error') return 'close-circle';
    if (action.icon) return action.icon as keyof typeof Ionicons.glyphMap;

    // Iconos por defecto según tipo de acción
    switch (action.type) {
      case 'create_agenda_item':
        return 'calendar-outline';
      case 'search_places':
        return 'search-outline';
      case 'add_place_to_saved':
        return 'bookmark-outline';
      case 'show_on_map':
        return 'map-outline';
      case 'get_directions':
        return 'navigate-outline';
      case 'navigate_to':
        return 'arrow-forward-outline';
      case 'suggest_itinerary':
        return 'list-outline';
      default:
        return 'flash-outline';
    }
  };

  const getBackgroundColor = () => {
    if (state === 'success') return theme.colors.success;
    if (state === 'error') return theme.colors.error;
    if (disabled) return theme.colors.border;
    return theme.colors.primary;
  };

  const isSmall = size === 'small';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || state === 'loading'}
      style={({ pressed }) => [
        styles.button,
        isSmall && styles.buttonSmall,
        { backgroundColor: getBackgroundColor() },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {state === 'loading' ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons
            name={getIcon()}
            size={isSmall ? 14 : 16}
            color="#FFFFFF"
            style={styles.icon}
          />
          <Text
            style={[styles.label, isSmall && styles.labelSmall]}
            numberOfLines={1}
          >
            {state === 'success' ? 'Hecho' : state === 'error' ? 'Error' : action.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Contenedor para múltiples ActionButtons
 */
interface ActionButtonsContainerProps {
  actions: AgentAction[];
  onActionPress: (action: AgentAction) => Promise<void>;
  maxVisible?: number;
}

export function ActionButtonsContainer({
  actions,
  onActionPress,
  maxVisible = 3,
}: ActionButtonsContainerProps) {
  if (!actions || actions.length === 0) return null;

  const visibleActions = actions.slice(0, maxVisible);

  return (
    <View style={styles.container}>
      {visibleActions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          onPress={onActionPress}
          size={actions.length > 2 ? 'small' : 'medium'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    minHeight: 36,
  },
  buttonSmall: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 28,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 12,
  },
});
