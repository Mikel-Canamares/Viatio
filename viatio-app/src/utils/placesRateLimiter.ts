import { logError } from './errorHandler';

// ============================================
// RATE LIMITER CON TOKEN BUCKET ALGORITHM
// ============================================

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // milisegundos entre tokens
  lastRefill: number;
}

interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  endpoint: string;
  timestamp: number;
}

// Configuración por endpoint
const BUCKET_CONFIG: Record<string, { maxTokens: number; refillRate: number }> = {
  searchText: { maxTokens: 1, refillRate: 1000 },     // 1 req/sec
  searchNearby: { maxTokens: 1, refillRate: 1000 },   // 1 req/sec
  placeDetails: { maxTokens: 2, refillRate: 500 },    // 2 req/sec
  autocomplete: { maxTokens: 1, refillRate: 800 },    // 1.25 req/sec
};

// Buckets por endpoint
const buckets: Map<string, TokenBucket> = new Map();

// Cola de requests pendientes
const queue: QueuedRequest[] = [];

// Timeout máximo para requests en cola (10 segundos)
const MAX_QUEUE_TIMEOUT = 10000;

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Ejecutar función con rate limiting
 */
export async function withRateLimit<T>(
  endpoint: 'searchText' | 'searchNearby' | 'placeDetails' | 'autocomplete',
  fn: () => Promise<T>
): Promise<T> {
  // Inicializar bucket si no existe
  if (!buckets.has(endpoint)) {
    initBucket(endpoint);
  }

  // Intentar consumir un token
  if (consumeToken(endpoint)) {
    // Token disponible, ejecutar inmediatamente
    console.log(`[RateLimiter] ✓ Token consumed for ${endpoint}`);
    return fn();
  }

  // No hay tokens disponibles, encolar request
  console.log(`[RateLimiter] ⏳ Queueing request for ${endpoint}`);

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Timeout alcanzado, rechazar
      const index = queue.findIndex(r => r.resolve === resolve);
      if (index !== -1) {
        queue.splice(index, 1);
      }
      reject(new Error(`Rate limit queue timeout for ${endpoint}`));
    }, MAX_QUEUE_TIMEOUT);

    queue.push({
      resolve: async (value: any) => {
        clearTimeout(timeout);
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      reject: (reason) => {
        clearTimeout(timeout);
        reject(reason);
      },
      endpoint,
      timestamp: Date.now(),
    });

    // Intentar procesar cola
    processQueue();
  });
}

/**
 * Obtener estadísticas del rate limiter
 */
export function getRateLimiterStats(): Record<string, any> {
  const stats: Record<string, any> = {};

  for (const [endpoint, bucket] of buckets.entries()) {
    stats[endpoint] = {
      tokens: bucket.tokens,
      maxTokens: bucket.maxTokens,
      refillRate: bucket.refillRate,
      queuedRequests: queue.filter(r => r.endpoint === endpoint).length,
    };
  }

  stats.totalQueued = queue.length;

  return stats;
}

/**
 * Resetear rate limiter (útil para testing)
 */
export function resetRateLimiter(): void {
  buckets.clear();
  queue.length = 0;
  console.log('[RateLimiter] ✓ Reset');
}

// ============================================
// FUNCIONES INTERNAS
// ============================================

/**
 * Inicializar bucket para un endpoint
 */
function initBucket(endpoint: string): void {
  const config = BUCKET_CONFIG[endpoint] || BUCKET_CONFIG.searchText;

  buckets.set(endpoint, {
    tokens: config.maxTokens,
    maxTokens: config.maxTokens,
    refillRate: config.refillRate,
    lastRefill: Date.now(),
  });
}

/**
 * Intentar consumir un token
 */
function consumeToken(endpoint: string): boolean {
  const bucket = buckets.get(endpoint);
  if (!bucket) return false;

  // Rellenar tokens basado en tiempo transcurrido
  refillTokens(bucket);

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

/**
 * Rellenar tokens basado en tiempo transcurrido
 */
function refillTokens(bucket: TokenBucket): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;

  // Calcular cuántos tokens se deben añadir
  const tokensToAdd = Math.floor(elapsed / bucket.refillRate);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
}

/**
 * Procesar cola de requests pendientes
 */
function processQueue(): void {
  if (queue.length === 0) return;

  // Agrupar por endpoint
  const byEndpoint: Record<string, QueuedRequest[]> = {};

  for (const request of queue) {
    if (!byEndpoint[request.endpoint]) {
      byEndpoint[request.endpoint] = [];
    }
    byEndpoint[request.endpoint].push(request);
  }

  // Intentar procesar cada endpoint
  for (const [endpoint, requests] of Object.entries(byEndpoint)) {
    if (requests.length === 0) continue;

    if (consumeToken(endpoint)) {
      // Token disponible, procesar el request más antiguo
      const request = requests[0];
      const index = queue.indexOf(request);
      if (index !== -1) {
        queue.splice(index, 1);
      }

      console.log(`[RateLimiter] ✓ Processing queued request for ${endpoint}`);
      request.resolve(null);
    }
  }

  // Programar siguiente procesamiento si hay requests pendientes
  if (queue.length > 0) {
    // Encontrar el siguiente momento en que se rellenará un token
    let minWait = Infinity;

    for (const endpoint of Object.keys(byEndpoint)) {
      const bucket = buckets.get(endpoint);
      if (bucket) {
        const timeSinceRefill = Date.now() - bucket.lastRefill;
        const timeUntilNextToken = bucket.refillRate - (timeSinceRefill % bucket.refillRate);
        minWait = Math.min(minWait, timeUntilNextToken);
      }
    }

    if (minWait > 0 && minWait < Infinity) {
      setTimeout(() => processQueue(), minWait + 10); // +10ms para asegurar que el token está disponible
    }
  }
}
