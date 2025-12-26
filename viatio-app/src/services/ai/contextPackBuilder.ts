/**
 * CONTEXT PACK BUILDER
 *
 * Construye el ContextPack completo para enviar al Copilot.
 * Recopila información del viaje, agenda, lugares, gastos, etc.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getLocales, getCalendars } from 'expo-localization';
import { getViajeById } from '@/services/viajesService';
import { getReservasByViajeId } from '@/services/reservasService';
import { getLugaresByViajeId } from '@/services/lugaresService';
import { getGastosByViajeId } from '@/services/gastosService';
import { getDocumentosByViajeId } from '@/services/documentosService';
import { getDiasByViajeId } from '@/services/diasViajeService';
import { getEventosByDiaId } from '@/services/eventosService';
import { useCopilotStore } from '@/store/useCopilotStore';
import type {
  ContextPack,
  CopilotScreen,
  ActionType,
} from '@/types/asistente';
import type { Viaje } from '@/types/viaje';
import type { DiaViaje } from '@/types/diaViaje';
import type { EventoPersonalizado } from '@/types/evento';
import type { Reserva } from '@/types/reserva';
import type { Lugar } from '@/types/lugar';
import type { Gasto } from '@/types/gasto';
import type { Documento } from '@/types/documento';

// ============================================
// HELPERS
// ============================================

/**
 * Calcula los días entre dos fechas
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula los días hasta el inicio del viaje (negativo si ya pasó)
 */
function daysUntilTrip(startDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return daysBetween(today.toISOString(), start.toISOString());
}

/**
 * Obtiene las acciones disponibles según el contexto
 */
function getAvailableActions(screen: CopilotScreen, hasTrip: boolean): ActionType[] {
  const baseActions: ActionType[] = ['navigate_to'];

  if (!hasTrip) {
    return baseActions;
  }

  const tripActions: ActionType[] = [
    'create_agenda_item',
    'search_places',
    'add_place_to_saved',
    'show_on_map',
    'get_directions',
  ];

  switch (screen) {
    case 'agenda':
    case 'day_detail':
      return [...tripActions, 'suggest_itinerary', 'update_agenda_item', 'delete_agenda_item'];
    case 'map':
    case 'place_detail':
      return [...tripActions, 'suggest_itinerary'];
    case 'trip_detail':
      return [...tripActions, 'suggest_itinerary'];
    case 'standalone_chat':
    default:
      return tripActions;
  }
}

// ============================================
// BUILDER PRINCIPAL
// ============================================

export interface BuildContextPackOptions {
  currentScreen: CopilotScreen;
  tripId?: string;
  selectedDayId?: string;
  selectedDayDate?: string;
  selectedPlaceId?: string;
  selectedReservationId?: string;
  userName?: string;
}

/**
 * Construye el ContextPack completo para el Copilot
 */
export async function buildContextPack(
  options: BuildContextPackOptions
): Promise<ContextPack> {
  const {
    currentScreen,
    tripId,
    selectedDayId,
    selectedDayDate,
    selectedPlaceId,
    selectedReservationId,
    userName,
  } = options;

  // Obtener preferencias del Copilot
  const copilotPreferences = useCopilotStore.getState().preferences;

  // Construir sección de app
  const locales = getLocales();
  const calendars = getCalendars();
  const appInfo: ContextPack['app'] = {
    version: Constants.expoConfig?.version || '1.0.0',
    platform: Platform.OS as 'ios' | 'android',
    locale: locales[0]?.languageTag || 'es-ES',
    timezone: calendars[0]?.timeZone || 'UTC',
  };

  // Construir sección de usuario
  const userInfo: ContextPack['user'] = {
    name: userName,
    preferences: copilotPreferences.travelPreferences,
    copilotSettings: {
      tone: copilotPreferences.tone,
      responseLength: copilotPreferences.responseLength,
      language: copilotPreferences.language,
      useEmojis: copilotPreferences.useEmojis,
    },
  };

  // Construir sección de UI
  const uiInfo: ContextPack['ui'] = {
    currentScreen,
    selectedTripId: tripId,
    selectedDayId,
    selectedDayDate,
    selectedPlaceId,
    selectedReservationId,
  };

  // Base del ContextPack (sin datos del viaje)
  const baseContextPack: ContextPack = {
    app: appInfo,
    user: userInfo,
    ui: uiInfo,
    capabilities: {
      availableActions: getAvailableActions(currentScreen, !!tripId),
      canWriteData: true,
      canSearchPlaces: true,
      canGetDirections: true,
    },
  };

  // Si no hay viaje seleccionado, retornar el pack base
  if (!tripId) {
    return baseContextPack;
  }

  // Cargar datos del viaje
  try {
    const [viaje, reservas, lugares, gastos, documentos, dias] = await Promise.all([
      getViajeById(tripId),
      getReservasByViajeId(tripId),
      getLugaresByViajeId(tripId),
      getGastosByViajeId(tripId),
      getDocumentosByViajeId(tripId),
      getDiasByViajeId(tripId),
    ]);

    if (!viaje) {
      return baseContextPack;
    }

    // Construir datos del viaje
    const totalDays = daysBetween(viaje.fechaInicio, viaje.fechaFin) + 1;
    const tripInfo: ContextPack['trip'] = {
      id: viaje.id,
      title: viaje.destino,
      destination: viaje.destino,
      startDate: viaje.fechaInicio,
      endDate: viaje.fechaFin,
      totalDays,
      daysUntilTrip: daysUntilTrip(viaje.fechaInicio),
      party: { adults: viaje.numViajeros || 1, kids: 0 },
    };

    // Construir agenda con eventos
    const agendaDays = await Promise.all(
      dias.map(async (dia: DiaViaje, index: number) => {
        const eventos = await getEventosByDiaId(dia.id);
        return {
          dayId: dia.id,
          date: dia.fecha,
          dayNumber: index + 1,
          itemCount: eventos.length,
          items: eventos.map((e: EventoPersonalizado) => ({
            id: e.id,
            type: e.categoria,
            title: e.nombre,
            start: e.horaInicio || undefined,
            end: e.horaFin || undefined,
            placeName: e.ubicacion || undefined,
            placeId: e.lugarId || undefined,
          })),
        };
      })
    );

    const emptyDays = agendaDays.filter((d: { itemCount: number }) => d.itemCount === 0).length;
    const totalItems = agendaDays.reduce((sum: number, d: { itemCount: number }) => sum + d.itemCount, 0);

    const agendaInfo: ContextPack['agenda'] = {
      days: agendaDays,
      totalItems,
      emptyDays,
    };

    // Construir reservas (solo información, no acciones)
    const reservationsInfo: ContextPack['reservations'] = reservas.map((r: Reserva) => ({
      id: r.id,
      category: r.categoria,
      name: r.nombre,
      date: r.fechaInicio || undefined,
      time: r.horaInicio || undefined,
      location: r.ubicacion || undefined,
      confirmationCode: r.numeroConfirmacion || undefined,
    }));

    // Construir lugares
    const placesInfo: ContextPack['places'] = {
      saved: lugares.map((l: Lugar) => ({
        id: l.id,
        placeId: l.googlePlaceId || undefined,
        name: l.nombre,
        category: l.categoria || 'other',
        lat: l.latitud || 0,
        lng: l.longitud || 0,
      })),
      totalSaved: lugares.length,
    };

    // Construir documentos (solo conteo por categoría)
    const docsByCategory: Record<string, number> = {};
    documentos.forEach((doc: Documento) => {
      const cat = doc.categoria || 'other';
      docsByCategory[cat] = (docsByCategory[cat] || 0) + 1;
    });

    const documentsInfo: ContextPack['documents'] = {
      total: documentos.length,
      byCategory: docsByCategory,
    };

    // Construir gastos
    const totalGastos = gastos.reduce((sum: number, g: Gasto) => sum + g.monto, 0);
    const gastosByCategory: Record<string, number> = {};
    gastos.forEach((g: Gasto) => {
      const cat = g.categoria;
      gastosByCategory[cat] = (gastosByCategory[cat] || 0) + g.monto;
    });

    const expensesInfo: ContextPack['expenses'] = {
      total: totalGastos,
      budget: viaje.presupuesto || undefined,
      percentUsed: viaje.presupuesto ? (totalGastos / viaje.presupuesto) * 100 : undefined,
      currency: viaje.moneda || 'EUR',
      byCategory: gastosByCategory,
    };

    // Retornar ContextPack completo
    return {
      ...baseContextPack,
      trip: tripInfo,
      agenda: agendaInfo,
      reservations: reservationsInfo,
      places: placesInfo,
      documents: documentsInfo,
      expenses: expensesInfo,
    };
  } catch (error) {
    console.error('[ContextPackBuilder] Error cargando datos del viaje:', error);
    return baseContextPack;
  }
}

/**
 * Versión simplificada del ContextPack para enviar menos tokens
 * Útil cuando el contexto es muy grande
 */
export function compressContextPack(pack: ContextPack): ContextPack {
  const compressed = { ...pack };

  // Limitar eventos de agenda a los primeros 3 por día
  if (compressed.agenda) {
    compressed.agenda = {
      ...compressed.agenda,
      days: compressed.agenda.days.map((day) => ({
        ...day,
        items: day.items.slice(0, 3),
      })),
    };
  }

  // Limitar reservas a las 5 más relevantes (próximas)
  if (compressed.reservations && compressed.reservations.length > 5) {
    compressed.reservations = compressed.reservations.slice(0, 5);
  }

  // Limitar lugares a los 10 primeros
  if (compressed.places && compressed.places.saved.length > 10) {
    compressed.places = {
      ...compressed.places,
      saved: compressed.places.saved.slice(0, 10),
    };
  }

  return compressed;
}

/**
 * Genera un resumen textual del contexto para el prompt
 */
export function contextPackToPromptString(pack: ContextPack): string {
  const lines: string[] = [];

  // Info del viaje
  if (pack.trip) {
    lines.push(`VIAJE: ${pack.trip.destination}`);
    lines.push(`Fechas: ${pack.trip.startDate} → ${pack.trip.endDate} (${pack.trip.totalDays} días)`);

    if (pack.trip.daysUntilTrip > 0) {
      lines.push(`Faltan ${pack.trip.daysUntilTrip} días para el viaje`);
    } else if (pack.trip.daysUntilTrip === 0) {
      lines.push(`¡El viaje es HOY!`);
    } else {
      lines.push(`El viaje ya comenzó (día ${Math.abs(pack.trip.daysUntilTrip) + 1})`);
    }
  }

  // Pantalla actual
  lines.push(`\nPANTALLA ACTUAL: ${pack.ui.currentScreen}`);
  if (pack.ui.selectedDayDate) {
    lines.push(`Día seleccionado: ${pack.ui.selectedDayDate}`);
  }

  // Agenda
  if (pack.agenda) {
    lines.push(`\nAGENDA: ${pack.agenda.totalItems} eventos, ${pack.agenda.emptyDays} días vacíos`);
  }

  // Reservas
  if (pack.reservations && pack.reservations.length > 0) {
    lines.push(`\nRESERVAS (${pack.reservations.length}):`);
    pack.reservations.forEach((r) => {
      lines.push(`  - ${r.name} (${r.category}) ${r.date || ''}`);
    });
  }

  // Lugares
  if (pack.places && pack.places.totalSaved > 0) {
    lines.push(`\nLUGARES GUARDADOS: ${pack.places.totalSaved}`);
  }

  // Gastos
  if (pack.expenses) {
    lines.push(`\nGASTOS: ${pack.expenses.total.toFixed(2)} ${pack.expenses.currency}`);
    if (pack.expenses.budget) {
      lines.push(`Presupuesto: ${pack.expenses.budget} ${pack.expenses.currency} (${pack.expenses.percentUsed?.toFixed(0)}% usado)`);
    }
  }

  // Preferencias del usuario
  lines.push(`\nPREFERENCIAS DEL USUARIO:`);
  lines.push(`  Ritmo: ${pack.user.preferences.pace}`);
  if (pack.user.preferences.interests.length > 0) {
    lines.push(`  Intereses: ${pack.user.preferences.interests.join(', ')}`);
  }
  if (pack.user.preferences.foodRestrictions.length > 0) {
    lines.push(`  Restricciones alimentarias: ${pack.user.preferences.foodRestrictions.join(', ')}`);
  }

  // Estilo de respuesta
  lines.push(`\nESTILO DE RESPUESTA:`);
  lines.push(`  Tono: ${pack.user.copilotSettings.tone}`);
  lines.push(`  Longitud: ${pack.user.copilotSettings.responseLength}`);
  lines.push(`  Emojis: ${pack.user.copilotSettings.useEmojis ? 'Sí' : 'No'}`);

  return lines.join('\n');
}
