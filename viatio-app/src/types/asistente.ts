/**
 * TIPOS DEL ASISTENTE IA (VIATIO COPILOT)
 *
 * Define las interfaces para el chat con el asistente de viaje.
 * Sincronizado con el backend (viatio-backend/src/types/index.ts)
 */

// ============================================
// CONFIGURACIÓN DEL COPILOT
// ============================================

/**
 * Preferencias de personalización del Copilot
 */
export interface CopilotPreferences {
  // Módulos donde aparece el Copilot
  enabledModules: {
    agenda: boolean;      // En la pantalla de agenda
    map: boolean;         // En el mapa
    tripDetail: boolean;  // En el detalle del viaje
    standalone: boolean;  // Chat propio del Copilot
  };

  // Personalidad y estilo de respuestas
  tone: CopilotTone;
  responseLength: CopilotResponseLength;
  language: CopilotLanguage;
  useEmojis: boolean;

  // Preferencias de viaje (para sugerencias personalizadas)
  travelPreferences: TravelPreferences;
}

export type CopilotTone = 'professional' | 'friendly' | 'concise';
export type CopilotResponseLength = 'brief' | 'normal' | 'detailed';
export type CopilotLanguage = 'device' | 'es' | 'en';

/**
 * Preferencias de viaje del usuario
 */
export interface TravelPreferences {
  pace: TravelPace;
  interests: TravelInterest[];
  avoidances: string[];
  foodRestrictions: FoodRestriction[];
  mobilityLevel: MobilityLevel;
  budgetLevel: BudgetLevel;
}

export type TravelPace = 'relaxed' | 'balanced' | 'intense';
export type MobilityLevel = 'full' | 'limited' | 'wheelchair';
export type BudgetLevel = 'budget' | 'moderate' | 'luxury';

// Intereses de viaje predefinidos
export type TravelInterest =
  | 'cultura'
  | 'gastronomia'
  | 'naturaleza'
  | 'aventura'
  | 'playa'
  | 'montaña'
  | 'historia'
  | 'arte'
  | 'nightlife'
  | 'shopping'
  | 'relax'
  | 'fotografia';

// Restricciones alimentarias predefinidas
export type FoodRestriction =
  | 'vegetariano'
  | 'vegano'
  | 'sin_gluten'
  | 'sin_lactosa'
  | 'halal'
  | 'kosher'
  | 'sin_mariscos'
  | 'sin_frutos_secos';

/**
 * Valores por defecto del Copilot
 */
export const DEFAULT_COPILOT_PREFERENCES: CopilotPreferences = {
  enabledModules: {
    agenda: true,
    map: true,
    tripDetail: true,
    standalone: true,
  },
  tone: 'friendly',
  responseLength: 'normal',
  language: 'device',
  useEmojis: true,
  travelPreferences: {
    pace: 'balanced',
    interests: [],
    avoidances: [],
    foodRestrictions: [],
    mobilityLevel: 'full',
    budgetLevel: 'moderate',
  },
};

/**
 * Opciones disponibles para la UI de configuración
 */
export const COPILOT_TONE_OPTIONS: Array<{ value: CopilotTone; label: string; description: string }> = [
  { value: 'professional', label: 'Profesional', description: 'Respuestas formales y directas' },
  { value: 'friendly', label: 'Amigable', description: 'Como un amigo viajero' },
  { value: 'concise', label: 'Conciso', description: 'Respuestas muy breves' },
];

export const COPILOT_LENGTH_OPTIONS: Array<{ value: CopilotResponseLength; label: string }> = [
  { value: 'brief', label: 'Breve' },
  { value: 'normal', label: 'Normal' },
  { value: 'detailed', label: 'Detallada' },
];

export const COPILOT_LANGUAGE_OPTIONS: Array<{ value: CopilotLanguage; label: string }> = [
  { value: 'device', label: 'Igual que el dispositivo' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

export const TRAVEL_INTEREST_OPTIONS: Array<{ value: TravelInterest; label: string; icon: string }> = [
  { value: 'cultura', label: 'Cultura', icon: 'library-outline' },
  { value: 'gastronomia', label: 'Gastronomía', icon: 'restaurant-outline' },
  { value: 'naturaleza', label: 'Naturaleza', icon: 'leaf-outline' },
  { value: 'aventura', label: 'Aventura', icon: 'bicycle-outline' },
  { value: 'playa', label: 'Playa', icon: 'sunny-outline' },
  { value: 'montaña', label: 'Montaña', icon: 'trail-sign-outline' },
  { value: 'historia', label: 'Historia', icon: 'time-outline' },
  { value: 'arte', label: 'Arte', icon: 'color-palette-outline' },
  { value: 'nightlife', label: 'Vida nocturna', icon: 'moon-outline' },
  { value: 'shopping', label: 'Compras', icon: 'bag-outline' },
  { value: 'relax', label: 'Relax', icon: 'water-outline' },
  { value: 'fotografia', label: 'Fotografía', icon: 'camera-outline' },
];

export const FOOD_RESTRICTION_OPTIONS: Array<{ value: FoodRestriction; label: string }> = [
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'sin_gluten', label: 'Sin gluten' },
  { value: 'sin_lactosa', label: 'Sin lactosa' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'sin_mariscos', label: 'Sin mariscos' },
  { value: 'sin_frutos_secos', label: 'Sin frutos secos' },
];

export const TRAVEL_PACE_OPTIONS: Array<{ value: TravelPace; label: string; description: string }> = [
  { value: 'relaxed', label: 'Relajado', description: '2-3 actividades por día' },
  { value: 'balanced', label: 'Equilibrado', description: '4-5 actividades por día' },
  { value: 'intense', label: 'Intenso', description: 'Aprovechar cada minuto' },
];

export const MOBILITY_LEVEL_OPTIONS: Array<{ value: MobilityLevel; label: string }> = [
  { value: 'full', label: 'Sin limitaciones' },
  { value: 'limited', label: 'Movilidad reducida' },
  { value: 'wheelchair', label: 'Silla de ruedas' },
];

export const BUDGET_LEVEL_OPTIONS: Array<{ value: BudgetLevel; label: string; description: string }> = [
  { value: 'budget', label: 'Económico', description: 'Priorizar opciones gratuitas o baratas' },
  { value: 'moderate', label: 'Moderado', description: 'Balance calidad-precio' },
  { value: 'luxury', label: 'Premium', description: 'Mejores experiencias sin importar coste' },
];

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

// ============================================
// CONTEXT PACK (Contexto completo para el Copilot)
// ============================================

/**
 * Pantallas donde el Copilot puede estar activo
 */
export type CopilotScreen =
  | 'trip_detail'
  | 'agenda'
  | 'day_detail'
  | 'map'
  | 'place_detail'
  | 'standalone_chat';

/**
 * Context Pack completo que se envía al Copilot
 * Contiene toda la información necesaria para respuestas contextuales
 */
export interface ContextPack {
  // Información de la app
  app: {
    version: string;
    platform: 'ios' | 'android';
    locale: string;
    timezone: string;
  };

  // Preferencias del usuario (del CopilotStore)
  user: {
    name?: string;
    preferences: TravelPreferences;
    copilotSettings: {
      tone: CopilotTone;
      responseLength: CopilotResponseLength;
      language: CopilotLanguage;
      useEmojis: boolean;
    };
  };

  // Estado actual de la UI
  ui: {
    currentScreen: CopilotScreen;
    selectedTripId?: string;
    selectedDayId?: string;
    selectedDayDate?: string;
    selectedPlaceId?: string;
    selectedReservationId?: string;
  };

  // Datos del viaje actual
  trip?: {
    id: string;
    title: string;
    destination: string;
    destinationCoords?: { lat: number; lng: number };
    startDate: string;
    endDate: string;
    totalDays: number;
    daysUntilTrip: number; // Negativo si ya pasó
    party?: { adults: number; kids: number };
    lodgingBase?: { name: string; lat: number; lng: number };
  };

  // Agenda del viaje
  agenda?: {
    days: Array<{
      dayId: string;
      date: string;
      dayNumber: number;
      itemCount: number;
      items: Array<{
        id: string;
        type: string;
        title: string;
        start?: string;
        end?: string;
        placeName?: string;
        placeId?: string;
      }>;
    }>;
    totalItems: number;
    emptyDays: number;
  };

  // Reservas del viaje (solo como contexto informativo)
  reservations?: Array<{
    id: string;
    category: string;
    name: string;
    date?: string;
    time?: string;
    location?: string;
    confirmationCode?: string;
  }>;

  // Lugares guardados
  places?: {
    saved: Array<{
      id: string;
      placeId?: string;
      name: string;
      category: string;
      lat: number;
      lng: number;
    }>;
    totalSaved: number;
  };

  // Documentos
  documents?: {
    total: number;
    byCategory: Record<string, number>;
  };

  // Gastos
  expenses?: {
    total: number;
    budget?: number;
    percentUsed?: number;
    currency: string;
    byCategory: Record<string, number>;
  };

  // Capacidades disponibles (qué acciones puede ejecutar)
  capabilities: {
    availableActions: ActionType[];
    canWriteData: boolean;
    canSearchPlaces: boolean;
    canGetDirections: boolean;
  };
}

// ============================================
// SISTEMA DE ACCIONES DEL AGENTE
// ============================================

/**
 * Tipos de acción que el Copilot puede proponer
 */
export type ActionType =
  | 'create_agenda_item'    // Añadir evento a la agenda
  | 'update_agenda_item'    // Modificar evento existente
  | 'delete_agenda_item'    // Eliminar evento
  | 'search_places'         // Buscar lugares con Google Places
  | 'get_directions'        // Calcular ruta entre puntos
  | 'add_place_to_saved'    // Guardar lugar en el viaje
  | 'suggest_itinerary'     // Proponer itinerario para un día
  | 'navigate_to'           // Navegar a otra pantalla
  | 'show_on_map';          // Mostrar ubicación en el mapa

/**
 * Acción individual propuesta por el Copilot
 */
export interface AgentAction {
  id: string;
  label: string;             // Texto del botón: "Añadir a agenda"
  type: ActionType;
  requiresConfirmation: boolean;
  params: Record<string, unknown>;
  icon?: string;             // Icono Ionicons
  confidence?: number;       // 0.0 - 1.0
}

/**
 * Respuesta estructurada del Copilot
 */
export interface AgentResponse {
  message: string;           // Texto natural para el usuario
  actions: AgentAction[];    // 0-3 acciones propuestas
  metadata?: {
    confidence: number;
    sourcesUsed: string[];   // ['google_places', 'trip_context', ...]
    processingTimeMs: number;
  };
}

/**
 * Mensaje de chat con acciones (extiende MensajeChat)
 */
export interface MensajeChatConAcciones extends MensajeChat {
  actions?: AgentAction[];
  actionResults?: Array<{
    actionId: string;
    success: boolean;
    message?: string;
  }>;
}

/**
 * Parámetros específicos para cada tipo de acción
 */
export interface CreateAgendaItemParams {
  tripId: string;
  date: string;
  title: string;
  type?: string;
  start?: string;
  end?: string;
  placeId?: string;
  placeName?: string;
  notes?: string;
}

export interface SearchPlacesParams {
  query?: string;
  nearLat?: number;
  nearLng?: number;
  categories?: string[];
  radiusMeters?: number;
}

export interface GetDirectionsParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  mode?: 'walking' | 'driving' | 'transit';
}

export interface AddPlaceToSavedParams {
  tripId: string;
  placeId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
}

export interface NavigateToParams {
  screen: string;
  params?: Record<string, unknown>;
}

export interface ShowOnMapParams {
  lat: number;
  lng: number;
  title?: string;
  placeIds?: string[];
}

/**
 * Request para el nuevo endpoint /api/copilot
 */
export interface CopilotAPIRequest {
  message: string;
  contextPack: ContextPack;
  conversationHistory?: MensajeChatAPI[];
}

/**
 * Response del endpoint /api/copilot
 */
export interface CopilotAPIResponse {
  success: boolean;
  response?: AgentResponse;
  error?: string;
}
