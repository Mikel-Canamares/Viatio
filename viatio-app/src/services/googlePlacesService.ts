import { GooglePlace, PlaceResult, mapPriceLevel } from '@/types/googlePlaces';
import { logError } from '@/utils/errorHandler';
import { getDeviceLanguageCode } from '@/utils/localization';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

// ============================================
// FIELD MASKS - Qué campos pedir a la API
// ============================================

const FIELD_MASK_BASIC = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
].join(',');

const FIELD_MASK_DETAILS = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'photos',
  'currentOpeningHours',
  'regularOpeningHours',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'editorialSummary',
].join(',');

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

function googlePlaceToResult(place: GooglePlace): PlaceResult {
  return {
    placeId: place.id,
    name: place.displayName?.text || 'Sin nombre',
    address: place.formattedAddress || '',
    shortAddress: place.shortFormattedAddress,
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    rating: place.rating,
    totalRatings: place.userRatingCount,
    priceLevel: mapPriceLevel(place.priceLevel),
    types: place.types || [],
    primaryType: place.primaryType,
    primaryTypeLabel: place.primaryTypeDisplayName?.text,
    photoReference: place.photos?.[0]?.name,
    isOpen: place.currentOpeningHours?.openNow,
    openingHours: place.currentOpeningHours?.weekdayDescriptions,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
    website: place.websiteUri,
    googleMapsUrl: place.googleMapsUri,
    description: place.editorialSummary?.text,
  };
}

// ============================================
// FUNCIÓN PARA OBTENER URL DE FOTO
// ============================================

export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!photoReference || !API_KEY) return '';
  // photoReference tiene formato: places/{placeId}/photos/{photoRef}
  return `${BASE_URL}/${photoReference}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

// ============================================
// BUSCAR LUGARES POR TEXTO
// ============================================

export async function searchPlacesByText(
  query: string,
  options?: {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    maxResults?: number;
  }
): Promise<PlaceResult[]> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return [];
    }

    console.log('[Places] Buscando:', query);

    const languageCode = getDeviceLanguageCode();

    const body: any = {
      textQuery: query,
      languageCode: languageCode,
      maxResultCount: options?.maxResults || 10,
    };

    // Añadir bias de ubicación si se proporciona
    if (options?.latitude && options?.longitude) {
      body.locationBias = {
        circle: {
          center: {
            latitude: options.latitude,
            longitude: options.longitude,
          },
          radius: options.radiusMeters || 10000,
        },
      };
    }

    const response = await fetch(`${BASE_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK_BASIC,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places] Error en searchText:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[Places] Resultados:', data.places?.length || 0);

    return (data.places || []).map(googlePlaceToResult);
  } catch (error) {
    logError(error, 'googlePlacesService.searchPlacesByText');
    return [];
  }
}

// ============================================
// BUSCAR LUGARES CERCANOS
// ============================================

export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusMeters: number = 500,
  maxResults: number = 20
): Promise<PlaceResult[]> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return [];
    }

    console.log('[Places] Buscando cerca de:', latitude, longitude);

    const languageCode = getDeviceLanguageCode();

    const response = await fetch(`${BASE_URL}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK_BASIC,
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radiusMeters,
          },
        },
        maxResultCount: maxResults,
        languageCode: languageCode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places] Error en searchNearby:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[Places] Lugares cercanos:', data.places?.length || 0);

    return (data.places || []).map(googlePlaceToResult);
  } catch (error) {
    logError(error, 'googlePlacesService.searchNearbyPlaces');
    return [];
  }
}

// ============================================
// OBTENER DETALLES DE UN LUGAR POR ID
// ============================================

export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return null;
    }

    console.log('[Places] Obteniendo detalles de:', placeId);

    const languageCode = getDeviceLanguageCode();

    const response = await fetch(`${BASE_URL}/places/${placeId}?languageCode=${languageCode}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK_DETAILS,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places] Error en getPlaceDetails:', response.status, errorText);
      return null;
    }

    const place: GooglePlace = await response.json();
    console.log('[Places] Detalles obtenidos:', place.displayName?.text);

    return googlePlaceToResult(place);
  } catch (error) {
    logError(error, 'googlePlacesService.getPlaceDetails');
    return null;
  }
}

// ============================================
// OBTENER LUGAR EN COORDENADAS (REVERSE GEOCODING CON PLACES)
// ============================================

export async function getPlaceAtCoordinates(
  latitude: number,
  longitude: number
): Promise<PlaceResult | null> {
  try {
    // Buscar lugares muy cerca de las coordenadas
    const places = await searchNearbyPlaces(latitude, longitude, 50, 1);
    return places[0] || null;
  } catch (error) {
    logError(error, 'googlePlacesService.getPlaceAtCoordinates');
    return null;
  }
}

// ============================================
// AUTOCOMPLETADO DE LUGARES (SOLO CIUDADES Y PAÍSES)
// ============================================

export interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export async function autocompleteDestinations(
  input: string
): Promise<AutocompleteSuggestion[]> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return [];
    }

    // No buscar si el input es muy corto
    if (!input || input.trim().length < 2) {
      return [];
    }

    console.log('[Places] Autocompletando:', input);

    const languageCode = getDeviceLanguageCode();

    const response = await fetch(`${BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        languageCode: languageCode,
        // Filtrar solo ciudades y regiones/países
        includedPrimaryTypes: ['locality', 'administrative_area_level_1', 'country'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places] Error en autocomplete:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[Places] Sugerencias:', data.suggestions?.length || 0);

    if (!data.suggestions || data.suggestions.length === 0) {
      return [];
    }

    // Convertir sugerencias al formato deseado
    return data.suggestions.map((suggestion: any) => ({
      placeId: suggestion.placePrediction?.placeId || '',
      description: suggestion.placePrediction?.text?.text || '',
      mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
      secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
      types: suggestion.placePrediction?.types || [],
    }));
  } catch (error) {
    logError(error, 'googlePlacesService.autocompleteDestinations');
    return [];
  }
}
