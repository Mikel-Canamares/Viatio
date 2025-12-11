// Request types
export interface ExtractReservaRequest {
  imageBase64: string; // Base64 de la imagen (sin el prefijo data:image/...)
  mimeType?: string; // image/jpeg, image/png, etc.
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
export interface ReservaExtractedData {
  tipo: 'vuelo' | 'hotel' | 'restaurante' | 'actividad' | 'transporte' | 'otro';
  titulo: string;
  fecha: string | null;
  hora: string | null;
  ubicacion: string | null;
  numeroReserva: string | null;
  proveedor: string | null;
  detalles: string;
  confianza: number; // 0-1
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
