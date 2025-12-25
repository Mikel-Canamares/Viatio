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
 * Contexto completo para enviar al backend
 */
export interface ContextoViajeAPI {
  tripId?: string;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
  // Nuevos campos para contexto completo
  reservations?: Array<{
    nombre: string;
    categoria: string;
    fecha?: string;
  }>;
  places?: Array<{
    nombre: string;
    categoria: string;
  }>;
  budget?: number;
  currentExpense?: number;
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

/**
 * Conversación guardada en historial (persistida en DB)
 */
export interface ConversacionGuardada {
  id: string;
  viajeId?: string; // Opcional, puede ser conversación general
  titulo: string; // Resumen o primer mensaje
  mensajesJson: string; // JSON.stringify(MensajeChat[])
  contextoJson?: string; // JSON.stringify(ContextoViaje)
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
