/**
 * TYPES: EVENTO CALENDARIO
 *
 * Tipos para eventos mostrados en el calendario.
 * Un evento puede ser una reserva, un día de viaje, etc.
 */

export type TipoEvento =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'other';

export interface EventoCalendario {
  id: string;
  fecha: string; // ISO date string (YYYY-MM-DD)
  hora?: string; // HH:MM
  titulo: string;
  tipo: TipoEvento;
  viajeId?: string;
  reservaId?: string;
  lugarId?: string;
  tieneReserva?: boolean;
  tieneDocumento?: boolean;
}

export const EVENTO_COLORS: Record<TipoEvento, string> = {
  transport: '#3B82F6',    // Azul
  accommodation: '#16A34A', // Verde
  food: '#EC4899',          // Rosa
  activity: '#F97316',      // Naranja
  other: '#9CA3AF',         // Gris
};

export const EVENTO_LABELS: Record<TipoEvento, string> = {
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  food: 'Comida',
  activity: 'Actividad',
  other: 'Otro',
};
