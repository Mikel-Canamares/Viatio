/**
 * TYPES: LUGAR
 *
 * Tipos para la gestión de lugares de interés en viajes.
 * Incluye restaurantes, hoteles, atracciones, tiendas, transportes, etc.
 */

export type CategoriaLugar =
  | 'restaurant'
  | 'hotel'
  | 'attraction'
  | 'shopping'
  | 'transport'
  | 'other';

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

export const LUGAR_CATEGORIAS: Record<
  CategoriaLugar,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  restaurant: { label: 'Restaurante', icon: 'restaurant', color: '#EA580C' },
  hotel: { label: 'Hotel', icon: 'bed', color: '#16A34A' },
  attraction: { label: 'Atracción', icon: 'camera', color: '#8B5CF6' },
  shopping: { label: 'Compras', icon: 'bag', color: '#EC4899' },
  transport: { label: 'Transporte', icon: 'bus', color: '#0066CC' },
  other: { label: 'Otro', icon: 'location', color: '#6B7280' },
};

export const LUGAR_MARKER_COLORS: Record<CategoriaLugar, string> = {
  restaurant: '#EA580C',
  hotel: '#16A34A',
  attraction: '#8B5CF6',
  shopping: '#EC4899',
  transport: '#0066CC',
  other: '#6B7280',
};
