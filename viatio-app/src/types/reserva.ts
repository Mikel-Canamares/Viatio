/**
 * RESERVA TYPES
 *
 * Tipos para las reservas de viaje.
 */

export type CategoriaReserva = 'transport' | 'accommodation' | 'food' | 'activity' | 'other';

export type EstadoPago = 'pending' | 'partial' | 'paid';

// Subtipos por categoría
export type SubtipoTransporte = 'plane' | 'train' | 'bus' | 'ferry' | 'taxi' | 'other';
export type SubtipoAlojamiento = 'hotel' | 'aparthotel' | 'apartment' | 'room' | 'camping' | 'other';
export type SubtipoActividad = 'museum' | 'tour' | 'sports' | 'culture' | 'nature' | 'adventure' | 'other';

export interface ReservaMetadatos {
  // Subtipos específicos
  subtipoTransporte?: SubtipoTransporte;
  subtipoAlojamiento?: SubtipoAlojamiento;
  subtipoActividad?: SubtipoActividad;

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
  lugarId?: string; // ID del lugar asociado (opcional, creado automáticamente)
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
  lugarId?: string; // ID del lugar asociado (opcional)
  autoCreateLugar?: boolean; // Flag para controlar creación automática de lugar (default: true)
}

export const RESERVA_CATEGORIAS: Record<CategoriaReserva, { label: string; icon: string }> = {
  transport: { label: 'Transporte', icon: 'airplane' },
  accommodation: { label: 'Alojamiento', icon: 'bed' },
  food: { label: 'Restaurante', icon: 'restaurant' },
  activity: { label: 'Actividad', icon: 'ticket' },
  other: { label: 'Otro', icon: 'ellipsis-horizontal' },
};

// Opciones de subtipos con iconos
export const SUBTIPOS_TRANSPORTE: Record<SubtipoTransporte, { label: string; icon: string }> = {
  plane: { label: 'Avión', icon: 'airplane' },
  train: { label: 'Tren', icon: 'train' },
  bus: { label: 'Autobús', icon: 'bus' },
  ferry: { label: 'Ferry', icon: 'boat' },
  taxi: { label: 'Taxi', icon: 'car' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal' },
};

export const SUBTIPOS_ALOJAMIENTO: Record<SubtipoAlojamiento, { label: string; icon: string }> = {
  hotel: { label: 'Hotel', icon: 'business' },
  aparthotel: { label: 'Apartahotel', icon: 'business-outline' },
  apartment: { label: 'Apartamento', icon: 'home' },
  room: { label: 'Habitación', icon: 'bed' },
  camping: { label: 'Camping', icon: 'bonfire' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal' },
};

export const SUBTIPOS_ACTIVIDAD: Record<SubtipoActividad, { label: string; icon: string }> = {
  museum: { label: 'Museo', icon: 'images' },
  tour: { label: 'Tour', icon: 'walk' },
  sports: { label: 'Deportes', icon: 'football' },
  culture: { label: 'Cultura', icon: 'library' },
  nature: { label: 'Naturaleza', icon: 'leaf' },
  adventure: { label: 'Aventura', icon: 'trail-sign' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal' },
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
