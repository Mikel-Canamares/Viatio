/**
 * COPILOT PLACES SERVICE
 *
 * Servicio especializado para que el Copilot pueda sugerir lugares
 * basándose en las preferencias del usuario y el contexto del viaje.
 * Utiliza Google Places API a través de googlePlacesService.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  searchPlacesByText,
  searchNearbyPlaces,
  getPlaceDetails,
  getPhotoUrl,
} from '@/services/googlePlacesService';
import type { PlaceResult } from '@/types/googlePlaces';
import type { TravelPreferences, BudgetLevel } from '@/types/asistente';

// ============================================
// TIPOS
// ============================================

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  category: PlaceSuggestionCategory;
  address: string;
  shortAddress?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  priceLevelLabel?: string;
  isOpen?: boolean;
  photoUrl?: string;
  distance?: number; // en metros
  matchScore?: number; // 0-100, qué tan bien coincide con preferencias
  matchReasons?: string[]; // Por qué se recomienda este lugar
}

export type PlaceSuggestionCategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'attraction'
  | 'museum'
  | 'park'
  | 'shopping'
  | 'nightlife'
  | 'hotel'
  | 'transport'
  | 'other';

export interface SuggestOptions {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  maxResults?: number;
  preferences?: TravelPreferences;
  excludePlaceIds?: string[]; // Lugares ya visitados o guardados
}

// ============================================
// CACHÉ
// ============================================

const CACHE_PREFIX = '@viatio:places_cache:';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      // Caché expirado
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn('[CopilotPlaces] Error guardando caché:', error);
  }
}

function generateCacheKey(
  type: string,
  lat: number,
  lng: number,
  radius: number
): string {
  // Redondear coordenadas para mejorar cache hits
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${type}_${roundedLat}_${roundedLng}_${radius}`;
}

// ============================================
// MAPEO DE TIPOS GOOGLE → CATEGORÍAS COPILOT
// ============================================

function mapGoogleTypeToCopilotCategory(types: string[]): PlaceSuggestionCategory {
  const typeMapping: Record<string, PlaceSuggestionCategory> = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    coffee_shop: 'cafe',
    bar: 'bar',
    night_club: 'nightlife',
    tourist_attraction: 'attraction',
    museum: 'museum',
    art_gallery: 'museum',
    park: 'park',
    national_park: 'park',
    shopping_mall: 'shopping',
    store: 'shopping',
    clothing_store: 'shopping',
    hotel: 'hotel',
    lodging: 'hotel',
    airport: 'transport',
    train_station: 'transport',
    bus_station: 'transport',
  };

  for (const type of types) {
    if (typeMapping[type]) {
      return typeMapping[type];
    }
  }

  return 'other';
}

function getPriceLevelLabel(priceLevel?: number): string | undefined {
  if (priceLevel === undefined) return undefined;
  const labels = ['Gratis', 'Económico', 'Moderado', 'Caro', 'Muy caro'];
  return labels[priceLevel] || undefined;
}

// ============================================
// CÁLCULO DE DISTANCIA
// ============================================

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================
// SCORING DE LUGARES SEGÚN PREFERENCIAS
// ============================================

function scorePlace(
  place: PlaceResult,
  preferences?: TravelPreferences
): { score: number; reasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Rating alto
  if (place.rating) {
    if (place.rating >= 4.5) {
      score += 20;
      reasons.push('Muy bien valorado');
    } else if (place.rating >= 4.0) {
      score += 10;
      reasons.push('Bien valorado');
    }
  }

  // Cantidad de reviews (popularidad)
  if (place.totalRatings) {
    if (place.totalRatings > 1000) {
      score += 10;
      reasons.push('Muy popular');
    } else if (place.totalRatings > 100) {
      score += 5;
    }
  }

  // Está abierto ahora
  if (place.isOpen === true) {
    score += 5;
    reasons.push('Abierto ahora');
  }

  // Ajuste por presupuesto
  if (preferences?.budgetLevel && place.priceLevel !== undefined) {
    const budgetMap: Record<BudgetLevel, number[]> = {
      budget: [0, 1],
      moderate: [1, 2],
      luxury: [2, 3, 4],
    };
    const preferredLevels = budgetMap[preferences.budgetLevel];
    if (preferredLevels.includes(place.priceLevel)) {
      score += 10;
      reasons.push('Acorde a tu presupuesto');
    }
  }

  return { score: Math.min(score, 100), reasons };
}

// ============================================
// CONVERSIÓN A FORMATO COPILOT
// ============================================

function placeResultToSuggestion(
  place: PlaceResult,
  originLat?: number,
  originLng?: number,
  preferences?: TravelPreferences
): PlaceSuggestion {
  const { score, reasons } = scorePlace(place, preferences);

  const suggestion: PlaceSuggestion = {
    placeId: place.placeId,
    name: place.name,
    category: mapGoogleTypeToCopilotCategory(place.types),
    address: place.address,
    shortAddress: place.shortAddress,
    latitude: place.latitude,
    longitude: place.longitude,
    rating: place.rating,
    totalRatings: place.totalRatings,
    priceLevel: place.priceLevel,
    priceLevelLabel: getPriceLevelLabel(place.priceLevel),
    isOpen: place.isOpen,
    photoUrl: place.photoReference ? getPhotoUrl(place.photoReference, 300) : undefined,
    matchScore: score,
    matchReasons: reasons.length > 0 ? reasons : undefined,
  };

  // Calcular distancia si tenemos coordenadas de origen
  if (originLat !== undefined && originLng !== undefined) {
    suggestion.distance = calculateDistance(
      originLat,
      originLng,
      place.latitude,
      place.longitude
    );
  }

  return suggestion;
}

// ============================================
// FUNCIONES PRINCIPALES DE SUGERENCIA
// ============================================

/**
 * Sugiere actividades y atracciones cercanas
 */
export async function suggestNearbyActivities(
  options: SuggestOptions
): Promise<PlaceSuggestion[]> {
  const {
    latitude,
    longitude,
    radiusMeters = 2000,
    maxResults = 10,
    preferences,
    excludePlaceIds = [],
  } = options;

  const cacheKey = generateCacheKey('activities', latitude, longitude, radiusMeters);
  const cached = await getFromCache<PlaceResult[]>(cacheKey);

  let places: PlaceResult[];

  if (cached) {
    console.log('[CopilotPlaces] Usando caché para actividades');
    places = cached;
  } else {
    // Buscar atracciones turísticas
    const queries = [
      'tourist attractions',
      'things to do',
      'points of interest',
    ];

    const allPlaces: PlaceResult[] = [];
    for (const query of queries) {
      const results = await searchPlacesByText(query, {
        latitude,
        longitude,
        radiusMeters,
        maxResults: 5,
      });
      allPlaces.push(...results);
    }

    // También buscar lugares cercanos genéricos
    const nearbyPlaces = await searchNearbyPlaces(latitude, longitude, radiusMeters, 10);
    allPlaces.push(...nearbyPlaces);

    // Deduplicar por placeId
    const uniquePlaces = new Map<string, PlaceResult>();
    for (const place of allPlaces) {
      if (!uniquePlaces.has(place.placeId)) {
        uniquePlaces.set(place.placeId, place);
      }
    }

    places = Array.from(uniquePlaces.values());
    await setCache(cacheKey, places);
  }

  // Filtrar excluidos
  const filtered = places.filter((p) => !excludePlaceIds.includes(p.placeId));

  // Convertir y ordenar por score
  const suggestions = filtered
    .map((p) => placeResultToSuggestion(p, latitude, longitude, preferences))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, maxResults);

  return suggestions;
}

/**
 * Sugiere restaurantes según preferencias
 */
export async function suggestRestaurants(
  options: SuggestOptions & {
    cuisineType?: string;
    mealTime?: 'breakfast' | 'lunch' | 'dinner';
  }
): Promise<PlaceSuggestion[]> {
  const {
    latitude,
    longitude,
    radiusMeters = 1000,
    maxResults = 10,
    preferences,
    excludePlaceIds = [],
    cuisineType,
    mealTime,
  } = options;

  // Construir query basada en preferencias
  let query = 'restaurants';

  if (cuisineType) {
    query = `${cuisineType} restaurants`;
  } else if (mealTime) {
    const mealQueries = {
      breakfast: 'breakfast cafe',
      lunch: 'lunch restaurants',
      dinner: 'dinner restaurants',
    };
    query = mealQueries[mealTime];
  }

  // Ajustar por restricciones alimentarias
  if (preferences?.foodRestrictions && preferences.foodRestrictions.length > 0) {
    const restriction = preferences.foodRestrictions[0];
    const restrictionQueries: Record<string, string> = {
      vegetariano: 'vegetarian',
      vegano: 'vegan',
      sin_gluten: 'gluten free',
      halal: 'halal',
      kosher: 'kosher',
    };
    if (restrictionQueries[restriction]) {
      query = `${restrictionQueries[restriction]} ${query}`;
    }
  }

  const cacheKey = generateCacheKey(`restaurants_${query}`, latitude, longitude, radiusMeters);
  const cached = await getFromCache<PlaceResult[]>(cacheKey);

  let places: PlaceResult[];

  if (cached) {
    console.log('[CopilotPlaces] Usando caché para restaurantes');
    places = cached;
  } else {
    places = await searchPlacesByText(query, {
      latitude,
      longitude,
      radiusMeters,
      maxResults: maxResults * 2, // Pedir más para filtrar después
    });
    await setCache(cacheKey, places);
  }

  // Filtrar excluidos
  const filtered = places.filter((p) => !excludePlaceIds.includes(p.placeId));

  // Convertir y ordenar
  const suggestions = filtered
    .map((p) => placeResultToSuggestion(p, latitude, longitude, preferences))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, maxResults);

  return suggestions;
}

/**
 * Obtiene los principales puntos de interés de un destino
 */
export async function getPointsOfInterest(
  destination: string,
  options?: {
    categories?: string[];
    maxResults?: number;
    preferences?: TravelPreferences;
  }
): Promise<PlaceSuggestion[]> {
  const { categories, maxResults = 15, preferences } = options || {};

  const cacheKey = `poi_${destination.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = await getFromCache<PlaceResult[]>(cacheKey);

  let allPlaces: PlaceResult[];

  if (cached) {
    console.log('[CopilotPlaces] Usando caché para POIs de', destination);
    allPlaces = cached;
  } else {
    // Buscar diferentes tipos de POIs
    const defaultCategories = [
      'must see attractions',
      'famous landmarks',
      'best museums',
      'popular parks',
      'historic sites',
    ];

    const searchCategories = categories || defaultCategories;
    allPlaces = [];

    for (const category of searchCategories) {
      const query = `${destination} ${category}`;
      const results = await searchPlacesByText(query, { maxResults: 5 });
      allPlaces.push(...results);
    }

    // Deduplicar
    const uniquePlaces = new Map<string, PlaceResult>();
    for (const place of allPlaces) {
      if (!uniquePlaces.has(place.placeId)) {
        uniquePlaces.set(place.placeId, place);
      }
    }

    allPlaces = Array.from(uniquePlaces.values());
    await setCache(cacheKey, allPlaces);
  }

  // OPTIMIZACIÓN DE COSTES: 2-step approach
  // Paso 1: Pre-filtro sin rating (ya tenemos places con PRO tier)
  // Los lugares ya vienen ordenados por relevancia de Google

  // Tomar top candidatos (2x maxResults) para refinar después
  const topCandidates = allPlaces.slice(0, maxResults * 2);

  // Paso 2: Obtener rating solo para top candidatos si es necesario
  // En este punto, los lugares ya tienen datos básicos (PRO tier)
  // Solo pedimos rating si el usuario tiene preferencias de presupuesto o necesitamos scoring detallado
  const needsRating = preferences?.budgetLevel !== undefined;

  let finalPlaces = topCandidates;

  if (needsRating && topCandidates.length > 0) {
    console.log('[CopilotPlaces] Obteniendo rating para top', topCandidates.length, 'candidatos');

    // Obtener detalles con rating solo para candidatos (ENTERPRISE_BASIC tier)
    const { getPlaceDetails } = await import('@/services/googlePlacesService');
    const { PlaceDetailLevel } = await import('@/types/googlePlaces');

    const detailsPromises = topCandidates.map(async (place) => {
      try {
        const details = await getPlaceDetails(place.placeId, PlaceDetailLevel.ENTERPRISE_BASIC);
        if (details) {
          // Merge detalles con lugar original
          return { ...place, ...details };
        }
        return place;
      } catch {
        return place;
      }
    });

    finalPlaces = await Promise.all(detailsPromises);
  }

  // Convertir y ordenar
  const suggestions = finalPlaces
    .map((p) => placeResultToSuggestion(p, undefined, undefined, preferences))
    .sort((a, b) => {
      // Si tenemos rating, ordenar por rating * log(totalRatings)
      if (a.rating && b.rating) {
        const scoreA = a.rating * Math.log10((a.totalRatings || 1) + 1);
        const scoreB = b.rating * Math.log10((b.totalRatings || 1) + 1);
        return scoreB - scoreA;
      }
      // Si solo uno tiene rating, priorizarlo
      if (a.rating && !b.rating) return -1;
      if (!a.rating && b.rating) return 1;
      // Si ninguno tiene rating, mantener orden original (relevancia de Google)
      return 0;
    })
    .slice(0, maxResults);

  return suggestions;
}

/**
 * Busca lugares específicos para el Copilot
 */
export async function searchPlacesForCopilot(
  query: string,
  options?: SuggestOptions
): Promise<PlaceSuggestion[]> {
  const {
    latitude,
    longitude,
    radiusMeters = 5000,
    maxResults = 10,
    preferences,
  } = options || {};

  const places = await searchPlacesByText(query, {
    latitude,
    longitude,
    radiusMeters,
    maxResults,
  });

  return places.map((p) =>
    placeResultToSuggestion(p, latitude, longitude, preferences)
  );
}

/**
 * Obtiene detalles completos de un lugar para el Copilot
 */
export async function getPlaceDetailsForCopilot(
  placeId: string
): Promise<PlaceSuggestion | null> {
  const place = await getPlaceDetails(placeId);
  if (!place) return null;

  return placeResultToSuggestion(place);
}

// ============================================
// FORMATEO PARA RESPUESTAS DEL AGENTE
// ============================================

/**
 * Formatea las sugerencias para incluir en el prompt del agente
 */
export function formatSuggestionsForPrompt(
  suggestions: PlaceSuggestion[],
  maxItems: number = 5
): string {
  const items = suggestions.slice(0, maxItems);

  if (items.length === 0) {
    return 'No se encontraron lugares que coincidan con los criterios.';
  }

  return items
    .map((s, i) => {
      let line = `${i + 1}. **${s.name}**`;

      if (s.rating) {
        line += ` (${s.rating.toFixed(1)}★`;
        if (s.totalRatings) {
          line += `, ${s.totalRatings.toLocaleString()} opiniones`;
        }
        line += ')';
      }

      if (s.shortAddress) {
        line += `\n   📍 ${s.shortAddress}`;
      }

      if (s.distance) {
        line += ` - ${s.distance < 1000 ? `${s.distance}m` : `${(s.distance / 1000).toFixed(1)}km`}`;
      }

      if (s.priceLevelLabel) {
        line += `\n   💰 ${s.priceLevelLabel}`;
      }

      if (s.isOpen === true) {
        line += ' • ✅ Abierto';
      } else if (s.isOpen === false) {
        line += ' • ❌ Cerrado';
      }

      if (s.matchReasons && s.matchReasons.length > 0) {
        line += `\n   ✨ ${s.matchReasons.join(', ')}`;
      }

      return line;
    })
    .join('\n\n');
}

/**
 * Construye acciones para los lugares sugeridos
 */
export function buildPlaceActions(
  suggestions: PlaceSuggestion[],
  tripId: string
): Array<{
  id: string;
  label: string;
  type: string;
  params: Record<string, unknown>;
}> {
  return suggestions.slice(0, 3).map((s, i) => ({
    id: `save_place_${i}`,
    label: `Guardar "${s.name}"`,
    type: 'add_place_to_saved',
    params: {
      tripId,
      placeId: s.placeId,
      name: s.name,
      category: s.category,
      lat: s.latitude,
      lng: s.longitude,
    },
  }));
}

// ============================================
// LIMPIEZA DE CACHÉ
// ============================================

/**
 * Limpia el caché de lugares expirados
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const placesCacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

    for (const key of placesCacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const entry = JSON.parse(value);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
          await AsyncStorage.removeItem(key);
        }
      }
    }

    console.log('[CopilotPlaces] Caché limpiado');
  } catch (error) {
    console.warn('[CopilotPlaces] Error limpiando caché:', error);
  }
}
