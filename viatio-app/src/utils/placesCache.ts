import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from './errorHandler';

// ============================================
// CACHE MANAGER PARA PLACES API
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
}

// TTL por tipo de endpoint (en milisegundos)
const TTL_CONFIG = {
  searchText: 30 * 60 * 1000,      // 30 minutos
  searchNearby: 60 * 60 * 1000,    // 1 hora
  placeDetails: 24 * 60 * 60 * 1000, // 24 horas
  autocomplete: 10 * 60 * 1000,    // 10 minutos
};

// Máximo de entradas en cache (LRU eviction)
const MAX_CACHE_SIZE = 100;

// Prefijo para las keys en AsyncStorage
const CACHE_PREFIX = '@viatio:places_cache_v1:';
const STATS_KEY = '@viatio:places_cache_stats';
const INDEX_KEY = '@viatio:places_cache_index';

// ============================================
// FUNCIONES DE CACHE
// ============================================

/**
 * Genera una key de cache a partir del endpoint y parámetros
 */
export function generateCacheKey(
  endpoint: 'searchText' | 'searchNearby' | 'placeDetails' | 'autocomplete',
  params: Record<string, any>,
  fieldMask?: string
): string {
  // Crear hash simple de los parámetros
  const paramsHash = hashObject(params);
  const maskHash = fieldMask ? hashString(fieldMask) : 'none';

  return `${CACHE_PREFIX}${endpoint}_${paramsHash}_${maskHash}`;
}

/**
 * Obtener datos del cache
 */
export async function getCached<T>(cacheKey: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      await incrementStat('misses');
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Verificar si expiró
    if (now - entry.timestamp > entry.ttl) {
      // Cache expirado, eliminarlo
      await AsyncStorage.removeItem(cacheKey);
      await removeFromIndex(cacheKey);
      await incrementStat('misses');
      return null;
    }

    await incrementStat('hits');
    console.log('[PlacesCache] ✓ Cache hit:', cacheKey);
    return entry.data;
  } catch (error) {
    logError(error, 'placesCache.getCached');
    return null;
  }
}

/**
 * Guardar datos en cache
 */
export async function setCached<T>(
  cacheKey: string,
  data: T,
  endpoint: 'searchText' | 'searchNearby' | 'placeDetails' | 'autocomplete'
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: TTL_CONFIG[endpoint],
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    await addToIndex(cacheKey);
    await incrementStat('sets');
    await enforceCacheLimit();

    console.log(`[PlacesCache] ✓ Cached (TTL: ${TTL_CONFIG[endpoint] / 1000}s):`, cacheKey);
  } catch (error) {
    logError(error, 'placesCache.setCached');
  }
}

/**
 * Limpiar todo el cache
 */
export async function clearCache(): Promise<void> {
  try {
    const index = await getCacheIndex();

    // Eliminar todas las entradas
    const deletePromises = index.map(key => AsyncStorage.removeItem(key));
    await Promise.all(deletePromises);

    // Limpiar índice y stats
    await AsyncStorage.removeItem(INDEX_KEY);
    await AsyncStorage.removeItem(STATS_KEY);

    console.log('[PlacesCache] ✓ Cache cleared');
  } catch (error) {
    logError(error, 'placesCache.clearCache');
  }
}

/**
 * Obtener estadísticas del cache
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const stats = await AsyncStorage.getItem(STATS_KEY);

    if (!stats) {
      return { hits: 0, misses: 0, sets: 0, evictions: 0 };
    }

    return JSON.parse(stats);
  } catch (error) {
    logError(error, 'placesCache.getCacheStats');
    return { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }
}

/**
 * Calcular hit rate del cache
 */
export async function getCacheHitRate(): Promise<number> {
  const stats = await getCacheStats();
  const total = stats.hits + stats.misses;

  if (total === 0) return 0;

  return (stats.hits / total) * 100;
}

// ============================================
// FUNCIONES INTERNAS
// ============================================

/**
 * Obtener índice de cache (lista de keys)
 */
async function getCacheIndex(): Promise<string[]> {
  try {
    const index = await AsyncStorage.getItem(INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Añadir key al índice
 */
async function addToIndex(cacheKey: string): Promise<void> {
  try {
    const index = await getCacheIndex();

    // Si ya existe, no hacer nada
    if (index.includes(cacheKey)) return;

    index.push(cacheKey);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    logError(error, 'placesCache.addToIndex');
  }
}

/**
 * Eliminar key del índice
 */
async function removeFromIndex(cacheKey: string): Promise<void> {
  try {
    const index = await getCacheIndex();
    const newIndex = index.filter(key => key !== cacheKey);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
  } catch (error) {
    logError(error, 'placesCache.removeFromIndex');
  }
}

/**
 * Aplicar límite de cache (LRU eviction)
 */
async function enforceCacheLimit(): Promise<void> {
  try {
    const index = await getCacheIndex();

    if (index.length <= MAX_CACHE_SIZE) return;

    // Obtener timestamps de todas las entradas
    const entries = await Promise.all(
      index.map(async (key) => {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) return { key, timestamp: 0 };

          const entry: CacheEntry<any> = JSON.parse(cached);
          return { key, timestamp: entry.timestamp };
        } catch {
          return { key, timestamp: 0 };
        }
      })
    );

    // Ordenar por timestamp (más antiguos primero)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Eliminar las entradas más antiguas
    const toEvict = entries.slice(0, index.length - MAX_CACHE_SIZE);

    for (const entry of toEvict) {
      await AsyncStorage.removeItem(entry.key);
      await removeFromIndex(entry.key);
      await incrementStat('evictions');
    }

    console.log(`[PlacesCache] ✓ Evicted ${toEvict.length} old entries`);
  } catch (error) {
    logError(error, 'placesCache.enforceCacheLimit');
  }
}

/**
 * Incrementar contador de estadística
 */
async function incrementStat(stat: keyof CacheStats): Promise<void> {
  try {
    const stats = await getCacheStats();
    stats[stat]++;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    // Silently fail
  }
}

/**
 * Hash simple de objeto (para cache key)
 */
function hashObject(obj: Record<string, any>): string {
  // Ordenar keys para que el hash sea consistente
  const sortedKeys = Object.keys(obj).sort();
  const str = sortedKeys.map(key => `${key}:${JSON.stringify(obj[key])}`).join('|');
  return hashString(str);
}

/**
 * Hash simple de string
 */
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}
