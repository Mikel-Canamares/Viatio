/**
 * RESERVA TYPES
 *
 * Tipos para las reservas de viaje.
 */

export type CategoriaReserva = 'transport' | 'accommodation' | 'food' | 'activity' | 'other';

export type EstadoPago = 'pending' | 'partial' | 'paid';

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

export interface Reserva {
  id: string;
  viajeId: string;
  diaId?: string;
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
  latitud?: number;
  longitud?: number;
  precio?: number;
  moneda: string;
  estadoPago: EstadoPago;
  notas?: string;
  metadatos?: ReservaMetadatos;
  documentoId?: string; // ID del documento asociado (opcional)
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservaInput {
  viajeId: string;
  diaId?: string;
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
  latitud?: number;
  longitud?: number;
  precio?: number;
  moneda?: string;
  estadoPago?: EstadoPago;
  notas?: string;
  metadatos?: ReservaMetadatos;
  documentoId?: string; // ID del documento asociado (opcional)
}

export const RESERVA_CATEGORIAS: Record<CategoriaReserva, { label: string; icon: string }> = {
  transport: { label: 'Transporte', icon: 'airplane' },
  accommodation: { label: 'Alojamiento', icon: 'bed' },
  food: { label: 'Restaurante', icon: 'restaurant' },
  activity: { label: 'Actividad', icon: 'ticket' },
  other: { label: 'Otro', icon: 'ellipsis-horizontal' },
};

/**
 * Mapea una categoría de reserva a categoría de documento
 * Solo para las categorías compatibles: transporte, alojamiento, actividades
 */
export function mapReservaToCategoriaDocumento(
  categoria: CategoriaReserva
): 'transporte' | 'alojamiento' | 'actividades' | 'otros' {
  switch (categoria) {
    case 'transport':
      return 'transporte';
    case 'accommodation':
      return 'alojamiento';
    case 'activity':
      return 'actividades';
    default:
      return 'otros';
  }
}
