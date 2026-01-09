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
 * Palabras genéricas a filtrar del nombre de reservas de transporte
 */
const TRANSPORT_GENERIC_WORDS = [
  'tren',
  'train',
  'vuelo',
  'flight',
  'avión',
  'plane',
  'autobús',
  'bus',
  'autocar',
  'coach',
  'ferry',
  'barco',
  'boat',
  'taxi',
  'uber',
  'cabify',
  'metro',
  'subway',
];

/**
 * Limpia el nombre de una reserva de transporte eliminando palabras genéricas
 */
function cleanTransportName(nombre: string): string {
  const words = nombre.toLowerCase().split(/\s+/);
  const filtered = words.filter(
    (word) => !TRANSPORT_GENERIC_WORDS.includes(word.toLowerCase())
  );
  return filtered.join(' ').trim();
}

/**
 * Obtiene el tipo de lugar según la categoría de la reserva
 */
function getPlaceTypeHint(categoria: string, nombre?: string): string {
  if (categoria === 'transport') {
    const nombreLower = nombre?.toLowerCase() || '';
    if (nombreLower.includes('tren') || nombreLower.includes('train')) {
      return 'train station';
    }
    if (nombreLower.includes('vuelo') || nombreLower.includes('flight') || nombreLower.includes('avión')) {
      return 'airport';
    }
    if (nombreLower.includes('autobús') || nombreLower.includes('bus')) {
      return 'bus station';
    }
    if (nombreLower.includes('ferry') || nombreLower.includes('barco')) {
      return 'ferry terminal';
    }
    return 'transit station';
  }
  return '';
}

/**
 * Construye query de búsqueda inteligente para Google Places
 */
function buildSearchQuery(reserva: Reserva): string {
  const parts: string[] = [];

  // TRANSPORTE: Estrategia especial
  if (reserva.categoria === 'transport') {
    // 1. Priorizar ubicación (estación/aeropuerto)
    if (reserva.ubicacion) {
      parts.push(reserva.ubicacion);

      // 2. Añadir tipo de lugar para mejorar precisión
      const placeType = getPlaceTypeHint(reserva.categoria, reserva.nombre);
      if (placeType) {
        parts.push(placeType);
      }
    } else if (reserva.nombre) {
      // Si no hay ubicación, limpiar el nombre y buscar por él
      const cleanedName = cleanTransportName(reserva.nombre);
      if (cleanedName) {
        parts.push(cleanedName);
      }

      const placeType = getPlaceTypeHint(reserva.categoria, reserva.nombre);
      if (placeType) {
        parts.push(placeType);
      }
    }

    // 3. Añadir dirección si existe y no tenemos ubicación
    if (!reserva.ubicacion && reserva.direccion) {
      parts.push(reserva.direccion);
    }
  }
  // ACCOMMODATION y FOOD: usar nombre + dirección
  else if (reserva.categoria === 'accommodation' || reserva.categoria === 'food') {
    if (reserva.nombre) {
      parts.push(reserva.nombre);
    }
    if (reserva.direccion) {
      parts.push(reserva.direccion);
    }
  }
  // ACTIVITY: incluir todo el contexto
  else if (reserva.categoria === 'activity') {
    if (reserva.nombre) {
      parts.push(reserva.nombre);
    }
    if (reserva.ubicacion) {
      parts.push(reserva.ubicacion);
    }
    if (reserva.direccion) {
      parts.push(reserva.direccion);
    }
  }
  // OTRAS: usar lo que esté disponible
  else {
    if (reserva.nombre) {
      parts.push(reserva.nombre);
    }
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

  // PASO 3: Buscar en Google Places API con estrategia de fallbacks
  let placeResults: PlaceResult[] = [];

  // BÚSQUEDA 1: Query principal
  const primaryQuery = buildSearchQuery(reserva);
  console.log('[PlaceMatching] Búsqueda primaria en Google Places:', primaryQuery);

  placeResults = await searchPlacesByText(primaryQuery, {
    latitude: reserva.latitud,
    longitude: reserva.longitud,
    maxResults: 5,
  });

  // FALLBACK: Si es transporte y no hay resultados o son pocos, intentar búsqueda alternativa
  if (reserva.categoria === 'transport' && placeResults.length < 3) {
    console.log('[PlaceMatching] Pocos resultados para transporte, intentando búsqueda alternativa');

    // Crear queries alternativos
    const alternativeQueries: string[] = [];

    // Opción 1: Solo ubicación sin tipo
    if (reserva.ubicacion) {
      alternativeQueries.push(reserva.ubicacion);
    }

    // Opción 2: Solo nombre limpio
    if (reserva.nombre) {
      const cleanedName = cleanTransportName(reserva.nombre);
      if (cleanedName && !alternativeQueries.includes(cleanedName)) {
        alternativeQueries.push(cleanedName);
      }
    }

    // Opción 3: Dirección sola si existe
    if (reserva.direccion && !alternativeQueries.includes(reserva.direccion)) {
      alternativeQueries.push(reserva.direccion);
    }

    // Probar cada query alternativo
    for (const altQuery of alternativeQueries) {
      if (!altQuery) continue;

      console.log('[PlaceMatching] Intentando búsqueda alternativa:', altQuery);

      const altResults = await searchPlacesByText(altQuery, {
        latitude: reserva.latitud,
        longitude: reserva.longitud,
        maxResults: 5,
      });

      // Si encontramos mejores resultados, usarlos
      if (altResults.length > placeResults.length) {
        console.log('[PlaceMatching] Búsqueda alternativa encontró más resultados:', altResults.length);
        placeResults = altResults;
        break; // Usamos los primeros mejores resultados
      }
    }
  }

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
  } else if (scoredResults.length === 1 && bestMatch.score >= 45) {
    // Confianza media y única opción: sugerir (threshold reducido de 60 a 45)
    console.log('[PlaceMatching] Confianza media, sugiriendo único resultado');
    return {
      type: 'suggested',
      suggestions: [bestMatch.place],
      confidence: bestMatch.score,
      message: `¿Es "${bestMatch.place.name}" el lugar correcto?`,
    };
  } else if (scoredResults.length > 1 && bestMatch.score >= 40) {
    // Múltiples opciones razonables: pedir selección (threshold reducido de 50 a 40)
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

    // Sincronizar a Firestore si el viaje es compartido
    try {
      const reserva = await db.getFirstAsync<any>(
        'SELECT r.*, v.firestoreId as viajeFirestoreId, v.isShared FROM reservas r JOIN viajes v ON r.viajeId = v.id WHERE r.id = ?',
        [reservaId]
      );

      if (reserva && reserva.isShared === 1 && reserva.viajeFirestoreId) {
        const { syncReservaIfShared } = require('./sync/syncUpload');
        await syncReservaIfShared({ ...reserva, lugarId });
        console.log('[PlaceMatching] Vinculación sincronizada a Firestore');
      }
    } catch (syncError) {
      console.warn('[PlaceMatching] No se pudo sincronizar vinculación a Firestore:', syncError);
      // No fallar si la sincronización falla, la actualización local ya está hecha
    }

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

// ============================================
// EVENTOS PERSONALIZADOS - PLACE MATCHING
// ============================================

/**
 * Interfaz para eventos personalizados (similar a Reserva)
 */
interface EventoForMatching {
  id: string;
  viajeId: string;
  diaId?: string;
  nombre: string;
  ubicacion?: string;
  categoria: string;
  latitud?: number;
  longitud?: number;
}

/**
 * Busca lugares automáticamente para un evento personalizado
 * Similar a searchPlacesForReservation pero adaptado para eventos
 */
export async function searchPlacesForEvento(
  evento: EventoForMatching,
  options: AutoPlaceCreationOptions = DEFAULT_AUTO_CREATION_OPTIONS
): Promise<PlaceMatchResult> {
  console.log('[PlaceMatching Evento] Iniciando búsqueda para evento:', evento.nombre);

  // PASO 1: Validar que tengamos información suficiente
  if (!evento.nombre && !evento.ubicacion) {
    console.log('[PlaceMatching Evento] Sin nombre ni ubicación, no se puede buscar');
    return {
      type: 'none',
      confidence: 0,
      message: 'No hay información suficiente para buscar el lugar',
    };
  }

  // PASO 2: Verificar si ya existe lugar con googlePlaceId (si aplica)
  // Los eventos no tienen googlePlaceId directo, solo pueden tener ubicación

  // PASO 3: Construir query de búsqueda inteligente
  const parts: string[] = [];

  // Para eventos, priorizar: nombre + ubicación
  if (evento.nombre) {
    parts.push(evento.nombre);
  }

  if (evento.ubicacion) {
    parts.push(evento.ubicacion);
  }

  const searchQuery = parts.join(' ').trim();

  if (!searchQuery) {
    return {
      type: 'none',
      confidence: 0,
      message: 'No hay información suficiente para buscar el lugar',
    };
  }

  console.log('[PlaceMatching Evento] Query de búsqueda:', searchQuery);

  // Buscar en Google Places
  const placeResults = await searchPlacesByText(searchQuery, {
    latitude: evento.latitud,
    longitude: evento.longitud,
    maxResults: 5,
  });

  if (placeResults.length === 0) {
    console.log('[PlaceMatching Evento] No se encontraron resultados en Google Places');
    return {
      type: 'none',
      confidence: 0,
      message: 'No se encontraron lugares en Google Places',
    };
  }

  // PASO 4: Scoring de resultados (usamos una versión simplificada)
  const scoredResults = placeResults.map((place) => {
    let score = 0;

    // Similitud de nombre (peso: 70)
    if (evento.nombre && place.name) {
      const nameSim = combinedSimilarity(evento.nombre, place.name);
      score += nameSim * 70;
    }

    // Distancia si hay coordenadas (peso: 30)
    if (evento.latitud && evento.longitud && place.latitude && place.longitude) {
      const distance = calculateDistance(
        { lat: evento.latitud, lng: evento.longitud },
        { lat: place.latitude, lng: place.longitude }
      );

      if (distance < 50) {
        score += 30;
      } else if (distance < 1000) {
        score += 30 * (1 - distance / 1000);
      }
    }

    return { place, score, breakdown: {} } as ScoredPlace;
  }).sort((a, b) => b.score - a.score);

  console.log('[PlaceMatching Evento] Mejores resultados:', scoredResults.slice(0, 3).map(s => ({
    nombre: s.place.name,
    score: s.score,
  })));

  const bestMatch = scoredResults[0];

  // PASO 5: Decisión según umbral de confianza
  // Para eventos personalizados usamos umbrales más bajos que para reservas
  if (bestMatch.score >= options.threshold) {
    // Alta confianza: crear automáticamente
    console.log('[PlaceMatching Evento] Alta confianza, creando lugar automáticamente');

    // Mapear categoría de evento a categoría de lugar
    const categoria = mapEventoCategoriaToLugarCategoria(evento.categoria);

    const lugar = await createLugarFromPlaceResult(
      evento.viajeId,
      bestMatch.place,
      categoria,
      evento.diaId
    );

    return {
      type: 'exact',
      lugar,
      confidence: bestMatch.score,
      message: `Lugar "${lugar.nombre}" añadido automáticamente al mapa`,
    };
  } else if (scoredResults.length === 1 && bestMatch.score >= 30) {
    // Confianza media: sugerir (umbral reducido para eventos: 30 vs 60 en reservas)
    console.log('[PlaceMatching Evento] Confianza media, sugiriendo resultado');
    return {
      type: 'suggested',
      suggestions: [bestMatch.place],
      confidence: bestMatch.score,
      message: `¿Es "${bestMatch.place.name}" el lugar correcto?`,
    };
  } else if (scoredResults.length > 1 && bestMatch.score >= 25) {
    // Múltiples opciones: pedir selección (umbral reducido para eventos: 25 vs 50 en reservas)
    console.log('[PlaceMatching Evento] Múltiples opciones, requiere selección manual');
    return {
      type: 'multiple',
      suggestions: scoredResults.slice(0, 3).map((s) => s.place),
      confidence: bestMatch.score,
      message: 'Selecciona el lugar correcto',
    };
  } else {
    // Confianza muy baja
    console.log('[PlaceMatching Evento] Confianza muy baja, no se sugiere nada');
    return {
      type: 'none',
      confidence: bestMatch.score,
      message: 'No se encontró un lugar con suficiente confianza',
    };
  }
}

/**
 * Mapea categoría de evento a categoría de lugar
 * Categorías válidas: 'restaurant' | 'hotel' | 'attraction' | 'shopping' | 'transport' | 'other'
 */
export function mapEventoCategoriaToLugarCategoria(
  eventoCategoria: string
): CategoriaLugar {
  const mapping: Record<string, CategoriaLugar> = {
    sightseeing: 'attraction',
    culture: 'attraction',
    food: 'restaurant',
    shopping: 'shopping',
    entertainment: 'attraction', // Entretenimiento → atracción
    nature: 'attraction', // Naturaleza/parques → atracción
    transport: 'transport',
    nightlife: 'restaurant', // Vida nocturna → restaurante (bares/pubs)
    sports: 'attraction',
    other: 'other',
  };

  return mapping[eventoCategoria] || 'other';
}
