/**
 * ACTION EXECUTOR
 *
 * Ejecuta las acciones propuestas por el Copilot.
 * Cada tipo de acción tiene su handler específico.
 */

import { Alert } from 'react-native';
import { createEvento } from '@/services/eventosService';
import { createLugar } from '@/services/lugaresService';
import { searchPlacesByText, searchNearbyPlaces } from '@/services/googlePlacesService';
import type {
  AgentAction,
  CreateAgendaItemParams,
  SearchPlacesParams,
  AddPlaceToSavedParams,
  NavigateToParams,
  ShowOnMapParams,
} from '@/types/asistente';
import type { CategoriaLugar } from '@/types/lugar';
import type { CategoriaEvento } from '@/types/evento';

// ============================================
// TIPOS
// ============================================

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ActionExecutorContext {
  navigation?: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  onShowOnMap?: (params: ShowOnMapParams) => void;
  onSearchComplete?: (results: unknown[]) => void;
}

// ============================================
// HANDLERS POR TIPO DE ACCIÓN
// ============================================

/**
 * Crear evento en la agenda
 */
async function executeCreateAgendaItem(
  params: CreateAgendaItemParams
): Promise<ActionResult> {
  try {
    // Primero necesitamos obtener o crear el día
    // Por ahora asumimos que el diaId viene en los params o lo buscamos
    const { tripId, date, title, type, start, end, placeId, placeName, notes } = params;

    // Crear el evento
    // Validar que la categoría sea válida
    const validCategories: CategoriaEvento[] = [
      'sightseeing', 'culture', 'food', 'shopping', 'entertainment',
      'nature', 'relaxation', 'transport', 'nightlife', 'sports', 'other'
    ];
    const categoria: CategoriaEvento = validCategories.includes(type as CategoriaEvento)
      ? (type as CategoriaEvento)
      : 'sightseeing';

    await createEvento({
      viajeId: tripId,
      diaId: undefined, // TODO: Obtener el diaId correcto basado en la fecha
      nombre: title,
      categoria,
      horaInicio: start,
      horaFin: end,
      ubicacion: placeName,
      notas: notes,
    });

    return {
      success: true,
      message: `"${title}" añadido a la agenda del ${date}`,
    };
  } catch (error) {
    console.error('[ActionExecutor] Error creando evento:', error);
    return {
      success: false,
      message: 'No se pudo añadir el evento a la agenda',
    };
  }
}

/**
 * Buscar lugares con Google Places
 */
async function executeSearchPlaces(
  params: SearchPlacesParams,
  context: ActionExecutorContext
): Promise<ActionResult> {
  try {
    const { query, nearLat, nearLng, radiusMeters } = params;

    let results;
    if (query) {
      results = await searchPlacesByText(query, {
        latitude: nearLat,
        longitude: nearLng,
        radiusMeters: radiusMeters || 5000,
      });
    } else if (nearLat && nearLng) {
      results = await searchNearbyPlaces(nearLat, nearLng, radiusMeters || 500);
    } else {
      return {
        success: false,
        message: 'Se necesita una búsqueda o ubicación',
      };
    }

    if (context.onSearchComplete) {
      context.onSearchComplete(results);
    }

    return {
      success: true,
      message: `Encontrados ${results.length} lugares`,
      data: results,
    };
  } catch (error) {
    console.error('[ActionExecutor] Error buscando lugares:', error);
    return {
      success: false,
      message: 'No se pudieron buscar lugares',
    };
  }
}

/**
 * Guardar lugar en el viaje
 */
async function executeAddPlaceToSaved(
  params: AddPlaceToSavedParams
): Promise<ActionResult> {
  try {
    const { tripId, placeId, name, category, lat, lng } = params;

    await createLugar({
      viajeId: tripId,
      nombre: name,
      googlePlaceId: placeId,
      categoria: category as CategoriaLugar,
      latitud: lat,
      longitud: lng,
    });

    return {
      success: true,
      message: `"${name}" guardado en tus lugares`,
    };
  } catch (error) {
    console.error('[ActionExecutor] Error guardando lugar:', error);
    return {
      success: false,
      message: 'No se pudo guardar el lugar',
    };
  }
}

/**
 * Navegar a otra pantalla
 */
async function executeNavigateTo(
  params: NavigateToParams,
  context: ActionExecutorContext
): Promise<ActionResult> {
  try {
    const { screen, params: screenParams } = params;

    if (context.navigation) {
      context.navigation.navigate(screen, screenParams);
      return {
        success: true,
        message: `Navegando a ${screen}`,
      };
    }

    return {
      success: false,
      message: 'Navegación no disponible',
    };
  } catch (error) {
    console.error('[ActionExecutor] Error navegando:', error);
    return {
      success: false,
      message: 'No se pudo navegar',
    };
  }
}

/**
 * Mostrar ubicación en el mapa
 */
async function executeShowOnMap(
  params: ShowOnMapParams,
  context: ActionExecutorContext
): Promise<ActionResult> {
  try {
    if (context.onShowOnMap) {
      context.onShowOnMap(params);
      return {
        success: true,
        message: 'Mostrando en el mapa',
      };
    }

    return {
      success: false,
      message: 'Mapa no disponible',
    };
  } catch (error) {
    console.error('[ActionExecutor] Error mostrando en mapa:', error);
    return {
      success: false,
      message: 'No se pudo mostrar en el mapa',
    };
  }
}

// ============================================
// EXECUTOR PRINCIPAL
// ============================================

/**
 * Ejecuta una acción del Copilot
 */
export async function executeAction(
  action: AgentAction,
  context: ActionExecutorContext = {}
): Promise<ActionResult> {
  console.log('[ActionExecutor] Ejecutando acción:', action.type, action.params);

  // Si requiere confirmación, mostrar diálogo
  if (action.requiresConfirmation) {
    return new Promise((resolve) => {
      Alert.alert(
        'Confirmar acción',
        `¿${action.label}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              resolve({
                success: false,
                message: 'Acción cancelada por el usuario',
              });
            },
          },
          {
            text: 'Confirmar',
            onPress: async () => {
              const result = await executeActionInternal(action, context);
              resolve(result);
            },
          },
        ]
      );
    });
  }

  return executeActionInternal(action, context);
}

/**
 * Ejecuta la acción internamente (sin confirmación)
 */
async function executeActionInternal(
  action: AgentAction,
  context: ActionExecutorContext
): Promise<ActionResult> {
  switch (action.type) {
    case 'create_agenda_item':
      return executeCreateAgendaItem(action.params as unknown as CreateAgendaItemParams);

    case 'search_places':
      return executeSearchPlaces(action.params as unknown as SearchPlacesParams, context);

    case 'add_place_to_saved':
      return executeAddPlaceToSaved(action.params as unknown as AddPlaceToSavedParams);

    case 'navigate_to':
      return executeNavigateTo(action.params as unknown as NavigateToParams, context);

    case 'show_on_map':
      return executeShowOnMap(action.params as unknown as ShowOnMapParams, context);

    case 'get_directions':
      // TODO: Implementar cuando tengamos el servicio de direcciones integrado
      return {
        success: false,
        message: 'Direcciones no implementadas aún',
      };

    case 'suggest_itinerary':
      // Esta acción genera contenido, no ejecuta nada
      return {
        success: true,
        message: 'Itinerario sugerido',
      };

    case 'update_agenda_item':
    case 'delete_agenda_item':
      // TODO: Implementar
      return {
        success: false,
        message: 'Acción no implementada aún',
      };

    default:
      return {
        success: false,
        message: `Tipo de acción desconocido: ${action.type}`,
      };
  }
}

/**
 * Ejecuta múltiples acciones en secuencia
 */
export async function executeActions(
  actions: AgentAction[],
  context: ActionExecutorContext = {}
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    const result = await executeAction(action, context);
    results.push(result);

    // Si una acción falla, podemos decidir si continuar o no
    if (!result.success) {
      console.warn('[ActionExecutor] Acción fallida:', action.type, result.message);
    }
  }

  return results;
}

/**
 * Valida que una acción tenga los parámetros requeridos
 */
export function validateAction(action: AgentAction): { valid: boolean; error?: string } {
  switch (action.type) {
    case 'create_agenda_item': {
      const params = action.params as Partial<CreateAgendaItemParams>;
      if (!params.tripId || !params.date || !params.title) {
        return { valid: false, error: 'Faltan parámetros: tripId, date o title' };
      }
      break;
    }

    case 'add_place_to_saved': {
      const params = action.params as Partial<AddPlaceToSavedParams>;
      if (!params.tripId || !params.name || !params.lat || !params.lng) {
        return { valid: false, error: 'Faltan parámetros para guardar lugar' };
      }
      break;
    }

    case 'navigate_to': {
      const params = action.params as Partial<NavigateToParams>;
      if (!params.screen) {
        return { valid: false, error: 'Falta el nombre de la pantalla' };
      }
      break;
    }
  }

  return { valid: true };
}
