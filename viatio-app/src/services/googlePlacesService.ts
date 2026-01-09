import { GooglePlace, PlaceResult, mapPriceLevel, PlaceDetailLevel } from '@/types/googlePlaces';
import { logError } from '@/utils/errorHandler';
import { getDeviceLanguageCode } from '@/utils/localization';
import { generateCacheKey, getCached, setCached } from '@/utils/placesCache';
import { withRateLimit } from '@/utils/placesRateLimiter';
import { logPlacesRequest } from '@/utils/placesCostLogger';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

// ============================================
// FIELD MASKS OPTIMIZADOS POR TIER
// ============================================

// Tier: Essentials (~€5 per 1000) - Solo campos básicos
const FIELD_MASK_ESSENTIALS = [
  'places.id',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.photos',
].join(',');

// Tier: Pro (~€10 per 1000) - Añade displayName, primaryType, googleMapsUri
const FIELD_MASK_PRO = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
  'places.googleMapsUri',
].join(',');

// Tier: Enterprise Basic (~€35 per 1000) - Añade rating, priceLevel, openingHours
const FIELD_MASK_ENTERPRISE_BASIC = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
  'places.googleMapsUri',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.currentOpeningHours',
].join(',');

// Tier: Enterprise Full (~€60 per 1000) - Añade phone, website (SIN editorialSummary)
const FIELD_MASK_ENTERPRISE_FULL = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
  'places.googleMapsUri',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.currentOpeningHours',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
].join(',');

// Para Place Details (sin prefijo places.)
const FIELD_MASK_DETAILS_PRO = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'photos',
  'googleMapsUri',
].join(',');

const FIELD_MASK_DETAILS_ENTERPRISE_BASIC = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'photos',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'priceLevel',
  'currentOpeningHours',
].join(',');

const FIELD_MASK_DETAILS_ENTERPRISE_FULL = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'photos',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'priceLevel',
  'currentOpeningHours',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
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
    photoReferences: place.photos?.map(photo => photo.name) || [],
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

    // Reducir resultados máximos de 10 a 5 (ahorro de costes)
    const maxResults = options?.maxResults || 5;

    const params = {
      query,
      latitude: options?.latitude,
      longitude: options?.longitude,
      radiusMeters: options?.radiusMeters,
      maxResults,
      languageCode,
    };

    // Generar cache key
    const cacheKey = generateCacheKey('searchText', params, FIELD_MASK_PRO);

    // Verificar cache
    const cached = await getCached<PlaceResult[]>(cacheKey);
    if (cached) {
      await logPlacesRequest('searchText', FIELD_MASK_PRO, true);
      return cached;
    }

    // No hay cache, hacer request con rate limiting
    const results = await withRateLimit('searchText', async () => {
      const body: any = {
        textQuery: query,
        languageCode: languageCode,
        maxResultCount: maxResults,
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
          'X-Goog-FieldMask': FIELD_MASK_PRO, // Usar PRO en lugar de BASIC (sin rating)
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
    });

    // Log de coste y guardar en cache
    await logPlacesRequest('searchText', FIELD_MASK_PRO, false);
    await setCached(cacheKey, results, 'searchText');

    return results;
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
  maxResults: number = 10 // Reducido de 20 a 10
): Promise<PlaceResult[]> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return [];
    }

    console.log('[Places] Buscando cerca de:', latitude, longitude);

    const languageCode = getDeviceLanguageCode();

    // Redondear coordenadas para mejorar cache hits
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;

    const params = {
      latitude: roundedLat,
      longitude: roundedLng,
      radiusMeters,
      maxResults,
      languageCode,
    };

    // Generar cache key
    const cacheKey = generateCacheKey('searchNearby', params, FIELD_MASK_PRO);

    // Verificar cache
    const cached = await getCached<PlaceResult[]>(cacheKey);
    if (cached) {
      await logPlacesRequest('searchNearby', FIELD_MASK_PRO, true);
      return cached;
    }

    // No hay cache, hacer request con rate limiting
    const results = await withRateLimit('searchNearby', async () => {
      const response = await fetch(`${BASE_URL}/places:searchNearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': FIELD_MASK_PRO, // Usar PRO en lugar de BASIC (sin rating)
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
    });

    // Log de coste y guardar en cache
    await logPlacesRequest('searchNearby', FIELD_MASK_PRO, false);
    await setCached(cacheKey, results, 'searchNearby');

    return results;
  } catch (error) {
    logError(error, 'googlePlacesService.searchNearbyPlaces');
    return [];
  }
}

// ============================================
// OBTENER DETALLES DE UN LUGAR POR ID
// ============================================

export async function getPlaceDetails(
  placeId: string,
  detailLevel: PlaceDetailLevel = PlaceDetailLevel.PRO
): Promise<PlaceResult | null> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return null;
    }

    console.log(`[Places] Obteniendo detalles (${detailLevel}) de:`, placeId);

    const languageCode = getDeviceLanguageCode();

    // Seleccionar FieldMask según nivel de detalle
    let fieldMask: string;
    switch (detailLevel) {
      case PlaceDetailLevel.ESSENTIALS:
        fieldMask = 'id,formattedAddress,location,types,photos';
        break;
      case PlaceDetailLevel.PRO:
        fieldMask = FIELD_MASK_DETAILS_PRO;
        break;
      case PlaceDetailLevel.ENTERPRISE_BASIC:
        fieldMask = FIELD_MASK_DETAILS_ENTERPRISE_BASIC;
        break;
      case PlaceDetailLevel.ENTERPRISE_FULL:
        fieldMask = FIELD_MASK_DETAILS_ENTERPRISE_FULL;
        break;
      default:
        fieldMask = FIELD_MASK_DETAILS_PRO;
    }

    const params = {
      placeId,
      languageCode,
      detailLevel,
    };

    // Generar cache key
    const cacheKey = generateCacheKey('placeDetails', params, fieldMask);

    // Verificar cache
    const cached = await getCached<PlaceResult>(cacheKey);
    if (cached) {
      await logPlacesRequest('placeDetails', fieldMask, true);
      return cached;
    }

    // No hay cache, hacer request con rate limiting
    const result = await withRateLimit('placeDetails', async () => {
      const response = await fetch(
        `${BASE_URL}/places/${placeId}?languageCode=${languageCode}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': fieldMask,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Places] Error en getPlaceDetails:', response.status, errorText);
        return null;
      }

      const place: GooglePlace = await response.json();
      console.log('[Places] Detalles obtenidos:', place.displayName?.text);

      return googlePlaceToResult(place);
    });

    if (!result) return null;

    // Log de coste y guardar en cache
    await logPlacesRequest('placeDetails', fieldMask, false);
    await setCached(cacheKey, result, 'placeDetails');

    return result;
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

// ============================================
// OBTENER FOTO ICÓNICA DE DESTINO
// ============================================

/**
 * Obtiene la foto más icónica de un destino usando una estrategia en cascada:
 * 1. Buscar landmarks icónicos del destino (ej: "Torre Eiffel París")
 * 2. Si falla, obtener múltiples fotos del destino y devolver la primera
 * 3. Fallback: null si no hay fotos disponibles
 */
export async function getIconicPhotoForDestination(
  destinationName: string,
  placeId?: string
): Promise<string | null> {
  try {
    if (!API_KEY) {
      console.error('[Places] API Key no configurada');
      return null;
    }

    console.log('[Places] Buscando foto icónica para:', destinationName);

    // ESTRATEGIA 1: Buscar landmark icónico del destino
    const landmarkQueries = [
      `${destinationName} landmark iconic`,
      `${destinationName} monument`,
      `${destinationName} tourist attraction`,
    ];

    for (const query of landmarkQueries) {
      try {
        console.log('[Places] Intentando búsqueda:', query);
        const landmarks = await searchPlacesByText(query, { maxResults: 3 });

        // Buscar el landmark con mejor rating y que tenga foto
        const bestLandmark = landmarks.find(
          (place) =>
            place.photoReference &&
            place.rating &&
            place.rating >= 4.0 &&
            place.totalRatings &&
            place.totalRatings > 100
        );

        if (bestLandmark?.photoReference) {
          console.log('[Places] ✓ Landmark icónico encontrado:', bestLandmark.name);
          return getPhotoUrl(bestLandmark.photoReference, 800);
        }

        // Si no hay uno con buen rating, tomar el primero con foto
        if (landmarks[0]?.photoReference) {
          console.log('[Places] ✓ Landmark encontrado:', landmarks[0].name);
          return getPhotoUrl(landmarks[0].photoReference, 800);
        }
      } catch (error) {
        console.warn('[Places] Error en búsqueda de landmark:', query, error);
        // Continuar con siguiente query
      }
    }

    // ESTRATEGIA 2: Si tenemos placeId, obtener fotos del destino original
    if (placeId) {
      console.log('[Places] Obteniendo fotos del destino original:', placeId);
      const placeDetails = await getPlaceDetails(placeId);

      if (placeDetails?.photoReferences && placeDetails.photoReferences.length > 0) {
        // Tomar la primera foto disponible
        console.log('[Places] ✓ Foto del destino encontrada');
        return getPhotoUrl(placeDetails.photoReferences[0], 800);
      }
    }

    // ESTRATEGIA 3: Fallback - No se encontró foto
    console.log('[Places] ✗ No se encontró foto icónica para el destino');
    return null;
  } catch (error) {
    logError(error, 'googlePlacesService.getIconicPhotoForDestination');
    return null;
  }
}
