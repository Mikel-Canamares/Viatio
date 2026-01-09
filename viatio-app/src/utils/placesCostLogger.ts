import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from './errorHandler';

// ============================================
// COST LOGGER PARA PLACES API
// ============================================

interface CostLog {
  timestamp: number;
  endpoint: string;
  fieldMask: string;
  tier: 'ESSENTIALS' | 'PRO' | 'ENTERPRISE_BASIC' | 'ENTERPRISE_FULL';
  estimatedCost: number; // en EUR
  cached: boolean;
}

interface CostSummary {
  totalRequests: number;
  cacheHits: number;
  costByTier: Record<string, { requests: number; cost: number }>;
  totalCost: number;
  costByEndpoint: Record<string, { requests: number; cost: number }>;
  periodStart: number;
  periodEnd: number;
}

// Precios por tier (por 1000 requests en EUR)
const TIER_PRICING = {
  ESSENTIALS: 0.005,          // €5 per 1000
  PRO: 0.010,                 // €10 per 1000
  ENTERPRISE_BASIC: 0.035,    // €35 per 1000
  ENTERPRISE_FULL: 0.060,     // €60 per 1000
};

// Key para AsyncStorage
const LOGS_KEY = '@viatio:places_cost_log';

// Máximo de logs a guardar (últimos 1000)
const MAX_LOGS = 1000;

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Registrar un request de Places API
 */
export async function logPlacesRequest(
  endpoint: 'searchText' | 'searchNearby' | 'placeDetails' | 'autocomplete',
  fieldMask: string,
  cached: boolean = false
): Promise<void> {
  try {
    const tier = determineFieldMaskTier(fieldMask);
    const estimatedCost = cached ? 0 : (TIER_PRICING[tier] / 1000);

    const log: CostLog = {
      timestamp: Date.now(),
      endpoint,
      fieldMask,
      tier,
      estimatedCost,
      cached,
    };

    // Guardar log
    await appendLog(log);

    // Log en consola
    const costStr = cached ? 'CACHED' : `€${estimatedCost.toFixed(5)}`;
    console.log(`[CostLogger] ${endpoint} (${tier}): ${costStr}`);
  } catch (error) {
    logError(error, 'placesCostLogger.logPlacesRequest');
  }
}

/**
 * Obtener resumen de costes
 */
export async function getCostSummary(
  hours: number = 24
): Promise<CostSummary> {
  try {
    const logs = await getLogs();
    const now = Date.now();
    const cutoff = now - (hours * 60 * 60 * 1000);

    // Filtrar logs del período
    const periodLogs = logs.filter(log => log.timestamp >= cutoff);

    if (periodLogs.length === 0) {
      return {
        totalRequests: 0,
        cacheHits: 0,
        costByTier: {},
        totalCost: 0,
        costByEndpoint: {},
        periodStart: cutoff,
        periodEnd: now,
      };
    }

    // Calcular estadísticas
    const summary: CostSummary = {
      totalRequests: periodLogs.length,
      cacheHits: periodLogs.filter(l => l.cached).length,
      costByTier: {},
      totalCost: 0,
      costByEndpoint: {},
      periodStart: cutoff,
      periodEnd: now,
    };

    for (const log of periodLogs) {
      // Por tier
      if (!summary.costByTier[log.tier]) {
        summary.costByTier[log.tier] = { requests: 0, cost: 0 };
      }
      summary.costByTier[log.tier].requests++;
      summary.costByTier[log.tier].cost += log.estimatedCost;

      // Por endpoint
      if (!summary.costByEndpoint[log.endpoint]) {
        summary.costByEndpoint[log.endpoint] = { requests: 0, cost: 0 };
      }
      summary.costByEndpoint[log.endpoint].requests++;
      summary.costByEndpoint[log.endpoint].cost += log.estimatedCost;

      // Total
      summary.totalCost += log.estimatedCost;
    }

    return summary;
  } catch (error) {
    logError(error, 'placesCostLogger.getCostSummary');
    return {
      totalRequests: 0,
      cacheHits: 0,
      costByTier: {},
      totalCost: 0,
      costByEndpoint: {},
      periodStart: 0,
      periodEnd: 0,
    };
  }
}

/**
 * Generar reporte formateado de costes
 */
export async function generateCostReport(hours: number = 24): Promise<string> {
  const summary = await getCostSummary(hours);

  if (summary.totalRequests === 0) {
    return `📊 Places API Usage (últimas ${hours}h)\nNo hay requests registrados`;
  }

  const cacheHitRate = ((summary.cacheHits / summary.totalRequests) * 100).toFixed(1);
  const monthlyProjection = (summary.totalCost / hours) * 24 * 30;

  let report = `📊 Places API Usage (últimas ${hours}h)\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  // Por tier
  for (const [tier, data] of Object.entries(summary.costByTier)) {
    report += `${tier.padEnd(20)} ${data.requests.toString().padStart(4)} requests  → €${data.cost.toFixed(3)}\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `TOTAL:                 ${summary.totalRequests.toString().padStart(4)} requests  → €${summary.totalCost.toFixed(3)}\n`;
  report += `Coste proyectado/mes:                   → €${monthlyProjection.toFixed(2)}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `Cache hits:            ${summary.cacheHits.toString().padStart(4)} (${cacheHitRate}%)\n`;

  return report;
}

/**
 * Exportar logs como JSON
 */
export async function exportLogs(): Promise<CostLog[]> {
  return getLogs();
}

/**
 * Limpiar logs antiguos
 */
export async function clearLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOGS_KEY);
    console.log('[CostLogger] ✓ Logs cleared');
  } catch (error) {
    logError(error, 'placesCostLogger.clearLogs');
  }
}

// ============================================
// FUNCIONES INTERNAS
// ============================================

/**
 * Determinar tier basado en FieldMask
 */
function determineFieldMaskTier(
  fieldMask: string
): 'ESSENTIALS' | 'PRO' | 'ENTERPRISE_BASIC' | 'ENTERPRISE_FULL' {
  // Campos Enterprise Full
  const enterpriseFullFields = ['nationalPhoneNumber', 'internationalPhoneNumber', 'websiteUri', 'editorialSummary'];

  // Campos Enterprise Basic
  const enterpriseBasicFields = ['rating', 'userRatingCount', 'priceLevel', 'currentOpeningHours', 'regularOpeningHours'];

  // Campos Pro
  const proFields = ['displayName', 'primaryType', 'primaryTypeDisplayName', 'googleMapsUri'];

  // Verificar si contiene campos Enterprise Full
  for (const field of enterpriseFullFields) {
    if (fieldMask.includes(field)) {
      return 'ENTERPRISE_FULL';
    }
  }

  // Verificar si contiene campos Enterprise Basic
  for (const field of enterpriseBasicFields) {
    if (fieldMask.includes(field)) {
      return 'ENTERPRISE_BASIC';
    }
  }

  // Verificar si contiene campos Pro
  for (const field of proFields) {
    if (fieldMask.includes(field)) {
      return 'PRO';
    }
  }

  // Por defecto, Essentials
  return 'ESSENTIALS';
}

/**
 * Obtener todos los logs
 */
async function getLogs(): Promise<CostLog[]> {
  try {
    const logs = await AsyncStorage.getItem(LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Añadir log a la lista
 */
async function appendLog(log: CostLog): Promise<void> {
  try {
    const logs = await getLogs();

    // Añadir nuevo log
    logs.push(log);

    // Limitar tamaño (FIFO)
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }

    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    logError(error, 'placesCostLogger.appendLog');
  }
}
