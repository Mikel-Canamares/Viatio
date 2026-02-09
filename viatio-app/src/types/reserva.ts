/**
 * RESERVA TYPES
 *
 * Tipos para las reservas de viaje.
 */

import {
  CategoryBase,
  TransportSubtype,
  AccommodationSubtype,
  ActivitySubtype,
  BASE_CATEGORIES,
  TRANSPORT_SUBTYPES,
  ACCOMMODATION_SUBTYPES,
  ACTIVITY_SUBTYPES,
} from '@/config/categories';
import type { SplitMethod, ExpenseShare } from './shared';

export type CategoriaReserva = CategoryBase;

export type EstadoPago = 'pending' | 'partial' | 'paid';

// Subtipos por categoría (importados del sistema centralizado)
export type SubtipoTransporte = TransportSubtype;
export type SubtipoAlojamiento = AccommodationSubtype;
export type SubtipoActividad = ActivitySubtype;

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

  // Payment & Cancellation deadlines
  fechaLimitePago?: string; // ISO date (YYYY-MM-DD)
  cancelacionGratuita?: boolean;
  fechaLimiteCancelacion?: string; // ISO date (YYYY-MM-DD)
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
  paidByUserId?: string; // ID del usuario que pagó (para viajes compartidos)
  splitMethod?: SplitMethod; // Método de reparto del pago (para viajes compartidos)
  participantUids?: string[]; // UIDs de participantes que comparten el gasto
  shares?: ExpenseShare[]; // Detalle del reparto por participante
  notas?: string;
  metadatos?: ReservaMetadatos;
  documentoId?: string; // ID del documento asociado (opcional)
  lugarId?: string; // ID del lugar asociado (opcional, creado automáticamente)
  firestoreId?: string; // ID en Firestore (para viajes compartidos)
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
  paidByUserId?: string; // ID del usuario que pagó (para viajes compartidos)
  splitMethod?: SplitMethod; // Método de reparto del pago (para viajes compartidos)
  participantUids?: string[]; // UIDs de participantes que comparten el gasto
  shares?: Omit<ExpenseShare, 'calculatedAmount'>[]; // Detalle del reparto (calculatedAmount se calcula automáticamente)
  notas?: string;
  metadatos?: ReservaMetadatos;
  documentoId?: string; // ID del documento asociado (opcional)
  lugarId?: string; // ID del lugar asociado (opcional)
  autoCreateLugar?: boolean; // Flag para controlar creación automática de lugar (default: true)
}

// ============================================
// CONFIGURACIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
// ============================================

/**
 * Configuración de categorías principales de reserva
 * Importado del sistema centralizado para mantener consistencia
 */
export const RESERVA_CATEGORIAS: Record<CategoriaReserva, { label: string; icon: string }> = {
  transport: { label: BASE_CATEGORIES.transport.label, icon: BASE_CATEGORIES.transport.icon },
  accommodation: { label: BASE_CATEGORIES.accommodation.label, icon: BASE_CATEGORIES.accommodation.icon },
  food: { label: 'Restaurante', icon: BASE_CATEGORIES.food.icon },
  activity: { label: BASE_CATEGORIES.activity.labelShort, icon: BASE_CATEGORIES.activity.icon },
  shopping: { label: BASE_CATEGORIES.shopping.label, icon: BASE_CATEGORIES.shopping.icon },
  other: { label: BASE_CATEGORIES.other.labelShort, icon: BASE_CATEGORIES.other.icon },
};

/**
 * Opciones de subtipos de transporte
 * Importado del sistema centralizado
 */
export const SUBTIPOS_TRANSPORTE: Record<SubtipoTransporte, { label: string; icon: string }> = {
  plane: { label: TRANSPORT_SUBTYPES.plane.label, icon: TRANSPORT_SUBTYPES.plane.icon },
  train: { label: TRANSPORT_SUBTYPES.train.label, icon: TRANSPORT_SUBTYPES.train.icon },
  bus: { label: TRANSPORT_SUBTYPES.bus.label, icon: TRANSPORT_SUBTYPES.bus.icon },
  ferry: { label: TRANSPORT_SUBTYPES.ferry.label, icon: TRANSPORT_SUBTYPES.ferry.icon },
  taxi: { label: TRANSPORT_SUBTYPES.taxi.label, icon: TRANSPORT_SUBTYPES.taxi.icon },
  car: { label: TRANSPORT_SUBTYPES.car.label, icon: TRANSPORT_SUBTYPES.car.icon },
  other: { label: TRANSPORT_SUBTYPES.other.label, icon: TRANSPORT_SUBTYPES.other.icon },
};

/**
 * Opciones de subtipos de alojamiento
 * Importado del sistema centralizado
 */
export const SUBTIPOS_ALOJAMIENTO: Record<SubtipoAlojamiento, { label: string; icon: string }> = {
  hotel: { label: ACCOMMODATION_SUBTYPES.hotel.label, icon: ACCOMMODATION_SUBTYPES.hotel.icon },
  aparthotel: { label: ACCOMMODATION_SUBTYPES.aparthotel.label, icon: ACCOMMODATION_SUBTYPES.aparthotel.icon },
  apartment: { label: ACCOMMODATION_SUBTYPES.apartment.label, icon: ACCOMMODATION_SUBTYPES.apartment.icon },
  room: { label: ACCOMMODATION_SUBTYPES.room.label, icon: ACCOMMODATION_SUBTYPES.room.icon },
  camping: { label: ACCOMMODATION_SUBTYPES.camping.label, icon: ACCOMMODATION_SUBTYPES.camping.icon },
  other: { label: ACCOMMODATION_SUBTYPES.other.label, icon: ACCOMMODATION_SUBTYPES.other.icon },
};

/**
 * Opciones de subtipos de actividad
 * Importado del sistema centralizado
 */
export const SUBTIPOS_ACTIVIDAD: Record<SubtipoActividad, { label: string; icon: string }> = {
  sightseeing: { label: ACTIVITY_SUBTYPES.sightseeing.label, icon: ACTIVITY_SUBTYPES.sightseeing.icon },
  culture: { label: ACTIVITY_SUBTYPES.culture.label, icon: ACTIVITY_SUBTYPES.culture.icon },
  sports: { label: ACTIVITY_SUBTYPES.sports.label, icon: ACTIVITY_SUBTYPES.sports.icon },
  nature: { label: ACTIVITY_SUBTYPES.nature.label, icon: ACTIVITY_SUBTYPES.nature.icon },
  entertainment: { label: ACTIVITY_SUBTYPES.entertainment.label, icon: ACTIVITY_SUBTYPES.entertainment.icon },
  nightlife: { label: ACTIVITY_SUBTYPES.nightlife.label, icon: ACTIVITY_SUBTYPES.nightlife.icon },
  other: { label: ACTIVITY_SUBTYPES.other.label, icon: ACTIVITY_SUBTYPES.other.icon },
};

/**
 * Mapea una categoría de reserva a categoría de documento
 * Mapea todas las categorías de reserva a su equivalente en documentos
 */
export function mapReservaToCategoriaDocumento(
  categoria: CategoriaReserva
): 'transporte' | 'alojamiento' | 'actividades' | 'comida' | 'compras' | 'otros' {
  switch (categoria) {
    case 'transport':
      return 'transporte';
    case 'accommodation':
      return 'alojamiento';
    case 'activity':
      return 'actividades';
    case 'food':
      return 'comida';
    case 'shopping':
      return 'compras';
    default:
      return 'otros';
  }
}
