/**
 * TYPES: EVENTO CALENDARIO
 *
 * Tipos para eventos mostrados en el calendario.
 * Un evento puede ser una reserva, un día de viaje, etc.
 */

import { CategoryBase, BASE_CATEGORIES } from '@/config/categories';

export type TipoEvento = CategoryBase;

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

/**
 * Colores de eventos - importados del sistema centralizado
 */
export const EVENTO_COLORS: Record<TipoEvento, string> = {
  transport: BASE_CATEGORIES.transport.color,
  accommodation: BASE_CATEGORIES.accommodation.color,
  food: BASE_CATEGORIES.food.color,
  activity: BASE_CATEGORIES.activity.color,
  shopping: BASE_CATEGORIES.shopping.color,
  other: BASE_CATEGORIES.other.color,
};

/**
 * Etiquetas de eventos - importadas del sistema centralizado
 */
export const EVENTO_LABELS: Record<TipoEvento, string> = {
  transport: BASE_CATEGORIES.transport.label,
  accommodation: BASE_CATEGORIES.accommodation.label,
  food: BASE_CATEGORIES.food.label,
  activity: BASE_CATEGORIES.activity.label,
  shopping: BASE_CATEGORIES.shopping.label,
  other: BASE_CATEGORIES.other.labelShort,
};

// ============================================
// EVENTOS PERSONALIZADOS
// ============================================

/**
 * Categorías de eventos personalizados
 * Mezcla de categorías base y subcategorías de actividad
 */
export type CategoriaEvento =
  | 'sightseeing' // Turismo / Visitas (subcategoría de activity)
  | 'culture' // Cultura / Museos (subcategoría de activity)
  | 'food' // Comida / Restaurantes (categoría base)
  | 'shopping' // Compras (categoría base)
  | 'entertainment' // Entretenimiento (subcategoría de activity)
  | 'nature' // Naturaleza / Parques (subcategoría de activity)
  | 'relaxation' // Descanso / Spa (subcategoría de activity)
  | 'transport' // Transporte / Traslados (categoría base)
  | 'nightlife' // Vida nocturna (subcategoría de activity)
  | 'sports' // Deportes / Actividades (subcategoría de activity)
  | 'other'; // Otros (categoría base)

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

import { ACTIVITY_SUBTYPES } from '@/config/categories';

/**
 * Configuración de categorías de eventos personalizados
 * Usa el sistema centralizado de colores para mantener consistencia
 */
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
  // Subcategorías de actividad (color púrpura #8B5CF6)
  sightseeing: {
    label: 'Turismo y visitas',
    labelCorto: ACTIVITY_SUBTYPES.sightseeing.label,
    icon: 'camera-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  culture: {
    label: 'Cultura y museos',
    labelCorto: ACTIVITY_SUBTYPES.culture.label,
    icon: 'library-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  sports: {
    label: 'Deportes y actividades',
    labelCorto: ACTIVITY_SUBTYPES.sports.label,
    icon: 'fitness-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  nature: {
    label: 'Naturaleza y parques',
    labelCorto: ACTIVITY_SUBTYPES.nature.label,
    icon: 'leaf-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  entertainment: {
    label: 'Entretenimiento',
    labelCorto: ACTIVITY_SUBTYPES.entertainment.label,
    icon: 'game-controller-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  nightlife: {
    label: 'Vida nocturna',
    labelCorto: ACTIVITY_SUBTYPES.nightlife.label,
    icon: 'moon-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  relaxation: {
    label: 'Descanso y relax',
    labelCorto: ACTIVITY_SUBTYPES.relaxation.label,
    icon: 'bed-outline',
    color: BASE_CATEGORIES.activity.color,
    bgColor: BASE_CATEGORIES.activity.bgColor,
  },
  // Categorías base
  food: {
    label: 'Comida y restaurantes',
    labelCorto: BASE_CATEGORIES.food.label,
    icon: 'restaurant-outline',
    color: BASE_CATEGORIES.food.color,
    bgColor: BASE_CATEGORIES.food.bgColor,
  },
  shopping: {
    label: BASE_CATEGORIES.shopping.label,
    labelCorto: BASE_CATEGORIES.shopping.label,
    icon: 'bag-outline',
    color: BASE_CATEGORIES.shopping.color,
    bgColor: BASE_CATEGORIES.shopping.bgColor,
  },
  transport: {
    label: 'Transporte y traslados',
    labelCorto: BASE_CATEGORIES.transport.label,
    icon: 'car-outline',
    color: BASE_CATEGORIES.transport.color,
    bgColor: BASE_CATEGORIES.transport.bgColor,
  },
  other: {
    label: BASE_CATEGORIES.other.label,
    labelCorto: BASE_CATEGORIES.other.label,
    icon: 'ellipsis-horizontal-outline',
    color: BASE_CATEGORIES.other.color,
    bgColor: BASE_CATEGORIES.other.bgColor,
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
