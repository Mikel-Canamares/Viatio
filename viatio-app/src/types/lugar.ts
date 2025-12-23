/**
 * TYPES: LUGAR
 *
 * Tipos para la gestión de lugares de interés en viajes.
 * Incluye restaurantes, hoteles, atracciones, tiendas, transportes, etc.
 */

import { BASE_CATEGORIES, mapLugarToCategory } from '@/config/categories';

/**
 * Categorías de lugares
 * Mapean a las categorías base del sistema centralizado
 */
export type CategoriaLugar =
  | 'restaurant' // maps to 'food'
  | 'hotel' // maps to 'accommodation'
  | 'attraction' // maps to 'activity'
  | 'shopping' // maps to 'shopping'
  | 'transport' // maps to 'transport'
  | 'other'; // maps to 'other'

export interface Lugar {
  id: string;
  viajeId: string;
  diaId?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaLugar;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  googlePlaceId?: string; // ID de Google Places para obtener detalles completos
  orden: number;
  visitado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLugarInput {
  viajeId: string;
  diaId?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaLugar;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  googlePlaceId?: string; // ID de Google Places
  orden?: number;
}

/**
 * Configuración de categorías de lugares
 * Usa el sistema centralizado de colores para mantener consistencia
 */
export const LUGAR_CATEGORIAS: Record<
  CategoriaLugar,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  restaurant: {
    label: 'Restaurante',
    icon: BASE_CATEGORIES.food.icon,
    color: BASE_CATEGORIES.food.color,
  },
  hotel: {
    label: 'Hotel',
    icon: BASE_CATEGORIES.accommodation.icon,
    color: BASE_CATEGORIES.accommodation.color,
  },
  attraction: {
    label: 'Atracción',
    icon: 'camera',
    color: BASE_CATEGORIES.activity.color,
  },
  shopping: {
    label: BASE_CATEGORIES.shopping.label,
    icon: BASE_CATEGORIES.shopping.icon,
    color: BASE_CATEGORIES.shopping.color,
  },
  transport: {
    label: BASE_CATEGORIES.transport.label,
    icon: 'bus',
    color: BASE_CATEGORIES.transport.color,
  },
  other: {
    label: BASE_CATEGORIES.other.labelShort,
    icon: 'location',
    color: BASE_CATEGORIES.other.color,
  },
};

/**
 * Colores de marcadores en el mapa
 * Importados del sistema centralizado
 */
export const LUGAR_MARKER_COLORS: Record<CategoriaLugar, string> = {
  restaurant: BASE_CATEGORIES.food.color,
  hotel: BASE_CATEGORIES.accommodation.color,
  attraction: BASE_CATEGORIES.activity.color,
  shopping: BASE_CATEGORIES.shopping.color,
  transport: BASE_CATEGORIES.transport.color,
  other: BASE_CATEGORIES.other.color,
};
