/**
 * SERVICE: PLACE MATCHING
 *
 * Servicio para matching automático entre reservas y lugares usando Google Places API.
 * Busca, crea y vincula lugares automáticamente cuando se crean reservas.
 */

import type { Reserva } from '@/types/reserva';
import type { Lugar, CategoriaLugar, CreateLugarInput } from '@/types/lugar';
import type { PlaceResult } from '@/types/googlePlaces';
import type {
  PlaceMatchResult,
  AutoPlaceCreationOptions,
  GeoCoordinates,
  ScoredPlace,
} from '@/types/placeMatching';
import { DEFAULT_AUTO_CREATION_OPTIONS } from '@/types/placeMatching';
import { searchPlacesByText, getPlaceDetails } from './googlePlacesService';
import {
  createLugar,
  findLugarByGooglePlaceId,
  findLugaresNearCoordinates,
} from './lugaresService';
import { combinedSimilarity, normalizeString } from '@/utils/stringSimilarity';
import { mapGoogleTypeToCategoria } from '@/types/googlePlaces';
import { getDatabase, getCurrentTimestamp } from '@/database';

// ============================================
// MAPEO DE CATEGORÍAS
// ============================================

/**
 * Mapea categoría de reserva a categoría de lugar
 */
export function mapReservaCategoriaToLugarCategoria(
  reservaCategoria: string
): CategoriaLugar {
  const mapping: Record<string, CategoriaLugar> = {
    transport: 'transport',
    accommodation: 'hotel',
    food: 'restaurant',
    activity: 'attraction',
    other: 'other',
  };

  return mapping[reservaCategoria] || 'other';
}

// ============================================
// BÚSQUEDA Y MATCHING
// ============================================

/**
 * Construye query de búsqueda inteligente para Google Places
 */
function buildSearchQuery(reserva: Reserva): string {
  const parts: string[] = [];

  // Nombre (siempre incluir si existe)
  if (reserva.nombre) {
    parts.push(reserva.nombre);
  }

  // Para accommodation y food: usar solo nombre + dirección
  // Para transport y activity: usar ubicacion + dirección
  if (reserva.categoria === 'accommodation' || reserva.categoria === 'food') {
    // Solo añadir dirección (nombre ya se agregó arriba)
    if (reserva.direccion) {
      parts.push(reserva.direccion);
    }
  } else if (reserva.categoria === 'activity') {
    // Para actividades: incluir ubicación Y dirección (más contexto = mejor matching)
    if (reserva.ubicacion) {
      parts.push(reserva.ubicacion);
    }
    if (reserva.direccion) {
      parts.push(reserva.direccion);
    }
  } else {
    // Para transporte y otras: priorizar ubicacion, sino direccion
    if (reserva.ubicacion) {
      parts.push(reserva.ubicacion);
    } else if (reserva.direccion) {
      parts.push(reserva.direccion);
    }
  }

  const query = parts.join(' ').trim();
  console.log('[PlaceMatching] Query construido:', query);
  return query;
}

/**
 * Calcula distancia entre dos coordenadas (fórmula de Haversine)
 * Retorna distancia en metros
 */
function calculateDistance(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula score de relevancia entre una reserva y un resultado de Google Places
 * Retorna score de 0-100
 */
function calculateRelevanceScore(reserva: Reserva, place: PlaceResult): ScoredPlace {
  let score = 0;
  const breakdown = {
    nameSimilarity: 0,
    distanceScore: 0,
    categoryMatch: 0,
    addressSimilarity: 0,
  };

  const hasCoordinates = !!(reserva.latitud && reserva.longitud);

  // 1. Similitud de nombre (peso: 40 puntos base, 50 si no hay coordenadas)
  const nameWeight = hasCoordinates ? 40 : 50;
  if (reserva.nombre && place.name) {
    const nameSim = combinedSimilarity(reserva.nombre, place.name);
    breakdown.nameSimilarity = nameSim * nameWeight;
    score += breakdown.nameSimilarity;
  }

  // 2. Distancia geográfica (30 puntos máx, solo si hay coordenadas)
  if (hasCoordinates && place.latitude && place.longitude) {
    const distance = calculateDistance(
      { lat: reserva.latitud!, lng: reserva.longitud! },
      { lat: place.latitude, lng: place.longitude }
    );

    // Menos de 50m = 30 puntos, disminuye linealmente hasta 1km
    if (distance < 50) {
      breakdown.distanceScore = 30;
    } else if (distance < 1000) {
      breakdown.distanceScore = 30 * (1 - distance / 1000);
    }
    score += breakdown.distanceScore;
  }

  // 3. Coincidencia de categoría (20 puntos máx)
  const expectedCategory = mapReservaCategoriaToLugarCategoria(reserva.categoria);
  const placeCategory = mapGoogleTypeToCategoria(place.types);
  if (expectedCategory === placeCategory) {
    breakdown.categoryMatch = 20;
    score += breakdown.categoryMatch;
  } else if (placeCategory !== 'other') {
    // Categoría relacionada pero no exacta: 10 puntos
    breakdown.categoryMatch = 10;
    score += breakdown.categoryMatch;
  }

  // 4. Similitud de dirección (peso: 10 base, 20 si no hay coordenadas)
  const addressWeight = hasCoordinates ? 10 : 20;
  if (reserva.direccion && place.address) {
    const addressSim = combinedSimilarity(reserva.direccion, place.address);
    breakdown.addressSimilarity = addressSim * addressWeight;
    score += breakdown.addressSimilarity;
  }

  // Normalizar score a escala 0-100
  const maxPossibleScore = hasCoordinates ? 100 : 90; // Sin coords: 50+20+20=90
  const normalizedScore = (score / maxPossibleScore) * 100;

  return {
    place,
    score: Math.min(100, Math.round(normalizedScore)),
    breakdown,
  };
}

/**
 * Busca lugar existente en BD local
 */
async function findExistingLugar(
  viajeId: string,
  googlePlaceId?: string,
  coords?: GeoCoordinates
): Promise<Lugar | null> {
  try {
    // 1. Buscar por Google Place ID (más confiable)
    if (googlePlaceId) {
      const lugarByPlaceId = await findLugarByGooglePlaceId(viajeId, googlePlaceId);
      if (lugarByPlaceId) {
        console.log('[PlaceMatching] Lugar encontrado por Google Place ID:', googlePlaceId);
        return lugarByPlaceId;
      }
    }

    // 2. Buscar por coordenadas cercanas (radio 50m)
    if (coords) {
      const lugaresNearby = await findLugaresNearCoordinates(
        viajeId,
        coords.lat,
        coords.lng,
        50 // 50 metros
      );

      if (lugaresNearby.length > 0) {
        console.log('[PlaceMatching] Lugar encontrado por proximidad:', lugaresNearby[0].nombre);
        return lugaresNearby[0]; // Retornar el más cercano
      }
    }

    return null;
  } catch (error) {
    console.error('[PlaceMatching] Error buscando lugar existente:', error);
    return null;
  }
}

/**
 * Crea un nuevo lugar a partir de un PlaceResult de Google Places
 */
async function createLugarFromPlaceResult(
  viajeId: string,
  placeResult: PlaceResult,
  categoria: CategoriaLugar,
  diaId?: string
): Promise<Lugar> {
  try {
    const input: CreateLugarInput = {
      viajeId,
      diaId,
      nombre: placeResult.name,
      descripcion: placeResult.description,
      categoria,
      direccion: placeResult.shortAddress || placeResult.address,
      latitud: placeResult.latitude,
      longitud: placeResult.longitude,
      googlePlaceId: placeResult.placeId,
    };

    const lugar = await createLugar(input);
    console.log('[PlaceMatching] Lugar creado desde Google Places:', lugar.nombre);

    return lugar;
  } catch (error) {
    console.error('[PlaceMatching] Error creando lugar:', error);
    throw error;
  }
}

// ============================================
// FUNCIÓN PRINCIPAL: FIND OR CREATE LUGAR
// ============================================

/**
 * Busca o crea un lugar automáticamente a partir de una reserva
 * Esta es la función principal del servicio
 */
export async function findOrCreateLugarFromReserva(
  reserva: Reserva,
  options: AutoPlaceCreationOptions = DEFAULT_AUTO_CREATION_OPTIONS
): Promise<PlaceMatchResult> {
  console.log('[PlaceMatching] Iniciando búsqueda para reserva:', reserva.nombre);

  // PASO 1: Validar que la reserva tenga suficiente información
  // Para accommodation y food: requiere nombre + dirección
  // Para transport y activity: requiere ubicacion o dirección o coordenadas
  const hasLocationInfo =
    (reserva.categoria === 'accommodation' || reserva.categoria === 'food')
      ? reserva.nombre && reserva.direccion
      : reserva.ubicacion || reserva.direccion || (reserva.latitud && reserva.longitud);

  if (!hasLocationInfo) {
    console.log('[PlaceMatching] Reserva sin información de ubicación suficiente, omitiendo matching');
    return {
      type: 'none',
      confidence: 0,
      message: 'La reserva no tiene información de ubicación suficiente',
    };
  }

  // PASO 2: Buscar lugar existente en BD local
  const coords =
    reserva.latitud && reserva.longitud
      ? { lat: reserva.latitud, lng: reserva.longitud }
      : undefined;

  const existingLugar = await findExistingLugar(reserva.viajeId, undefined, coords);

  if (existingLugar) {
    console.log('[PlaceMatching] Lugar existente encontrado:', existingLugar.nombre);
    return {
      type: 'exact',
      lugar: existingLugar,
      confidence: 100,
      message: `Lugar "${existingLugar.nombre}" ya existe en tu viaje`,
    };
  }

  // PASO 3: Buscar en Google Places API
  const query = buildSearchQuery(reserva);
  console.log('[PlaceMatching] Buscando en Google Places:', query);

  const placeResults = await searchPlacesByText(query, {
    latitude: reserva.latitud,
    longitude: reserva.longitud,
    maxResults: 5,
  });

  if (placeResults.length === 0) {
    console.log('[PlaceMatching] No se encontraron resultados en Google Places');
    return {
      type: 'none',
      confidence: 0,
      message: 'No se encontraron lugares en Google Places',
    };
  }

  // PASO 4: Scoring de resultados
  const scoredResults = placeResults
    .map((place) => calculateRelevanceScore(reserva, place))
    .sort((a, b) => b.score - a.score);

  console.log('[PlaceMatching] Mejores resultados:', scoredResults.slice(0, 3).map(s => ({
    nombre: s.place.name,
    score: s.score,
  })));

  const bestMatch = scoredResults[0];

  // PASO 5: Decisión automática vs manual según umbral de confianza
  if (bestMatch.score >= options.threshold) {
    // Alta confianza: crear automáticamente
    console.log('[PlaceMatching] Alta confianza, creando lugar automáticamente');

    const categoria = mapReservaCategoriaToLugarCategoria(reserva.categoria);
    const lugar = await createLugarFromPlaceResult(
      reserva.viajeId,
      bestMatch.place,
      categoria,
      reserva.diaId
    );

    return {
      type: 'exact',
      lugar,
      confidence: bestMatch.score,
      message: `Lugar "${lugar.nombre}" añadido automáticamente al mapa`,
    };
  } else if (scoredResults.length === 1 && bestMatch.score >= 60) {
    // Confianza media y única opción: sugerir
    console.log('[PlaceMatching] Confianza media, sugiriendo único resultado');
    return {
      type: 'suggested',
      suggestions: [bestMatch.place],
      confidence: bestMatch.score,
      message: `¿Es "${bestMatch.place.name}" el lugar correcto?`,
    };
  } else if (scoredResults.length > 1 && bestMatch.score >= 50) {
    // Múltiples opciones razonables: pedir selección
    console.log('[PlaceMatching] Múltiples opciones, requiere selección manual');
    return {
      type: 'multiple',
      suggestions: scoredResults.slice(0, 3).map((s) => s.place),
      confidence: bestMatch.score,
      message: 'Selecciona el lugar correcto',
    };
  } else {
    // Confianza muy baja: no sugerir nada
    console.log('[PlaceMatching] Confianza muy baja, no se sugiere nada');
    return {
      type: 'none',
      confidence: bestMatch.score,
      message: 'No se encontró un lugar con suficiente confianza',
    };
  }
}

// ============================================
// VINCULACIÓN RESERVA ↔ LUGAR
// ============================================

/**
 * Vincula una reserva con un lugar existente
 */
export async function linkReservaToLugar(
  reservaId: string,
  lugarId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE reservas SET lugarId = ?, updatedAt = ? WHERE id = ?',
      [lugarId, timestamp, reservaId]
    );

    console.log('[PlaceMatching] Reserva vinculada a lugar:', { reservaId, lugarId });
    return true;
  } catch (error) {
    console.error('[PlaceMatching] Error vinculando reserva a lugar:', error);
    return false;
  }
}

/**
 * Desvincula una reserva de un lugar
 */
export async function unlinkReservaFromLugar(reservaId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const timestamp = getCurrentTimestamp();

    await db.runAsync(
      'UPDATE reservas SET lugarId = NULL, updatedAt = ? WHERE id = ?',
      [timestamp, reservaId]
    );

    console.log('[PlaceMatching] Reserva desvinculada de lugar:', reservaId);
    return true;
  } catch (error) {
    console.error('[PlaceMatching] Error desvinculando reserva:', error);
    return false;
  }
}

/**
 * Confirma y crea un lugar desde una sugerencia de Google Places
 */
export async function confirmPlaceSuggestion(
  reservaId: string,
  viajeId: string,
  diaId: string | undefined,
  placeResult: PlaceResult,
  categoria: CategoriaLugar
): Promise<Lugar | null> {
  try {
    // Verificar si el lugar ya existe por Google Place ID
    const existingLugar = await findLugarByGooglePlaceId(viajeId, placeResult.placeId);

    if (existingLugar) {
      console.log('[PlaceMatching] Lugar ya existe, vinculando directamente');
      await linkReservaToLugar(reservaId, existingLugar.id);
      return existingLugar;
    }

    // Crear nuevo lugar
    const lugar = await createLugarFromPlaceResult(viajeId, placeResult, categoria, diaId);

    // Vincular reserva con el nuevo lugar
    await linkReservaToLugar(reservaId, lugar.id);

    console.log('[PlaceMatching] Lugar confirmado y creado:', lugar.nombre);
    return lugar;
  } catch (error) {
    console.error('[PlaceMatching] Error confirmando sugerencia:', error);
    return null;
  }
}
