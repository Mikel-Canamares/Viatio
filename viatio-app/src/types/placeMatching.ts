/**
 * TYPES: PLACE MATCHING
 *
 * Tipos para el sistema de matching automático entre reservas y lugares.
 * Permite conectar reservas con lugares de Google Places automáticamente.
 */

import type { Lugar } from './lugar';
import type { PlaceResult } from './googlePlaces';

/**
 * Tipo de resultado del matching
 */
export type PlaceMatchType = 'exact' | 'suggested' | 'multiple' | 'none';

/**
 * Resultado del proceso de matching de lugar
 */
export interface PlaceMatchResult {
  /** Tipo de match encontrado */
  type: PlaceMatchType;

  /** Lugar existente o recién creado (solo si type === 'exact') */
  lugar?: Lugar;

  /** Sugerencias de Google Places (si type === 'suggested' o 'multiple') */
  suggestions?: PlaceResult[];

  /** Nivel de confianza del match (0-100) */
  confidence: number;

  /** Mensaje descriptivo del resultado (para UI) */
  message?: string;
}

/**
 * Opciones para la creación automática de lugares
 */
export interface AutoPlaceCreationOptions {
  /** Mostrar diálogo de confirmación antes de crear */
  showConfirmation: boolean;

  /** Mostrar notificación al usuario después de crear */
  notifyUser: boolean;

  /** Umbral mínimo de confianza para crear automáticamente (0-100) */
  threshold: number;

  /** Distancia máxima en metros para considerar "mismo lugar" */
  maxDistanceMeters?: number;
}

/**
 * Configuración global del sistema de matching
 */
export interface PlaceMatchingConfig {
  autoCreate: {
    enabled: boolean;
    threshold: number;
    maxDistance: number;
  };
  notifications: {
    showSuccessToast: boolean;
    showConfirmationDialog: boolean;
    autoCloseDelay: number;
  };
  search: {
    maxResults: number;
    radiusMeters: number;
    preferredLanguage: string;
  };
}

/**
 * Coordenadas geográficas
 */
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Resultado del scoring de relevancia
 */
export interface ScoredPlace {
  place: PlaceResult;
  score: number;
  breakdown?: {
    nameSimilarity: number;
    distanceScore: number;
    categoryMatch: number;
    addressSimilarity: number;
  };
}

/**
 * Configuración por defecto
 */
export const DEFAULT_PLACE_MATCHING_CONFIG: PlaceMatchingConfig = {
  autoCreate: {
    enabled: true,
    threshold: 80,
    maxDistance: 1000, // 1km
  },
  notifications: {
    showSuccessToast: true,
    showConfirmationDialog: true,
    autoCloseDelay: 3000,
  },
  search: {
    maxResults: 5,
    radiusMeters: 10000, // 10km
    preferredLanguage: 'es',
  },
};

/**
 * Opciones por defecto para auto-creación
 */
export const DEFAULT_AUTO_CREATION_OPTIONS: AutoPlaceCreationOptions = {
  showConfirmation: false,
  notifyUser: true,
  threshold: 80,
  maxDistanceMeters: 100,
};
