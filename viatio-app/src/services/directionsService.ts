/**
 * SERVICE: DIRECTIONS
 *
 * Servicio para obtener rutas y direcciones entre lugares usando Google Directions API.
 * Permite calcular distancias, duraciones y obtener polylines para dibujar rutas en el mapa.
 *
 * IMPORTANTE: Requiere Google Directions API habilitada en Google Cloud Console.
 */

import Constants from 'expo-constants';

const DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ============================================
// TYPES
// ============================================

export interface DirectionsResult {
  /** Distancia total formateada (ej: "2.5 km") */
  distance: string;
  /** Duración total formateada (ej: "15 mins") */
  duration: string;
  /** Polyline codificada de Google para dibujar la ruta */
  polyline: string;
  /** Pasos detallados de la ruta */
  steps: Array<{
    instruction: string;
    distance: string;
    duration: string;
  }>;
  /** Distancia en metros */
  distanceValue: number;
  /** Duración en segundos */
  durationValue: number;
}

export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

interface Coordinate {
  lat: number;
  lng: number;
}

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Obtiene direcciones entre dos puntos usando Google Directions API
 *
 * @param origin - Coordenadas de origen
 * @param destination - Coordenadas de destino
 * @param mode - Modo de viaje (driving, walking, transit, bicycling)
 * @returns Resultado con ruta, distancia y duración, o null si hay error
 *
 * @example
 * const result = await getDirections(
 *   { lat: 40.4168, lng: -3.7038 }, // Madrid
 *   { lat: 41.3851, lng: 2.1734 },  // Barcelona
 *   'driving'
 * );
 */
export async function getDirections(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode = 'driving'
): Promise<DirectionsResult | null> {
  try {
    if (!API_KEY) {
      console.error('[directionsService] Google Maps API key not found');
      return null;
    }

    const url = `${DIRECTIONS_API_URL}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[directionsService] API error:', data.status, data.error_message);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.error('[directionsService] No routes found');
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Parsear pasos de la ruta
    const steps = leg.steps.map((step: any) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Eliminar tags HTML
      distance: step.distance.text,
      duration: step.duration.text,
    }));

    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      polyline: route.overview_polyline.points,
      steps,
      distanceValue: leg.distance.value,
      durationValue: leg.duration.value,
    };
  } catch (error) {
    console.error('[directionsService] Error fetching directions:', error);
    return null;
  }
}

/**
 * Obtiene direcciones entre múltiples puntos (ruta optimizada)
 *
 * @param waypoints - Array de coordenadas en orden
 * @param mode - Modo de viaje
 * @param optimize - Si true, Google optimizará el orden de los waypoints
 * @returns Resultado con ruta completa o null si hay error
 */
export async function getMultipleDirections(
  waypoints: Coordinate[],
  mode: TravelMode = 'driving',
  optimize: boolean = false
): Promise<DirectionsResult | null> {
  try {
    if (!API_KEY) {
      console.error('[directionsService] Google Maps API key not found');
      return null;
    }

    if (waypoints.length < 2) {
      console.error('[directionsService] At least 2 waypoints required');
      return null;
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    let waypointsParam = '';
    if (intermediateWaypoints.length > 0) {
      const waypointsStr = intermediateWaypoints
        .map((wp) => `${wp.lat},${wp.lng}`)
        .join('|');
      waypointsParam = `&waypoints=${optimize ? 'optimize:true|' : ''}${waypointsStr}`;
    }

    const url = `${DIRECTIONS_API_URL}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}&mode=${mode}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[directionsService] API error:', data.status, data.error_message);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.error('[directionsService] No routes found');
      return null;
    }

    const route = data.routes[0];

    // Combinar todas las legs en una sola ruta
    let totalDistance = 0;
    let totalDuration = 0;
    const allSteps: Array<{
      instruction: string;
      distance: string;
      duration: string;
    }> = [];

    route.legs.forEach((leg: any) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;

      leg.steps.forEach((step: any) => {
        allSteps.push({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
        });
      });
    });

    return {
      distance: formatDistance(totalDistance),
      duration: formatDuration(totalDuration),
      polyline: route.overview_polyline.points,
      steps: allSteps,
      distanceValue: totalDistance,
      durationValue: totalDuration,
    };
  } catch (error) {
    console.error('[directionsService] Error fetching multiple directions:', error);
    return null;
  }
}

// ============================================
// POLYLINE DECODING
// ============================================

/**
 * Decodifica una polyline codificada de Google Maps a un array de coordenadas
 *
 * Implementación del algoritmo de Google para decodificar polylines:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * @param encoded - String de polyline codificada
 * @returns Array de coordenadas para usar en react-native-maps
 *
 * @example
 * const polyline = "u{~vFvyys@...";
 * const coordinates = decodePolyline(polyline);
 * // [{ latitude: 40.4168, longitude: -3.7038 }, ...]
 */
export function decodePolyline(encoded: string): MapCoordinate[] {
  const coordinates: MapCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decodificar latitud
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decodificar longitud
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Formatea una distancia en metros a un string legible
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formatea una duración en segundos a un string legible
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seg`;
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours} h ${mins} min`;
}

/**
 * Calcula la distancia en línea recta entre dos puntos (Haversine formula)
 * Útil para estimaciones rápidas sin llamar a la API
 *
 * @param coord1 - Primera coordenada
 * @param coord2 - Segunda coordenada
 * @returns Distancia en metros
 */
export function calculateStraightDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convierte coordenadas de MapCoordinate a Coordinate (y viceversa)
 */
export function toCoordinate(coord: MapCoordinate): Coordinate {
  return { lat: coord.latitude, lng: coord.longitude };
}

export function toMapCoordinate(coord: Coordinate): MapCoordinate {
  return { latitude: coord.lat, longitude: coord.lng };
}
