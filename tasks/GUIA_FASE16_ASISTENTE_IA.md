# 🤖 FASE 16: ASISTENTE IA - GUÍA DE IMPLEMENTACIÓN

> **Contexto**: Esta guía integra un asistente de viaje inteligente usando Gemini AI. El backend ya tiene el endpoint `/api/assistant` implementado, esta guía cubre la implementación completa del frontend.

## 📋 ÍNDICE

1. [Prerrequisitos](#prerrequisitos)
2. [Tipos del Asistente](#161-tipos-del-asistente)
3. [Prompt del Sistema](#162-prompt-del-sistema)
4. [Servicio del Asistente](#163-servicio-del-asistente)
5. [Store del Chat](#164-store-del-chat-zustand)
6. [Componentes UI](#165-componentes-ui)
7. [Pantalla del Asistente](#166-pantalla-del-asistente)
8. [Integración en Navegación](#167-integración-en-navegación)
9. [Mejoras del Backend](#168-mejoras-del-backend-opcional)
10. [Testing y Verificación](#169-testing-y-verificación)

---

## PRERREQUISITOS

### Estado actual del proyecto

**Backend (ya implementado):**
- ✅ Endpoint `POST /api/assistant` en `viatio-backend/src/routes/assistant.ts`
- ✅ Servicio `geminiService.chatAssistant()` en `viatio-backend/src/services/geminiService.ts`
- ✅ Tipos `AssistantRequest` y `AssistantResponse` en `viatio-backend/src/types/index.ts`

**Frontend (pendiente):**
- ⏳ Tipos del asistente
- ⏳ Servicio cliente para conectar con backend
- ⏳ Store Zustand para estado del chat
- ⏳ Componentes UI (burbujas, chips)
- ⏳ Pantalla del asistente
- ⏳ Integración en navegación

### Variables de entorno necesarias

```env
# viatio-app/.env
EXPO_PUBLIC_BACKEND_URL=https://viatio-backend-production.up.railway.app
# O para desarrollo local:
# EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:3000
```

---

## 16.1 TIPOS DEL ASISTENTE

### Prompt 16.1.1: Crear tipos del asistente

Crea el archivo `src/types/asistente.ts`:

```typescript
/**
 * TIPOS DEL ASISTENTE IA
 *
 * Define las interfaces para el chat con el asistente de viaje.
 * Sincronizado con el backend (viatio-backend/src/types/index.ts)
 */

// ============================================
// MENSAJES DE CHAT
// ============================================

/**
 * Mensaje individual en la conversación
 */
export interface MensajeChat {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Formato para enviar al backend (Gemini usa 'model' en lugar de 'assistant')
 */
export interface MensajeChatAPI {
  role: 'user' | 'model';
  content: string;
}

// ============================================
// CONTEXTO DEL VIAJE
// ============================================

/**
 * Información del viaje para contextualizar respuestas
 */
export interface ContextoViaje {
  viajeId: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  reservas: Array<{
    nombre: string;
    categoria: string;
    fecha?: string;
  }>;
  lugares: Array<{
    nombre: string;
    categoria: string;
  }>;
  gastoActual: number;
  presupuesto?: number;
}

/**
 * Contexto simplificado para enviar al backend
 */
export interface ContextoViajeAPI {
  tripId?: string;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
}

// ============================================
// CONVERSACIÓN
// ============================================

/**
 * Conversación completa con el asistente
 */
export interface ConversacionAsistente {
  id: string;
  mensajes: MensajeChat[];
  contexto?: ContextoViaje;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ACCIONES SUGERIDAS (FUTURO)
// ============================================

/**
 * Acciones que el asistente puede sugerir al usuario
 * (Para implementación futura de acciones rápidas)
 */
export type TipoAccion =
  | 'crear_viaje'
  | 'buscar_reserva'
  | 'ver_agenda'
  | 'abrir_mapa'
  | 'añadir_gasto'
  | 'ver_documentos';

export interface AccionSugerida {
  tipo: TipoAccion;
  label: string;
  params?: Record<string, unknown>;
}

// ============================================
// REQUEST/RESPONSE API
// ============================================

/**
 * Request para el endpoint /api/assistant
 */
export interface AssistantAPIRequest {
  message: string;
  context?: ContextoViajeAPI;
  conversationHistory?: MensajeChatAPI[];
}

/**
 * Response del endpoint /api/assistant
 */
export interface AssistantAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

**Actualiza `src/types/index.ts` para exportar los nuevos tipos:**

```typescript
// ... exports existentes ...
export * from './asistente';
```

### ✓ Verificación 16.1

```bash
cd viatio-app
npx tsc --noEmit
# No debe mostrar errores relacionados con asistente.ts
```

---

## 16.2 PROMPT DEL SISTEMA

### Prompt 16.2.1: Crear prompt del sistema para el asistente

Crea el archivo `src/services/ai/assistantPrompt.ts`:

```typescript
/**
 * PROMPTS DEL ASISTENTE IA
 *
 * Configura el comportamiento y personalidad del asistente de viaje.
 * El prompt del sistema se envía en cada conversación para mantener contexto.
 */

import type { ContextoViaje } from '@/types/asistente';

// ============================================
// CONFIGURACIÓN DEL MODELO
// ============================================

export const ASSISTANT_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  maxTokens: 1000,
  temperature: 0.7,
} as const;

// ============================================
// PROMPT BASE DEL SISTEMA
// ============================================

const SYSTEM_PROMPT_BASE = `Eres el asistente de viajes de Viatio, una aplicación móvil para organizar viajes.

PERSONALIDAD:
- Amigable y cercano, como un amigo viajero experimentado
- Conciso pero informativo (respuestas de 2-4 párrafos máximo)
- Proactivo con sugerencias útiles
- Usa emojis con moderación (1-2 por mensaje, solo si aportan)

CAPACIDADES:
- Responder preguntas sobre el viaje del usuario
- Sugerir actividades, restaurantes y lugares según destino
- Ayudar a organizar itinerarios diarios
- Dar consejos prácticos de viaje (clima, transporte, cultura)
- Orientar sobre presupuesto y gastos
- Informar sobre documentos necesarios

LIMITACIONES (sé honesto sobre ellas):
- No puedes hacer reservas reales ni pagos
- Tu información puede no estar actualizada al momento
- No tienes acceso a precios en tiempo real
- No compartas datos personales del usuario

FORMATO DE RESPUESTA:
- Usa párrafos cortos para facilitar lectura en móvil
- Listas con viñetas para recomendaciones múltiples
- Destaca información importante con **negritas**
- Si no sabes algo, admítelo y sugiere dónde buscar`;

// ============================================
// BUILDER DEL PROMPT CON CONTEXTO
// ============================================

/**
 * Construye el prompt del sistema incluyendo contexto del viaje actual
 */
export function buildSystemPrompt(contexto?: ContextoViaje): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (contexto) {
    prompt += `

---
CONTEXTO DEL VIAJE ACTUAL:
- **Destino**: ${contexto.destino}
- **Fechas**: ${formatearFechas(contexto.fechaInicio, contexto.fechaFin)}
- **Duración**: ${calcularDuracion(contexto.fechaInicio, contexto.fechaFin)} días`;

    if (contexto.reservas.length > 0) {
      prompt += `
- **Reservas** (${contexto.reservas.length}): ${contexto.reservas.map(r => r.nombre).join(', ')}`;
    }

    if (contexto.lugares.length > 0) {
      prompt += `
- **Lugares por visitar** (${contexto.lugares.length}): ${contexto.lugares.map(l => l.nombre).join(', ')}`;
    }

    if (contexto.presupuesto) {
      const porcentaje = Math.round((contexto.gastoActual / contexto.presupuesto) * 100);
      prompt += `
- **Presupuesto**: ${contexto.gastoActual}€ gastados de ${contexto.presupuesto}€ (${porcentaje}%)`;
    } else if (contexto.gastoActual > 0) {
      prompt += `
- **Gasto actual**: ${contexto.gastoActual}€`;
    }

    prompt += `

Usa este contexto para personalizar tus respuestas al viaje específico del usuario.`;
  }

  return prompt;
}

// ============================================
// SUGERENCIAS INICIALES
// ============================================

/**
 * Chips de sugerencias para iniciar conversación
 * Varían según si hay contexto de viaje o no
 */
export function getSugerenciasIniciales(tieneContexto: boolean): string[] {
  if (tieneContexto) {
    return [
      '¿Qué puedo visitar?',
      'Organiza mi día',
      '¿Cómo voy de presupuesto?',
      'Recomienda restaurantes',
    ];
  }

  return [
    '¿Cómo organizo un viaje?',
    'Destinos recomendados',
    '¿Qué documentos necesito?',
    'Consejos para viajar',
  ];
}

// ============================================
// HELPERS
// ============================================

function formatearFechas(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short'
  };
  const fechaInicio = new Date(inicio).toLocaleDateString('es-ES', opciones);
  const fechaFin = new Date(fin).toLocaleDateString('es-ES', opciones);
  return `${fechaInicio} - ${fechaFin}`;
}

function calcularDuracion(inicio: string, fin: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(fin).getTime() - new Date(inicio).getTime();
  return Math.ceil(diff / msPerDay) + 1;
}
```

### ✓ Verificación 16.2

```bash
npx tsc --noEmit
```

---

## 16.3 SERVICIO DEL ASISTENTE

### Prompt 16.3.1: Crear servicio cliente del asistente

Crea el archivo `src/services/ai/assistantService.ts`:

```typescript
/**
 * SERVICIO DEL ASISTENTE IA
 *
 * Conecta con el endpoint /api/assistant del backend.
 * Maneja timeouts, errores y transformación de datos.
 */

import { buildSystemPrompt } from './assistantPrompt';
import type {
  MensajeChat,
  MensajeChatAPI,
  ContextoViaje,
  ContextoViajeAPI,
  AssistantAPIRequest,
  AssistantAPIResponse,
} from '@/types/asistente';
import { generateId, getCurrentTimestamp } from '@/database';
import { logError } from '@/utils/errorHandler';

// ============================================
// CONFIGURACIÓN
// ============================================

const API_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 2;

// ============================================
// TIPOS INTERNOS
// ============================================

interface SendMessageResult {
  success: boolean;
  message?: MensajeChat;
  error?: string;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

/**
 * Envía un mensaje al asistente y devuelve la respuesta
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: MensajeChat[],
  contexto?: ContextoViaje
): Promise<SendMessageResult> {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      throw new Error('EXPO_PUBLIC_BACKEND_URL no configurado');
    }

    // Transformar historial al formato de la API (role: 'model' en lugar de 'assistant')
    const historyForAPI: MensajeChatAPI[] = conversationHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));

    // Transformar contexto al formato de la API
    const contextForAPI: ContextoViajeAPI | undefined = contexto ? {
      tripId: contexto.viajeId,
      tripName: contexto.destino,
      destination: contexto.destino,
      startDate: contexto.fechaInicio,
      endDate: contexto.fechaFin,
    } : undefined;

    // Preparar request
    const requestBody: AssistantAPIRequest = {
      message: userMessage,
      context: contextForAPI,
      conversationHistory: historyForAPI,
    };

    // Enviar con timeout y reintentos
    const response = await fetchWithRetry(
      `${backendUrl}/api/assistant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      MAX_RETRIES
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const result: AssistantAPIResponse = await response.json();

    if (!result.success || !result.message) {
      throw new Error(result.error || 'Respuesta vacía del asistente');
    }

    // Crear mensaje del asistente
    const assistantMessage: MensajeChat = {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: getCurrentTimestamp(),
    };

    return {
      success: true,
      message: assistantMessage,
    };

  } catch (error) {
    logError(error, 'assistantService.sendMessage');

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Crea un mensaje de usuario
 */
export function createUserMessage(content: string): MensajeChat {
  return {
    id: generateId(),
    role: 'user',
    content: content.trim(),
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Fetch con timeout y reintentos
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // No reintentar si fue abort manual o error de red permanente
      if (lastError.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
      }

      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Error de conexión');
}

/**
 * Traduce errores técnicos a mensajes amigables
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('tardó')) {
      return 'La respuesta está tardando mucho. Intenta de nuevo.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Sin conexión a internet. Verifica tu conexión.';
    }
    if (message.includes('500') || message.includes('servidor')) {
      return 'El servidor está ocupado. Intenta en unos segundos.';
    }

    return error.message;
  }

  return 'Error desconocido. Intenta de nuevo.';
}
```

Crea el archivo índice `src/services/ai/index.ts`:

```typescript
export * from './assistantPrompt';
export * from './assistantService';
```

### ✓ Verificación 16.3

```bash
npx tsc --noEmit
```

---

## 16.4 STORE DEL CHAT (ZUSTAND)

### Prompt 16.4.1: Crear store del chat

Crea el archivo `src/store/chatStore.ts`:

```typescript
/**
 * CHAT STORE - ZUSTAND
 *
 * Maneja el estado de la conversación con el asistente.
 * Patrón: State + Actions en un solo store.
 */

import { create } from 'zustand';
import type { MensajeChat, ContextoViaje } from '@/types/asistente';
import * as assistantService from '@/services/ai/assistantService';

// ============================================
// TIPOS DEL STORE
// ============================================

interface ChatState {
  // Estado
  mensajes: MensajeChat[];
  loading: boolean;
  error: string | null;
  contexto: ContextoViaje | null;
}

interface ChatActions {
  // Acciones
  setContexto: (contexto: ContextoViaje | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

// ============================================
// ESTADO INICIAL
// ============================================

const initialState: ChatState = {
  mensajes: [],
  loading: false,
  error: null,
  contexto: null,
};

// ============================================
// STORE
// ============================================

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  /**
   * Establece el contexto del viaje actual
   */
  setContexto: (contexto) => {
    set({ contexto });
  },

  /**
   * Envía un mensaje y recibe respuesta del asistente
   */
  sendMessage: async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Crear mensaje del usuario
    const userMessage = assistantService.createUserMessage(trimmedContent);

    // Añadir mensaje del usuario inmediatamente
    set((state) => ({
      mensajes: [...state.mensajes, userMessage],
      loading: true,
      error: null,
    }));

    // Obtener estado actual
    const { mensajes, contexto } = get();

    // Enviar al backend
    const response = await assistantService.sendMessage(
      trimmedContent,
      mensajes, // Incluye el mensaje del usuario recién añadido
      contexto || undefined
    );

    if (response.success && response.message) {
      // Añadir respuesta del asistente
      set((state) => ({
        mensajes: [...state.mensajes, response.message!],
        loading: false,
      }));
    } else {
      // Mostrar error
      set({
        loading: false,
        error: response.error || 'Error al enviar mensaje',
      });
    }
  },

  /**
   * Limpia la conversación
   */
  clearChat: () => {
    set({
      mensajes: [],
      error: null,
    });
  },

  /**
   * Limpia solo el error
   */
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================
// SELECTORES (para optimizar renders)
// ============================================

export const selectMensajes = (state: ChatStore) => state.mensajes;
export const selectLoading = (state: ChatStore) => state.loading;
export const selectError = (state: ChatStore) => state.error;
export const selectContexto = (state: ChatStore) => state.contexto;
export const selectTieneMensajes = (state: ChatStore) => state.mensajes.length > 0;
```

**Actualiza `src/store/index.ts` para exportar el nuevo store:**

```typescript
// ... exports existentes ...
export { useChatStore } from './chatStore';
```

### ✓ Verificación 16.4

```bash
npx tsc --noEmit
```

---

## 16.5 COMPONENTES UI

### Prompt 16.5.1: Crear componente ChatBubble

Crea el archivo `src/components/ChatBubble.tsx`:

```typescript
/**
 * CHATBUBBLE COMPONENT
 *
 * Burbuja de mensaje para el chat del asistente.
 * Diferencia visualmente mensajes del usuario y del asistente.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import type { MensajeChat } from '@/types/asistente';

// ============================================
// PROPS
// ============================================

interface ChatBubbleProps {
  mensaje: MensajeChat;
}

// ============================================
// COMPONENT
// ============================================

export function ChatBubble({ mensaje }: ChatBubbleProps) {
  const isUser = mensaje.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAssistant]}>
          {mensaje.content}
        </Text>
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
```

### Prompt 16.5.2: Crear componente SuggestionChips

Crea el archivo `src/components/SuggestionChips.tsx`:

```typescript
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
```

### Prompt 16.5.3: Crear componente TypingIndicator

Crea el archivo `src/components/TypingIndicator.tsx`:

```typescript
/**
 * TYPINGINDICATOR COMPONENT
 *
 * Indicador de "escribiendo..." mientras el asistente responde.
 * Tres puntos animados.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

// ============================================
// COMPONENT
// ============================================

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  const getDotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [{
      scale: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
      }),
    }],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
          <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
          <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
  },
  bubble: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
  },
});
```

**Actualiza `src/components/index.ts` para exportar los nuevos componentes:**

```typescript
// ... exports existentes ...
export { ChatBubble } from './ChatBubble';
export { SuggestionChips } from './SuggestionChips';
export { TypingIndicator } from './TypingIndicator';
```

### ✓ Verificación 16.5

```bash
npx tsc --noEmit
```

---

## 16.6 PANTALLA DEL ASISTENTE

### Prompt 16.6.1: Crear AssistantScreen

Crea el archivo `src/screens/AssistantScreen.tsx`:

```typescript
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

import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { ChatBubble } from '@/components/ChatBubble';
import { SuggestionChips } from '@/components/SuggestionChips';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Card } from '@/components/Card';

import { useChatStore } from '@/store/chatStore';
import { getSugerenciasIniciales } from '@/services/ai/assistantPrompt';
import { theme } from '@/config/theme';

import type { HomeStackParamList } from '@/navigation/types';
import type { MensajeChat, ContextoViaje } from '@/types/asistente';

// Para cargar contexto del viaje
import { getViajeById } from '@/services/viajesService';
import { getReservasByViaje } from '@/services/reservasService';
import { getLugaresByViaje } from '@/services/lugaresService';
import { getGastosByViaje } from '@/services/gastosService';

// ============================================
// TIPOS
// ============================================

type Props = NativeStackScreenProps<HomeStackParamList, 'Assistant'>;

// ============================================
// COMPONENT
// ============================================

export default function AssistantScreen({ route, navigation }: Props) {
  const { viajeId } = route.params || {};
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
    sendMessage,
    setContexto,
    clearChat,
    clearError,
  } = useChatStore();

  // Cargar contexto del viaje al montar
  useEffect(() => {
    if (viajeId) {
      loadContexto(viajeId);
    } else {
      // Sin viaje: limpiar contexto y chat
      setContexto(null);
      clearChat();
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

      const [reservas, lugares, gastos] = await Promise.all([
        getReservasByViaje(id),
        getLugaresByViaje(id),
        getGastosByViaje(id),
      ]);

      const gastoTotal = gastos.reduce((sum, g) => sum + g.cantidad, 0);

      const nuevoContexto: ContextoViaje = {
        viajeId: id,
        destino: viaje.destino,
        fechaInicio: viaje.fechaInicio,
        fechaFin: viaje.fechaFin,
        reservas: reservas.map(r => ({
          nombre: r.nombre,
          categoria: r.categoria,
          fecha: r.fechaInicio,
        })),
        lugares: lugares.map(l => ({
          nombre: l.nombre,
          categoria: l.categoria || 'other',
        })),
        gastoActual: gastoTotal,
        presupuesto: viaje.presupuesto || undefined,
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScreenContainer scroll={false}>
      <PageHeader
        title={contexto ? `Asistente - ${contexto.destino}` : 'Asistente'}
        onBack={viajeId ? handleBack : undefined}
      />

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
```

### ✓ Verificación 16.6

```bash
npx tsc --noEmit
```

---

## 16.7 INTEGRACIÓN EN NAVEGACIÓN

### Prompt 16.7.1: Añadir ruta Assistant al HomeStackNavigator

**Actualiza `src/navigation/types.ts`:**

Añade la ruta Assistant a `HomeStackParamList`:

```typescript
export type HomeStackParamList = {
  // ... rutas existentes ...
  Assistant: { viajeId?: string } | undefined;
};
```

**Actualiza `src/navigation/HomeStackNavigator.tsx`:**

Añade el import y el Screen:

```typescript
// Añadir al inicio con otros imports de screens
import AssistantScreen from '@/screens/AssistantScreen';

// Añadir dentro del Stack.Navigator, después de las otras rutas
<Stack.Screen
  name="Assistant"
  component={AssistantScreen}
  options={{
    headerShown: false,
  }}
/>
```

### Prompt 16.7.2: Añadir acceso al Asistente desde TripDetailScreen

**Actualiza `src/screens/TripDetailScreen.tsx`:**

Añade una nueva sección en el menú de opciones del viaje:

```typescript
// En el array de secciones/opciones del viaje, añadir:
{
  icon: 'chatbubble-ellipses-outline',
  title: 'Asistente IA',
  description: 'Pregunta lo que necesites',
  onPress: () => navigation.navigate('Assistant', { viajeId }),
}
```

O si prefieres un FAB (Floating Action Button) para acceso rápido:

```typescript
// Añadir al final del componente, antes del cierre de ScreenContainer
<Pressable
  style={styles.fab}
  onPress={() => navigation.navigate('Assistant', { viajeId })}
>
  <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
</Pressable>

// Añadir en styles:
fab: {
  position: 'absolute',
  right: theme.spacing.lg,
  bottom: theme.spacing.xl,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: theme.colors.primaryLight,
  justifyContent: 'center',
  alignItems: 'center',
  ...theme.shadows.fab,
},
```

### Prompt 16.7.3: (Opcional) Añadir Asistente como Tab global

Si quieres que el asistente sea accesible desde cualquier parte de la app:

**Actualiza `src/navigation/RootTabs.tsx`:**

```typescript
// Añadir import
import AssistantScreen from '@/screens/AssistantScreen';

// Añadir tab (antes o después de Profile)
<Tab.Screen
  name="Assistant"
  component={AssistantScreen}
  options={{
    tabBarLabel: 'Asistente',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
    ),
  }}
/>
```

**Actualiza `src/navigation/types.ts`:**

```typescript
export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Assistant: undefined; // Añadir esta línea
  Profile: undefined;
};
```

### ✓ Verificación 16.7

```bash
npx tsc --noEmit
npm run start
# Probar: Viaje → Asistente → Enviar mensaje → Ver respuesta
```

---

## 16.8 MEJORAS DEL BACKEND (OPCIONAL)

El backend ya está funcional, pero aquí hay mejoras opcionales:

### Prompt 16.8.1: Mejorar el prompt del sistema en el backend

**Actualiza `viatio-backend/src/services/geminiService.ts`:**

Reemplaza `ASSISTANT_PROMPT` con una versión más completa:

```typescript
const ASSISTANT_PROMPT = `Eres el asistente de viajes de Viatio, una app móvil para organizar viajes.

PERSONALIDAD:
- Amigable y cercano, como un amigo viajero experimentado
- Conciso pero informativo (respuestas de 2-4 párrafos máximo)
- Proactivo con sugerencias útiles
- Usa emojis con moderación (1-2 por mensaje, solo si aportan)

CAPACIDADES:
- Responder preguntas sobre el viaje del usuario
- Sugerir actividades, restaurantes y lugares según destino
- Ayudar a organizar itinerarios diarios
- Dar consejos prácticos de viaje (clima, transporte, cultura local)
- Orientar sobre presupuesto y gastos
- Informar sobre documentos necesarios para viajar

LIMITACIONES (sé honesto sobre ellas):
- No puedes hacer reservas reales ni pagos
- Tu información puede no estar 100% actualizada
- No tienes acceso a precios en tiempo real
- No compartas ni solicites datos personales sensibles

FORMATO:
- Respuestas breves y directas
- Usa listas cuando haya múltiples opciones
- Destaca información clave con **negritas**
- Si no sabes algo, admítelo y sugiere dónde buscar`;
```

### Prompt 16.8.2: Añadir más contexto al viaje

**Actualiza `viatio-backend/src/types/index.ts`:**

Expande la interfaz de contexto:

```typescript
export interface AssistantRequest {
  message: string;
  context?: {
    tripId?: string;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    destination?: string;
    // Nuevos campos opcionales
    reservations?: Array<{
      name: string;
      category: string;
      date?: string;
    }>;
    places?: Array<{
      name: string;
      category: string;
    }>;
    currentExpense?: number;
    budget?: number;
  };
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}
```

### ✓ Verificación 16.8

```bash
cd viatio-backend
npx tsc --noEmit
npm run dev
# Probar endpoint: POST /api/assistant
```

---

## 16.9 TESTING Y VERIFICACIÓN

### Checklist Final

**Frontend (viatio-app):**
- [ ] `src/types/asistente.ts` creado y exportado
- [ ] `src/services/ai/assistantPrompt.ts` creado
- [ ] `src/services/ai/assistantService.ts` creado
- [ ] `src/store/chatStore.ts` creado y exportado
- [ ] `src/components/ChatBubble.tsx` creado
- [ ] `src/components/SuggestionChips.tsx` creado
- [ ] `src/components/TypingIndicator.tsx` creado
- [ ] `src/screens/AssistantScreen.tsx` creado
- [ ] Ruta `Assistant` añadida a `HomeStackParamList`
- [ ] Screen añadido a `HomeStackNavigator`
- [ ] Acceso desde `TripDetailScreen`
- [ ] Sin errores de TypeScript

**Backend (viatio-backend):**
- [ ] Endpoint `/api/assistant` funcional
- [ ] Prompt del sistema mejorado
- [ ] Rate limiting aplicado
- [ ] Sin errores de TypeScript

### Comandos de verificación

```bash
# Frontend
cd viatio-app
npx tsc --noEmit
npm run start

# Backend
cd viatio-backend
npx tsc --noEmit
npm run dev
```

### Flujo de prueba

1. **Sin viaje:**
   - Abrir app → Tab Asistente (si está como tab)
   - Ver sugerencias genéricas
   - Enviar mensaje "Hola"
   - Ver respuesta del asistente

2. **Con viaje:**
   - Crear/seleccionar viaje
   - Ir a detalle del viaje → Asistente
   - Ver sugerencias contextualizadas
   - Preguntar "¿Qué puedo visitar?"
   - Ver respuesta con contexto del destino

3. **Manejo de errores:**
   - Desconectar internet
   - Enviar mensaje
   - Ver mensaje de error amigable
   - Reconectar y reintentar

---

## 📝 REVIEW

### Resumen de cambios

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/types/asistente.ts` | Nuevo | Tipos del chat y contexto |
| `src/services/ai/assistantPrompt.ts` | Nuevo | Prompt del sistema |
| `src/services/ai/assistantService.ts` | Nuevo | Servicio cliente API |
| `src/store/chatStore.ts` | Nuevo | Estado Zustand del chat |
| `src/components/ChatBubble.tsx` | Nuevo | Burbuja de mensaje |
| `src/components/SuggestionChips.tsx` | Nuevo | Chips de sugerencias |
| `src/components/TypingIndicator.tsx` | Nuevo | Indicador de typing |
| `src/screens/AssistantScreen.tsx` | Nuevo | Pantalla principal |
| `src/navigation/types.ts` | Modificado | Añadida ruta Assistant |
| `src/navigation/HomeStackNavigator.tsx` | Modificado | Añadido Screen |
| `src/screens/TripDetailScreen.tsx` | Modificado | Acceso al asistente |

### Riesgos potenciales

1. **Rate limiting:** El backend tiene límite de 20 req/min para IA. Considerar mostrar mensaje si se alcanza.
2. **Timeouts:** 30 segundos puede ser corto para respuestas largas de Gemini. Monitorear.
3. **Contexto largo:** Si el viaje tiene muchas reservas/lugares, el prompt puede ser muy largo.

### Siguientes pasos sugeridos

1. **Persistencia de conversaciones:** Guardar chats en SQLite para historial
2. **Acciones sugeridas:** Implementar chips de acción (navegar a mapa, añadir gasto, etc.)
3. **Streaming:** Implementar respuestas en streaming para mejor UX
4. **Modo offline:** Mostrar respuestas predefinidas sin conexión
5. **Feedback:** Añadir thumbs up/down para mejorar respuestas

---

*Guía creada: Diciembre 2024*
*Versión: 1.0*
