/**
 * SISTEMA CENTRALIZADO DE CATEGORÍAS
 *
 * Define todas las categorías, subcategorías, colores e iconos
 * utilizados en la aplicación de forma consistente.
 *
 * CATEGORÍAS BASE:
 * - transport (Transporte)
 * - accommodation (Alojamiento)
 * - food (Comida/Restaurantes)
 * - activity (Actividades/Ocio)
 * - shopping (Compras)
 * - other (Otros)
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================
// TIPOS BASE
// ============================================

export type CategoryBase =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'shopping'
  | 'other';

// ============================================
// SUBCATEGORÍAS
// ============================================

export type TransportSubtype = 'plane' | 'train' | 'bus' | 'ferry' | 'taxi' | 'car' | 'other';
export type AccommodationSubtype = 'hotel' | 'aparthotel' | 'apartment' | 'room' | 'camping' | 'other';
export type ActivitySubtype = 'sightseeing' | 'culture' | 'sports' | 'nature' | 'entertainment' | 'nightlife' | 'other';

// ============================================
// CONFIGURACIÓN DE CATEGORÍAS BASE
// ============================================

export interface CategoryConfig {
  label: string;
  labelShort: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // Color sólido principal
  bgColor: string; // Color de fondo (con transparencia)
  lightBg: string; // Fondo muy claro para badges
}

export const BASE_CATEGORIES: Record<CategoryBase, CategoryConfig> = {
  transport: {
    label: 'Transporte',
    labelShort: 'Transporte',
    icon: 'airplane',
    color: '#0066CC',
    bgColor: 'rgba(0, 102, 204, 0.1)',
    lightBg: '#DBEAFE',
  },
  accommodation: {
    label: 'Alojamiento',
    labelShort: 'Alojamiento',
    icon: 'bed',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    lightBg: '#DCFCE7',
  },
  food: {
    label: 'Comida',
    labelShort: 'Comida',
    icon: 'restaurant',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    lightBg: '#FFEDD5',
  },
  activity: {
    label: 'Actividades',
    labelShort: 'Actividad',
    icon: 'ticket',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    lightBg: '#F3E8FF',
  },
  shopping: {
    label: 'Compras',
    labelShort: 'Compras',
    icon: 'bag',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    lightBg: '#FCE7F3',
  },
  other: {
    label: 'Otros',
    labelShort: 'Otro',
    icon: 'ellipsis-horizontal',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    lightBg: '#F3F4F6',
  },
};

// ============================================
// SUBCATEGORÍAS DE TRANSPORTE
// ============================================

export interface SubcategoryConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  parent: CategoryBase;
}

export const TRANSPORT_SUBTYPES: Record<TransportSubtype, SubcategoryConfig> = {
  plane: { label: 'Avión', icon: 'airplane', parent: 'transport' },
  train: { label: 'Tren', icon: 'train', parent: 'transport' },
  bus: { label: 'Autobús', icon: 'bus', parent: 'transport' },
  ferry: { label: 'Ferry', icon: 'boat', parent: 'transport' },
  taxi: { label: 'Taxi', icon: 'car', parent: 'transport' },
  car: { label: 'Coche', icon: 'car-sport', parent: 'transport' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal', parent: 'transport' },
};

// ============================================
// SUBCATEGORÍAS DE ALOJAMIENTO
// ============================================

export const ACCOMMODATION_SUBTYPES: Record<AccommodationSubtype, SubcategoryConfig> = {
  hotel: { label: 'Hotel', icon: 'business', parent: 'accommodation' },
  aparthotel: { label: 'Apartahotel', icon: 'business-outline', parent: 'accommodation' },
  apartment: { label: 'Apartamento', icon: 'home', parent: 'accommodation' },
  room: { label: 'Habitación', icon: 'bed', parent: 'accommodation' },
  camping: { label: 'Camping', icon: 'bonfire', parent: 'accommodation' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal', parent: 'accommodation' },
};

// ============================================
// SUBCATEGORÍAS DE ACTIVIDADES
// ============================================

export const ACTIVITY_SUBTYPES: Record<ActivitySubtype, SubcategoryConfig> = {
  sightseeing: { label: 'Turismo', icon: 'camera', parent: 'activity' },
  culture: { label: 'Cultura', icon: 'library', parent: 'activity' },
  sports: { label: 'Deportes', icon: 'fitness', parent: 'activity' },
  nature: { label: 'Naturaleza', icon: 'leaf', parent: 'activity' },
  entertainment: { label: 'Ocio', icon: 'game-controller', parent: 'activity' },
  nightlife: { label: 'Noche', icon: 'moon', parent: 'activity' },
  other: { label: 'Otros', icon: 'ellipsis-horizontal', parent: 'activity' },
};

// ============================================
// HELPERS - OBTENER CONFIGURACIÓN
// ============================================

/**
 * Obtiene la configuración de una categoría base
 */
export function getCategoryConfig(category: CategoryBase): CategoryConfig {
  return BASE_CATEGORIES[category];
}

/**
 * Obtiene el color de una categoría base
 */
export function getCategoryColor(category: CategoryBase): string {
  return BASE_CATEGORIES[category].color;
}

/**
 * Obtiene el icono de una categoría base
 */
export function getCategoryIcon(category: CategoryBase): keyof typeof Ionicons.glyphMap {
  return BASE_CATEGORIES[category].icon;
}

/**
 * Obtiene la configuración de una subcategoría de transporte
 */
export function getTransportSubtypeConfig(subtype: TransportSubtype): {
  config: SubcategoryConfig;
  color: string;
} {
  const config = TRANSPORT_SUBTYPES[subtype];
  return {
    config,
    color: BASE_CATEGORIES[config.parent].color,
  };
}

/**
 * Obtiene la configuración de una subcategoría de alojamiento
 */
export function getAccommodationSubtypeConfig(subtype: AccommodationSubtype): {
  config: SubcategoryConfig;
  color: string;
} {
  const config = ACCOMMODATION_SUBTYPES[subtype];
  return {
    config,
    color: BASE_CATEGORIES[config.parent].color,
  };
}

/**
 * Obtiene la configuración de una subcategoría de actividad
 */
export function getActivitySubtypeConfig(subtype: ActivitySubtype): {
  config: SubcategoryConfig;
  color: string;
} {
  const config = ACTIVITY_SUBTYPES[subtype];
  return {
    config,
    color: BASE_CATEGORIES[config.parent].color,
  };
}

// ============================================
// HELPERS - MAPEO ENTRE FORMATOS
// ============================================

/**
 * Mapea categorías en inglés a español (para gastos)
 */
export function mapCategoryToSpanish(
  category: CategoryBase
): 'transporte' | 'alojamiento' | 'comida' | 'actividades' | 'compras' | 'otros' {
  const map: Record<CategoryBase, 'transporte' | 'alojamiento' | 'comida' | 'actividades' | 'compras' | 'otros'> = {
    transport: 'transporte',
    accommodation: 'alojamiento',
    food: 'comida',
    activity: 'actividades',
    shopping: 'compras',
    other: 'otros',
  };
  return map[category];
}

/**
 * Mapea categorías en español a inglés
 */
export function mapSpanishToCategory(
  category: 'transporte' | 'alojamiento' | 'comida' | 'actividades' | 'compras' | 'otros'
): CategoryBase {
  const map: Record<string, CategoryBase> = {
    transporte: 'transport',
    alojamiento: 'accommodation',
    comida: 'food',
    actividades: 'activity',
    compras: 'shopping',
    otros: 'other',
  };
  return map[category];
}

/**
 * Mapea categoría de lugar a categoría base
 */
export function mapLugarToCategory(
  lugarCat: 'restaurant' | 'hotel' | 'attraction' | 'shopping' | 'transport' | 'other'
): CategoryBase {
  const map: Record<string, CategoryBase> = {
    restaurant: 'food',
    hotel: 'accommodation',
    attraction: 'activity',
    shopping: 'shopping',
    transport: 'transport',
    other: 'other',
  };
  return map[lugarCat];
}

/**
 * Mapea categoría de documento a categoría base
 */
export function mapDocumentoToCategory(
  docCat: 'identidad' | 'transporte' | 'alojamiento' | 'seguro' | 'actividades' | 'otros'
): CategoryBase | 'identity' | 'insurance' {
  const map: Record<string, CategoryBase | 'identity' | 'insurance'> = {
    identidad: 'identity', // Categoría especial documentos
    transporte: 'transport',
    alojamiento: 'accommodation',
    seguro: 'insurance', // Categoría especial documentos
    actividades: 'activity',
    otros: 'other',
  };
  return map[docCat];
}

// ============================================
// CATEGORÍAS ESPECIALES (solo para módulos específicos)
// ============================================

/**
 * Categorías especiales solo para documentos
 */
export const SPECIAL_DOCUMENT_CATEGORIES = {
  identity: {
    label: 'Identidad',
    labelShort: 'Identidad',
    icon: 'card' as keyof typeof Ionicons.glyphMap,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    lightBg: '#DBEAFE',
  },
  insurance: {
    label: 'Seguro',
    labelShort: 'Seguro',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    lightBg: '#EDE9FE',
  },
};

/**
 * Obtiene configuración completa para documentos (incluye categorías especiales)
 */
export function getDocumentCategoryConfig(
  category: 'identity' | 'insurance' | CategoryBase
): CategoryConfig {
  if (category === 'identity' || category === 'insurance') {
    return SPECIAL_DOCUMENT_CATEGORIES[category];
  }
  return BASE_CATEGORIES[category];
}
