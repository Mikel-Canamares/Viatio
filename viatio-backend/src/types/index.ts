// Request types
export interface ExtractReservaRequest {
  // Soporta tanto una imagen como múltiples imágenes
  imageBase64?: string; // Base64 de UNA imagen (deprecated, usar images)
  mimeType?: string; // image/jpeg, image/png, etc. (deprecated, usar images)
  images?: Array<{
    base64: string;
    mimeType: string;
  }>; // Array de imágenes para procesar juntas
}

export interface AssistantRequest {
  message: string;
  context?: {
    tripId?: string;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    destination?: string;
    // Nuevos campos para contexto completo
    reservations?: Array<{
      nombre: string;
      categoria: string;
      fecha: string;
    }>;
    places?: Array<{
      nombre: string;
      categoria: string;
    }>;
    budget?: number;
    currentExpense?: number;
  };
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

// Response types
export type CategoriaReserva = 'transport' | 'accommodation' | 'food' | 'activity' | 'other';

export interface ReservaMetadatos {
  // Transport
  aerolinea?: string;
  numeroVuelo?: string;
  terminal?: string;
  puerta?: string;
  asiento?: string;
  clase?: string;

  // Accommodation
  tipoHabitacion?: string;
  numNoches?: number;
  checkIn?: string;
  checkOut?: string;

  // Food
  numPersonas?: number;
  tipoComida?: string;

  // Activity
  duracion?: string;
  incluye?: string[];

  // General
  contacto?: string;
  telefono?: string;
  email?: string;
  web?: string;
  politicaCancelacion?: string;
}

export interface ReservaExtractedData {
  categoria: CategoriaReserva;
  nombre: string;
  proveedor?: string;
  numeroConfirmacion?: string;
  fechaInicio?: string;
  horaInicio?: string;
  fechaFin?: string;
  horaFin?: string;
  ubicacion?: string;
  direccion?: string;
  precio?: number;
  moneda?: string;
  notas?: string;
  metadatos?: ReservaMetadatos;
  confianza: 'alta' | 'media' | 'baja';
}

export interface ExtractReservaResponse {
  success: boolean;
  data?: ReservaExtractedData;
  error?: string;
}

export interface AssistantResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// COPILOT (Nuevo sistema con acciones)
// ============================================

export type CopilotTone = 'professional' | 'friendly' | 'concise';
export type CopilotResponseLength = 'brief' | 'normal' | 'detailed';
export type CopilotLanguage = 'device' | 'es' | 'en';

export interface CopilotRequest {
  message: string;
  contextPack: {
    app: {
      version: string;
      platform: 'ios' | 'android';
      locale: string;
      timezone: string;
    };
    user: {
      name?: string;
      preferences: {
        pace: 'relaxed' | 'balanced' | 'intense';
        interests: string[];
        avoidances: string[];
        foodRestrictions: string[];
        mobilityLevel: 'full' | 'limited' | 'wheelchair';
        budgetLevel: 'budget' | 'moderate' | 'luxury';
      };
      copilotSettings: {
        tone: CopilotTone;
        responseLength: CopilotResponseLength;
        language: CopilotLanguage;
        useEmojis: boolean;
      };
    };
    ui: {
      currentScreen: string;
      selectedTripId?: string;
      selectedDayId?: string;
      selectedDayDate?: string;
      selectedPlaceId?: string;
      selectedReservationId?: string;
    };
    trip?: {
      id: string;
      title: string;
      destination: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      daysUntilTrip: number;
      party?: { adults: number; kids: number };
    };
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
    reservations?: Array<{
      id: string;
      category: string;
      name: string;
      date?: string;
      time?: string;
      location?: string;
      confirmationCode?: string;
    }>;
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
    documents?: {
      total: number;
      byCategory: Record<string, number>;
    };
    // NOTA: expenses eliminado - el módulo de gastos es independiente del Copilot
    capabilities: {
      availableActions: string[];
      canWriteData: boolean;
      canSearchPlaces: boolean;
      canGetDirections: boolean;
    };
  };
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface CopilotAction {
  id: string;
  label: string;
  type: string;
  requiresConfirmation: boolean;
  params: Record<string, unknown>;
  icon?: string;
  confidence?: number;
}

export interface CopilotResponse {
  success: boolean;
  response?: {
    message: string;
    actions: CopilotAction[];
    metadata?: {
      confidence: number;
      sourcesUsed: string[];
      processingTimeMs: number;
    };
  };
  error?: string;
}

// Error types
export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
