/**
 * AssistantBottomSheet
 *
 * Modal bottom sheet que muestra el chat del asistente.
 * Puede abrirse desde cualquier pantalla mediante SmartFAB.
 *
 * Features:
 * - Modal que cubre 90% de la pantalla
 * - Header con destino del viaje
 * - Chips de acciones rápidas contextuales
 * - Chat con mensajes
 * - Input con botón enviar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import { SuggestionChips } from '@/components/SuggestionChips';
import { TypingIndicator } from '@/components/TypingIndicator';

import { useChatStore } from '@/store/chatStore';
import { getSugerenciasIniciales } from '@/services/ai/assistantPrompt';
import { theme } from '@/config/theme';

import type { MensajeChat, ContextoViaje } from '@/types/asistente';

// ============================================
// TIPOS
// ============================================

interface AssistantBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  viajeId?: string;
  destino?: string;
}

// ============================================
// COMPONENT
// ============================================

export function AssistantBottomSheet({
  visible,
  onClose,
  viajeId,
  destino,
}: AssistantBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<MensajeChat>>(null);
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const previousViajeIdRef = useRef<string | undefined>(viajeId);

  // Estado local
  const [inputText, setInputText] = useState('');

  // Store
  const {
    mensajes,
    loading,
    error,
    contexto,
    sendMessage,
    clearError,
    clearChat,
  } = useChatStore();

  // Limpiar chat cuando cambia el viajeId (cambio de módulo/viaje)
  useEffect(() => {
    if (viajeId !== previousViajeIdRef.current) {
      console.log('[AssistantBottomSheet] Cambio de contexto detectado, limpiando chat');
      clearChat();
      previousViajeIdRef.current = viajeId;
    }
  }, [viajeId, clearChat]);

  // Animación de entrada/salida
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajes.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mensajes.length, loading]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const message = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await sendMessage(message);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Sugerencias contextuales según pantalla
  const getContextualSuggestions = () => {
    if (!viajeId) {
      return getSugerenciasIniciales(false);
    }

    return getSugerenciasIniciales(true);
  };

  const suggestions = getContextualSuggestions();

  // ============================================
  // RENDER
  // ============================================

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
              <View style={styles.headerContent}>
                <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
                <Text style={styles.headerTitle}>
                  Asistente {destino ? `· ${destino}` : ''}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Chips de acciones rápidas */}
            {mensajes.length === 0 && (
              <View style={styles.chipsContainer}>
                <SuggestionChips
                  suggestions={suggestions.slice(0, 3)}
                  onSelect={handleSuggestionPress}
                />
              </View>
            )}

            {/* Mensajes */}
            <FlatList
              ref={flatListRef}
              data={mensajes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              renderItem={({ item }) => (
                <ChatBubble mensaje={item} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={64}
                    color={theme.colors.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    {viajeId
                      ? `¡Hola! Soy tu asistente de viaje para ${destino || 'tu destino'}.\n¿En qué puedo ayudarte?`
                      : '¡Hola! Pregúntame lo que necesites sobre tus viajes.'}
                  </Text>
                </View>
              }
            />

            {/* Indicador de typing */}
            {loading && (
              <View style={styles.typingContainer}>
                <TypingIndicator />
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={clearError}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </Pressable>
              </View>
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 16 }]}>
              <TextInput
                style={styles.input}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor={theme.colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={handleSend}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || loading) && styles.sendButtonDisabled,
                ]}
                disabled={!inputText.trim() || loading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !loading ? '#FFFFFF' : theme.colors.textMuted}
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  messagesList: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.error + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: theme.radius.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
});
