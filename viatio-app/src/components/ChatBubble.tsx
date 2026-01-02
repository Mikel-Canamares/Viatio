/**
 * CHATBUBBLE COMPONENT
 *
 * Burbuja de mensaje para el chat del asistente.
 * Diferencia visualmente mensajes del usuario y del asistente.
 * Soporta acciones ejecutables del Copilot.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { ActionButtonsContainer } from './ActionButton';
import type { MensajeChat, MensajeChatConAcciones, AgentAction } from '@/types/asistente';

// ============================================
// PROPS
// ============================================

interface ChatBubbleProps {
  mensaje: MensajeChat | MensajeChatConAcciones;
  onActionPress?: (action: AgentAction) => Promise<void>;
}

// ============================================
// COMPONENT
// ============================================

export function ChatBubble({ mensaje, onActionPress }: ChatBubbleProps) {
  const isUser = mensaje.role === 'user';
  const actions = 'actions' in mensaje ? mensaje.actions : undefined;
  const hasActions = actions && actions.length > 0 && !isUser;

  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAssistant]}>
          {mensaje.content}
        </Text>

        {/* Botones de acción (solo para mensajes del asistente) */}
        {hasActions && onActionPress && (
          <ActionButtonsContainer
            actions={actions!}
            onActionPress={onActionPress}
          />
        )}
      </View>
      <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
        {formatTime(mensaje.timestamp)}
      </Text>
    </View>
  );
}

// ============================================
// HELPERS
// ============================================

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    maxWidth: '100%',
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  containerAssistant: {
    alignItems: 'flex-start',
  },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primaryLight,
    borderBottomRightRadius: theme.spacing.xs,
  },
  bubbleAssistant: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: theme.spacing.xs,
  },

  content: {
    ...theme.typography.body,
    lineHeight: 20,
  },
  contentUser: {
    color: '#FFFFFF',
  },
  contentAssistant: {
    color: theme.colors.text,
  },

  timestamp: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  timestampUser: {
    color: theme.colors.textMuted,
  },
  timestampAssistant: {
    color: theme.colors.textMuted,
  },
});
