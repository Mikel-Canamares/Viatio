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

// Error types
export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
