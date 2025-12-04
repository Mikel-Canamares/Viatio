// ============================================
// TIPOS DE RESPUESTA DE GOOGLE PLACES API (NEW)
// ============================================

export interface GooglePlacePhoto {
  name: string; // formato: places/{placeId}/photos/{photoRef}
  widthPx: number;
  heightPx: number;
  authorAttributions?: Array<{
    displayName: string;
    uri: string;
  }>;
}

export interface GooglePlaceOpeningHours {
  openNow?: boolean;
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  weekdayDescriptions?: string[];
}

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

export interface GooglePlace {
  id: string;
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: GooglePlaceLocation;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
    languageCode: string;
  };
  photos?: GooglePlacePhoto[];
  currentOpeningHours?: GooglePlaceOpeningHours;
  regularOpeningHours?: GooglePlaceOpeningHours;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  editorialSummary?: {
    text: string;
    languageCode: string;
  };
}

// ============================================
// TIPOS SIMPLIFICADOS PARA LA APP
// ============================================

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  shortAddress?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  types: string[];
  primaryType?: string;
  primaryTypeLabel?: string;
  photoReference?: string; // Para construir URL de foto
  isOpen?: boolean;
  openingHours?: string[];
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  description?: string;
}

// ============================================
// MAPEO DE TIPOS GOOGLE → CATEGORÍAS VIATIO
// ============================================

export const GOOGLE_TYPE_TO_CATEGORIA: Record<string, string> = {
  // Restaurantes y comida
  restaurant: 'restaurant',
  cafe: 'restaurant',
  bar: 'restaurant',
  bakery: 'restaurant',
  coffee_shop: 'restaurant',
  fast_food_restaurant: 'restaurant',

  // Alojamiento
  hotel: 'hotel',
  lodging: 'hotel',
  motel: 'hotel',
  bed_and_breakfast: 'hotel',

  // Atracciones turísticas
  tourist_attraction: 'attraction',
  museum: 'attraction',
  art_gallery: 'attraction',
  church: 'attraction',
  park: 'attraction',
  zoo: 'attraction',
  aquarium: 'attraction',
  amusement_park: 'attraction',
  historical_landmark: 'attraction',
  national_park: 'attraction',
  performing_arts_theater: 'attraction',

  // Compras
  shopping_mall: 'shopping',
  store: 'shopping',
  clothing_store: 'shopping',
  department_store: 'shopping',
  market: 'shopping',

  // Transporte
  airport: 'transport',
  train_station: 'transport',
  bus_station: 'transport',
  subway_station: 'transport',
  transit_station: 'transport',
};

export function mapGoogleTypeToCategoria(types: string[]): string {
  for (const type of types) {
    const categoria = GOOGLE_TYPE_TO_CATEGORIA[type];
    if (categoria) return categoria;
  }
  return 'other';
}

export function mapPriceLevel(level?: string): number | undefined {
  if (!level) return undefined;
  const mapping: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };
  return mapping[level];
}
