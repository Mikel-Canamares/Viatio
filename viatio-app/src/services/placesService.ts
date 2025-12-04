/**
 * SERVICE: PLACES
 *
 * Servicio para buscar lugares cercanos y obtener detalles usando Google Places API (New).
 * Permite buscar puntos de interés cuando el usuario toca el mapa.
 *
 * IMPORTANTE: Requiere Places API (New) habilitada en Google Cloud Console.
 * Documentación: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import Constants from 'expo-constants';

// Places API (New) endpoints
const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ============================================
// TYPES
// ============================================

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingCount?: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    openNow: boolean;
    weekdayText: string[];
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Busca lugares cercanos a una coordenada específica usando Places API (New)
 *
 * @param lat - Latitud
 * @param lng - Longitud
 * @param radius - Radio de búsqueda en metros (default: 50m)
 * @returns Lugar más cercano encontrado, o null si no hay ninguno
 */
export async function searchNearbyPlace(
  lat: number,
  lng: number,
  radius: number = 50
): Promise<PlaceSearchResult | null> {
  try {
    if (!API_KEY) {
      console.error('[placesService] Google Maps API key not found');
      return null;
    }

    const response = await fetch(PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: radius,
          },
        },
        maxResultCount: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[placesService] API error:', response.status, data);
      return null;
    }

    // Si no hay resultados, retornar null
    if (!data.places || data.places.length === 0) {
      return null;
    }

    // Retornar el primer resultado (el más cercano)
    const place = data.places[0];

    return {
      placeId: place.id,
      name: place.displayName?.text || place.name || '',
      formattedAddress: place.formattedAddress || '',
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude,
      },
      types: place.types || [],
      rating: place.rating,
      userRatingCount: place.userRatingCount,
    };
  } catch (error) {
    console.error('[placesService] Error searching nearby place:', error);
    return null;
  }
}

/**
 * Obtiene los detalles completos de un lugar usando su Place ID (Places API New)
 *
 * @param placeId - ID del lugar de Google Places
 * @returns Detalles completos del lugar, o null si hay error
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    if (!API_KEY) {
      console.error('[placesService] Google Maps API key not found');
      return null;
    }

    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'types',
      'rating',
      'userRatingCount',
      'internationalPhoneNumber',
      'websiteUri',
      'currentOpeningHours',
      'photos',
    ].join(',');

    const response = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[placesService] API error:', response.status, data);
      return null;
    }

    return {
      placeId: data.id,
      name: data.displayName?.text || data.name || '',
      formattedAddress: data.formattedAddress || '',
      location: {
        lat: data.location.latitude,
        lng: data.location.longitude,
      },
      types: data.types || [],
      rating: data.rating,
      userRatingsTotal: data.userRatingCount,
      phoneNumber: data.internationalPhoneNumber,
      website: data.websiteUri,
      openingHours: data.currentOpeningHours
        ? {
            openNow: data.currentOpeningHours.openNow || false,
            weekdayText: data.currentOpeningHours.weekdayDescriptions || [],
          }
        : undefined,
      photos: data.photos
        ? data.photos.slice(0, 5).map((photo: any) => ({
            name: photo.name,
            widthPx: photo.widthPx,
            heightPx: photo.heightPx,
          }))
        : undefined,
    };
  } catch (error) {
    console.error('[placesService] Error fetching place details:', error);
    return null;
  }
}

/**
 * Obtiene la URL de una foto de Google Places (New API)
 *
 * @param photoName - Nombre de la foto obtenida de Place Details (formato: places/PLACE_ID/photos/PHOTO_ID)
 * @param maxWidth - Ancho máximo de la imagen (default: 400)
 * @returns URL de la foto
 */
export function getPlacePhotoUrl(photoName: string, maxWidth: number = 400): string {
  if (!API_KEY) {
    console.error('[placesService] Google Maps API key not found');
    return '';
  }

  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

/**
 * Mapea los tipos de Google Places a nuestras categorías de lugares
 *
 * @param types - Array de tipos de Google Places
 * @returns Categoría de lugar de nuestra app
 */
export function mapPlaceTypesToCategory(types: string[]): string {
  // Mapeo de tipos de Google a nuestras categorías
  const categoryMap: Record<string, string> = {
    restaurant: 'restaurant',
    food: 'restaurant',
    cafe: 'restaurant',
    bar: 'restaurant',
    meal_takeaway: 'restaurant',
    meal_delivery: 'restaurant',
    bakery: 'restaurant',
    lodging: 'hotel',
    hotel: 'hotel',
    tourist_attraction: 'attraction',
    museum: 'attraction',
    amusement_park: 'attraction',
    art_gallery: 'attraction',
    aquarium: 'attraction',
    zoo: 'attraction',
    park: 'attraction',
    shopping_mall: 'shopping',
    store: 'shopping',
    clothing_store: 'shopping',
    department_store: 'shopping',
    supermarket: 'shopping',
    airport: 'transport',
    bus_station: 'transport',
    train_station: 'transport',
    subway_station: 'transport',
    transit_station: 'transport',
    taxi_stand: 'transport',
  };

  // Buscar el primer tipo que coincida con nuestro mapeo
  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  // Si no coincide ninguno, retornar 'other'
  return 'other';
}
