/**
 * PLACES RANKING SERVICE
 *
 * Servicio para rankear resultados de Google Places API según:
 * - Distancia al punto de referencia
 * - Rating (si está disponible)
 * - Estado de apertura (openNow)
 * - Número de reviews (popularidad)
 *
 * Retorna máximo 8 resultados ordenados por relevancia.
 */

// ============================================
// TIPOS
// ============================================

export interface PlaceResult {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  priceLevel?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  // Campos adicionales
  distanceMeters?: number;
  relevanceScore?: number;
}

export interface RankingOptions {
  refLat: number;
  refLng: number;
  maxResults?: number;
  preferOpenNow?: boolean;
  minRating?: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula la distancia en metros entre dos puntos usando la fórmula Haversine
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Calcula un score de relevancia combinado (0-100)
 *
 * Factores:
 * - Distancia: 40% del peso (más cerca = mejor)
 * - Rating: 30% del peso (4.5-5.0 = mejor)
 * - Popularidad: 20% del peso (más reviews = mejor)
 * - OpenNow: 10% del peso (bonus si está abierto)
 */
function calculateRelevanceScore(
  place: PlaceResult,
  options: RankingOptions
): number {
  let score = 0;

  // 1. DISTANCIA (40 puntos máximo)
  if (place.location) {
    const distanceMeters = calculateDistance(
      options.refLat,
      options.refLng,
      place.location.latitude,
      place.location.longitude
    );
    place.distanceMeters = Math.round(distanceMeters);

    // Score de distancia: decrece exponencialmente
    // 0-500m = 40 pts, 500-1000m = 30 pts, 1000-2000m = 20 pts, >2000m = 10 pts
    if (distanceMeters <= 500) {
      score += 40;
    } else if (distanceMeters <= 1000) {
      score += 30;
    } else if (distanceMeters <= 2000) {
      score += 20;
    } else if (distanceMeters <= 5000) {
      score += 10;
    } else {
      score += 5;
    }
  }

  // 2. RATING (30 puntos máximo)
  if (place.rating !== undefined && place.rating !== null) {
    // Rating 4.5-5.0 = 30 pts, 4.0-4.5 = 20 pts, 3.5-4.0 = 10 pts, <3.5 = 5 pts
    if (place.rating >= 4.5) {
      score += 30;
    } else if (place.rating >= 4.0) {
      score += 20;
    } else if (place.rating >= 3.5) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    // Sin rating = score neutro (15 pts)
    score += 15;
  }

  // 3. POPULARIDAD (20 puntos máximo)
  if (place.userRatingCount !== undefined && place.userRatingCount !== null) {
    // >1000 reviews = 20 pts, 100-1000 = 15 pts, 10-100 = 10 pts, <10 = 5 pts
    if (place.userRatingCount >= 1000) {
      score += 20;
    } else if (place.userRatingCount >= 100) {
      score += 15;
    } else if (place.userRatingCount >= 10) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    // Sin reviews = score bajo (5 pts)
    score += 5;
  }

  // 4. ESTADO DE APERTURA (10 puntos bonus)
  if (
    options.preferOpenNow &&
    place.currentOpeningHours?.openNow === true
  ) {
    score += 10;
  }

  return Math.min(100, score);
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Rankea y filtra una lista de lugares según criterios de relevancia
 *
 * @param places - Lista de lugares de Google Places API
 * @param options - Opciones de ranking (coords de referencia, máx resultados, etc.)
 * @returns Lista de lugares rankeados y limitada
 */
export function rankPlaces(
  places: PlaceResult[],
  options: RankingOptions
): PlaceResult[] {
  const {
    refLat,
    refLng,
    maxResults = 8,
    preferOpenNow = true,
    minRating,
  } = options;

  // 1. Filtrar por rating mínimo si se especifica
  let filtered = places;
  if (minRating !== undefined) {
    filtered = filtered.filter(
      (p) =>
        p.rating === undefined ||
        p.rating === null ||
        p.rating >= minRating
    );
  }

  // 2. Calcular scores de relevancia
  filtered.forEach((place) => {
    place.relevanceScore = calculateRelevanceScore(place, {
      refLat,
      refLng,
      preferOpenNow,
    });
  });

  // 3. Ordenar por score descendente
  filtered.sort((a, b) => {
    const scoreA = a.relevanceScore || 0;
    const scoreB = b.relevanceScore || 0;
    return scoreB - scoreA;
  });

  // 4. Limitar a maxResults
  return filtered.slice(0, maxResults);
}

/**
 * Formatea un lugar para mostrar al usuario con información verificada
 *
 * @param place - Lugar de Google Places
 * @returns Texto formateado con datos verificados (sin inventar)
 */
export function formatPlaceForResponse(place: PlaceResult): string {
  const lines: string[] = [];

  // Nombre y tipo
  const name = place.displayName || 'Sin nombre';
  const type = place.primaryTypeDisplayName || '';
  lines.push(`📍 **${name}**${type ? ` (${type})` : ''}`);

  // Dirección
  if (place.formattedAddress) {
    lines.push(`   ${place.formattedAddress}`);
  }

  // Rating y reviews
  if (place.rating !== undefined && place.rating !== null) {
    const ratingText = `⭐ ${place.rating.toFixed(1)}`;
    const reviewsText =
      place.userRatingCount !== undefined
        ? ` (${place.userRatingCount} opiniones)`
        : '';
    lines.push(`   ${ratingText}${reviewsText}`);
  } else {
    lines.push(`   ⭐ Sin valoraciones`);
  }

  // Distancia
  if (place.distanceMeters !== undefined) {
    const distKm = (place.distanceMeters / 1000).toFixed(1);
    const distText =
      place.distanceMeters < 1000
        ? `${place.distanceMeters}m`
        : `${distKm}km`;
    lines.push(`   📏 A ${distText}`);
  }

  // Estado de apertura
  if (place.currentOpeningHours?.openNow !== undefined) {
    const openText = place.currentOpeningHours.openNow
      ? '🟢 Abierto ahora'
      : '🔴 Cerrado ahora';
    lines.push(`   ${openText}`);
  } else {
    lines.push(`   🔘 Horario no disponible`);
  }

  // Nivel de precio
  if (place.priceLevel) {
    lines.push(`   💰 Precio: ${place.priceLevel}`);
  }

  // Teléfono y web (si están disponibles)
  const extras: string[] = [];
  if (place.nationalPhoneNumber) {
    extras.push(`📞 ${place.nationalPhoneNumber}`);
  } else {
    extras.push(`📞 No disponible`);
  }

  if (place.websiteUri) {
    extras.push(`🌐 Web disponible`);
  } else {
    extras.push(`🌐 No disponible`);
  }

  if (extras.length > 0) {
    lines.push(`   ${extras.join(' • ')}`);
  }

  return lines.join('\n');
}

/**
 * Genera timestamp de consulta para añadir a las respuestas
 */
export function getConsultationTimestamp(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Consultado en Google Places el ${dateStr} a las ${timeStr}`;
}
