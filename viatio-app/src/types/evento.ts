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

// ============================================
// EVENTOS PERSONALIZADOS
// ============================================

export type CategoriaEvento =
  | 'sightseeing' // Turismo / Visitas
  | 'culture' // Cultura / Museos
  | 'food' // Comida / Restaurantes
  | 'shopping' // Compras
  | 'entertainment' // Entretenimiento
  | 'nature' // Naturaleza / Parques
  | 'relaxation' // Descanso / Spa
  | 'transport' // Transporte / Traslados
  | 'nightlife' // Vida nocturna
  | 'sports' // Deportes / Actividades
  | 'other'; // Otros

export type PrioridadEvento = 'alta' | 'media' | 'baja';

export interface EventoPersonalizado {
  id: string;
  viajeId: string;
  diaId?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaEvento;
  horaInicio?: string; // Formato HH:MM
  horaFin?: string; // Formato HH:MM
  duracionMinutos?: number;
  ubicacion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  lugarId?: string; // ID del lugar asociado
  notas?: string;
  completado: boolean;
  prioridad: PrioridadEvento;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventoInput {
  viajeId: string;
  diaId?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaEvento;
  horaInicio?: string;
  horaFin?: string;
  duracionMinutos?: number;
  ubicacion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
  prioridad?: PrioridadEvento;
}

export interface UpdateEventoInput {
  nombre?: string;
  descripcion?: string;
  categoria?: CategoriaEvento;
  diaId?: string | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  duracionMinutos?: number | null;
  ubicacion?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  lugarId?: string | null;
  notas?: string | null;
  completado?: boolean;
  prioridad?: PrioridadEvento;
}

// Configuración de categorías con colores e iconos
export const EVENTO_CATEGORIAS: Record<
  CategoriaEvento,
  {
    label: string;
    labelCorto: string;
    icon: string;
    color: string;
    bgColor: string;
  }
> = {
  sightseeing: {
    label: 'Turismo y visitas',
    labelCorto: 'Turismo',
    icon: 'camera-outline',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  culture: {
    label: 'Cultura y museos',
    labelCorto: 'Cultura',
    icon: 'library-outline',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
  },
  food: {
    label: 'Comida y restaurantes',
    labelCorto: 'Comida',
    icon: 'restaurant-outline',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
  },
  shopping: {
    label: 'Compras',
    labelCorto: 'Compras',
    icon: 'bag-outline',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
  entertainment: {
    label: 'Entretenimiento',
    labelCorto: 'Ocio',
    icon: 'game-controller-outline',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  nature: {
    label: 'Naturaleza y parques',
    labelCorto: 'Naturaleza',
    icon: 'leaf-outline',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.1)',
  },
  relaxation: {
    label: 'Descanso y relax',
    labelCorto: 'Descanso',
    icon: 'bed-outline',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
  transport: {
    label: 'Transporte y traslados',
    labelCorto: 'Transporte',
    icon: 'car-outline',
    color: '#0066CC',
    bgColor: 'rgba(0, 102, 204, 0.1)',
  },
  nightlife: {
    label: 'Vida nocturna',
    labelCorto: 'Noche',
    icon: 'moon-outline',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
  sports: {
    label: 'Deportes y actividades',
    labelCorto: 'Deportes',
    icon: 'fitness-outline',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
  },
  other: {
    label: 'Otros',
    labelCorto: 'Otros',
    icon: 'ellipsis-horizontal-outline',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
  },
};

export const PRIORIDAD_CONFIG: Record<
  PrioridadEvento,
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  alta: { label: 'Alta', color: '#DC2626', icon: 'flag' },
  media: { label: 'Media', color: '#F59E0B', icon: 'flag-outline' },
  baja: { label: 'Baja', color: '#6B7280', icon: 'flag-outline' },
};
