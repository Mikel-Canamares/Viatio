/**
 * ASSISTANTSCREEN
 *
 * Pantalla principal del chat con el asistente de viaje.
 * - Lista de mensajes invertida (nuevos abajo)
 * - Input de texto con botón enviar
 * - Sugerencias iniciales
 * - Indicador de typing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { ChatBubble } from '@/components/ChatBubble';
import { SuggestionChips } from '@/components/SuggestionChips';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Card } from '@/components/Card';
import { ConversationHistoryList } from '@/components/ConversationHistoryList';

import { useChatStore } from '@/store/chatStore';
import { getSugerenciasIniciales } from '@/services/ai/assistantPrompt';
import { theme } from '@/config/theme';

import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import type { MensajeChat, ContextoViaje } from '@/types/asistente';
import type { Reserva } from '@/types/reserva';
import type { Lugar } from '@/types/lugar';

// Para cargar contexto del viaje
import { getViajeById } from '@/services/viajesService';
import { getReservasByViajeId } from '@/services/reservasService';
import { getLugaresByViajeId } from '@/services/lugaresService';

// ============================================
// TIPOS
// ============================================

// Soporta tanto la navegación desde HomeStack como desde RootTab
type HomeStackProps = NativeStackScreenProps<HomeStackParamList, 'Assistant'>;
type TabProps = BottomTabScreenProps<RootTabParamList, 'Assistant'>;

// Union type que permite ambas formas de navegación
type Props = HomeStackProps | TabProps;

// ============================================
// COMPONENT
// ============================================

export default function AssistantScreen({ route, navigation }: Props) {
  // Extraer viajeId de manera segura, ya que puede o no existir
  const viajeId = (route.params as any)?.viajeId;
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<MensajeChat>>(null);

  // Estado local
  const [inputText, setInputText] = useState('');

  // Store
  const {
    mensajes,
    loading,
    error,
    contexto,
    historial,
    sendMessage,
    setContexto,
    clearChat,
    clearError,
    loadConversacion,
    deleteConversacion,
    renameConversacion,
    loadHistorial,
    startNewConversation,
  } = useChatStore();

  // Cargar contexto del viaje al montar
  useEffect(() => {
    if (viajeId) {
      loadContexto(viajeId);
    } else {
      // Sin viaje: limpiar contexto, chat y cargar historial
      setContexto(null);
      clearChat();
      loadHistorial();
    }

    // Limpiar al desmontar
    return () => {
      clearError();
    };
  }, [viajeId]);

  // Scroll al último mensaje cuando llega respuesta
  useEffect(() => {
    if (mensajes.length > 0 && !loading) {
      // Pequeño delay para que se renderice el mensaje
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mensajes.length, loading]);

  // ============================================
  // HANDLERS
  // ============================================

  const loadContexto = async (id: string) => {
    try {
      const viaje = await getViajeById(id);
      if (!viaje) return;

      const [reservas, lugares] = await Promise.all([
        getReservasByViajeId(id),
        getLugaresByViajeId(id),
      ]);

      const nuevoContexto: ContextoViaje = {
        viajeId: id,
        destino: viaje.destino,
        fechaInicio: viaje.fechaInicio,
        fechaFin: viaje.fechaFin,
        reservas: reservas.map((r: Reserva) => ({
          nombre: r.nombre,
          categoria: r.categoria,
          fecha: r.fechaInicio,
        })),
        lugares: lugares.map((l: Lugar) => ({
          nombre: l.nombre,
          categoria: l.categoria || 'other',
        })),
      };

      setContexto(nuevoContexto);
      clearChat(); // Nuevo viaje = nueva conversación
    } catch (error) {
      console.error('Error cargando contexto:', error);
    }
  };

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || loading) return;

    setInputText('');
    Keyboard.dismiss();
    sendMessage(text);
  }, [inputText, loading, sendMessage]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    if (loading) return;
    sendMessage(suggestion);
  }, [loading, sendMessage]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderMessage = useCallback(({ item }: { item: MensajeChat }) => (
    <ChatBubble mensaje={item} />
  ), []);

  const keyExtractor = useCallback((item: MensajeChat) => item.id, []);

  const showSuggestions = mensajes.length === 0 && !loading;
  const sugerencias = getSugerenciasIniciales(!!contexto);

  const canSend = inputText.trim().length > 0 && !loading;

  const handleLoadConversacion = useCallback((conversacionId: string) => {
    loadConversacion(conversacionId);
  }, [loadConversacion]);

  const handleDeleteConversacion = useCallback((conversacionId: string) => {
    deleteConversacion(conversacionId);
  }, [deleteConversacion]);

  const handleRenameConversacion = useCallback((conversacionId: string, nuevoTitulo: string) => {
    renameConversacion(conversacionId, nuevoTitulo);
  }, [renameConversacion]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
  }, [startNewConversation]);

  const handleBackToHistory = useCallback(() => {
    // Guardar conversación actual si tiene mensajes antes de volver al historial
    if (mensajes.length > 0) {
      useChatStore.getState().saveConversacion();
    }
    startNewConversation();
  }, [mensajes.length, startNewConversation]);

  // Mostrar historial solo si: no hay viajeId Y no hay mensajes activos
  const showHistorial = !viajeId && mensajes.length === 0;

  // ============================================
  // RENDER
  // ============================================

  // Header dinámico según el estado
  const headerTitle = contexto
    ? `Asistente - ${contexto.destino}`
    : showHistorial
      ? 'Conversaciones'
      : 'Asistente';

  // Botón de volver: si hay viajeId vuelve atrás, si hay chat activo vuelve al historial
  const handleHeaderBack = viajeId
    ? handleBack
    : (!showHistorial ? handleBackToHistory : undefined);

  return (
    <ScreenContainer scroll={false}>
      <PageHeader
        title={headerTitle}
        onBack={handleHeaderBack}
        rightElement={
          // Mostrar botón de nueva conversación si estamos en el chat (no en historial)
          !showHistorial && !viajeId ? (
            <Pressable
              onPress={handleNewConversation}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          ) : undefined
        }
      />

      {showHistorial ? (
        // Vista de historial de conversaciones
        <View style={styles.historialContainer}>
          <ConversationHistoryList
            conversaciones={historial}
            onSelect={handleLoadConversacion}
            onDelete={handleDeleteConversacion}
            onRename={handleRenameConversacion}
            onNewConversation={handleNewConversation}
            loading={loading}
          />
        </View>
      ) : (
        // Vista de chat
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Lista de mensajes */}
          <FlatList
            ref={flatListRef}
            data={mensajes}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={styles.messageList}
            contentContainerStyle={[
              styles.messageListContent,
              mensajes.length === 0 && styles.messageListEmpty,
            ]}
            ListHeaderComponent={
              showSuggestions ? (
                <View style={styles.suggestionsContainer}>
                  <SuggestionChips
                    suggestions={sugerencias}
                    onSelect={handleSuggestionSelect}
                    disabled={loading}
                  />
                </View>
              ) : null
            }
            ListFooterComponent={loading ? <TypingIndicator /> : null}
            onContentSizeChange={() => {
              if (mensajes.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />

          {/* Input area */}
          <View style={[styles.inputArea, { paddingBottom: insets.bottom || theme.spacing.md }]}>
            <Card style={styles.inputCard}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Escribe tu mensaje..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  maxLength={1000}
                  returnKeyType="default"
                  blurOnSubmit={false}
                  editable={!loading}
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!canSend}
                  style={({ pressed }) => [
                    styles.sendButton,
                    canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                    pressed && canSend && styles.sendButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={canSend ? '#FFFFFF' : theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            </Card>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerButton: {
    padding: theme.spacing.xs,
  },

  historialContainer: {
    flex: 1,
  },

  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: theme.spacing.md,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  suggestionsContainer: {
    paddingTop: theme.spacing.xl,
  },

  inputArea: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  inputCard: {
    padding: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    maxHeight: 100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendButtonPressed: {
    backgroundColor: theme.colors.primary,
  },
});
