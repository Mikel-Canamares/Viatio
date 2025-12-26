import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config/env';
import type { CopilotRequest, CopilotResponse, CopilotAction } from '../types';

const router = Router();
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// ============================================
// FUNCTION DECLARATIONS PARA GEMINI
// ============================================

const copilotFunctions = [
  {
    name: 'create_agenda_item',
    description: 'Añade un nuevo evento a la agenda del viaje en un día específico',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tripId: {
          type: SchemaType.STRING,
          description: 'ID del viaje',
        },
        date: {
          type: SchemaType.STRING,
          description: 'Fecha del evento en formato YYYY-MM-DD',
        },
        title: {
          type: SchemaType.STRING,
          description: 'Título del evento',
        },
        type: {
          type: SchemaType.STRING,
          description: 'Tipo: sightseeing, culture, food, shopping, entertainment, nature, relaxation, transport, nightlife, sports, other',
        },
        start: {
          type: SchemaType.STRING,
          description: 'Hora de inicio en formato HH:MM (opcional)',
        },
        end: {
          type: SchemaType.STRING,
          description: 'Hora de fin en formato HH:MM (opcional)',
        },
        placeName: {
          type: SchemaType.STRING,
          description: 'Nombre del lugar (opcional)',
        },
        notes: {
          type: SchemaType.STRING,
          description: 'Notas adicionales (opcional)',
        },
      },
      required: ['tripId', 'date', 'title'],
    },
  },
  {
    name: 'search_places',
    description: 'Busca lugares usando Google Places API según criterios',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Texto de búsqueda (ej: "restaurantes italianos", "museos")',
        },
        nearLat: {
          type: SchemaType.NUMBER,
          description: 'Latitud del punto de referencia',
        },
        nearLng: {
          type: SchemaType.NUMBER,
          description: 'Longitud del punto de referencia',
        },
        radiusMeters: {
          type: SchemaType.NUMBER,
          description: 'Radio de búsqueda en metros (default: 2000)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_place_to_saved',
    description: 'Guarda un lugar en la lista de lugares del viaje',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tripId: {
          type: SchemaType.STRING,
          description: 'ID del viaje',
        },
        placeId: {
          type: SchemaType.STRING,
          description: 'ID del lugar en Google Places',
        },
        name: {
          type: SchemaType.STRING,
          description: 'Nombre del lugar',
        },
        category: {
          type: SchemaType.STRING,
          description: 'Categoría: restaurant, attraction, museum, park, shopping, hotel, other',
        },
        lat: {
          type: SchemaType.NUMBER,
          description: 'Latitud',
        },
        lng: {
          type: SchemaType.NUMBER,
          description: 'Longitud',
        },
      },
      required: ['tripId', 'name', 'category', 'lat', 'lng'],
    },
  },
  {
    name: 'show_on_map',
    description: 'Muestra una ubicación o conjunto de lugares en el mapa',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        lat: {
          type: SchemaType.NUMBER,
          description: 'Latitud central',
        },
        lng: {
          type: SchemaType.NUMBER,
          description: 'Longitud central',
        },
        title: {
          type: SchemaType.STRING,
          description: 'Título para mostrar (opcional)',
        },
        placeIds: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'IDs de lugares a mostrar (opcional)',
        },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'navigate_to',
    description: 'Navega a otra pantalla de la app',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        screen: {
          type: SchemaType.STRING,
          description: 'Nombre de la pantalla: TripAgenda, TripMap, TripDetail, Expenses, TripDocuments, TripReservations',
        },
      },
      required: ['screen'],
    },
  },
  {
    name: 'suggest_itinerary',
    description: 'Propone un itinerario completo para un día específico',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tripId: {
          type: SchemaType.STRING,
          description: 'ID del viaje',
        },
        date: {
          type: SchemaType.STRING,
          description: 'Fecha para el itinerario en formato YYYY-MM-DD',
        },
        theme: {
          type: SchemaType.STRING,
          description: 'Tema o enfoque del día: cultural, gastronómico, naturaleza, relax, aventura, shopping',
        },
      },
      required: ['tripId', 'date'],
    },
  },
];

// ============================================
// GENERADOR DE PROMPT DINÁMICO
// ============================================

function buildCopilotPrompt(contextPack: CopilotRequest['contextPack']): string {
  const { user, ui, trip, agenda, reservations, places } = contextPack;
  const settings = user.copilotSettings;
  const prefs = user.preferences;

  // Base del prompt según tono
  const toneInstructions: Record<string, string> = {
    professional: 'Sé formal, directo y profesional. Evita expresiones coloquiales.',
    friendly: 'Sé cercano y amigable, como un amigo viajero experimentado. Puedes ser entusiasta.',
    concise: 'Sé extremadamente breve. Respuestas cortas y al grano. Sin rodeos.',
  };

  // Longitud de respuesta
  const lengthInstructions: Record<string, string> = {
    brief: 'Respuestas muy breves (1-2 párrafos máximo).',
    normal: 'Respuestas de longitud moderada (2-4 párrafos).',
    detailed: 'Respuestas completas y detalladas con toda la información relevante.',
  };

  // Idioma
  const languageInstructions: Record<string, string> = {
    device: `Responde en el idioma del locale del usuario: ${contextPack.app.locale}`,
    es: 'Responde siempre en español.',
    en: 'Always respond in English.',
  };

  let prompt = `Eres Viatio Copilot, el asistente inteligente de la app Viatio para organización de viajes.

═══════════════════════════════════════════════════
ESTILO DE COMUNICACIÓN
═══════════════════════════════════════════════════
${toneInstructions[settings.tone]}
${lengthInstructions[settings.responseLength]}
${languageInstructions[settings.language]}
${settings.useEmojis ? 'Usa emojis con moderación (1-3 por mensaje) para dar vida a las respuestas.' : 'NO uses emojis en tus respuestas.'}

═══════════════════════════════════════════════════
PREFERENCIAS DEL USUARIO
═══════════════════════════════════════════════════
- Ritmo de viaje: ${prefs.pace === 'relaxed' ? 'Relajado (2-3 actividades/día)' : prefs.pace === 'balanced' ? 'Equilibrado (4-5 actividades/día)' : 'Intenso (aprovechar cada minuto)'}
- Nivel de presupuesto: ${prefs.budgetLevel === 'budget' ? 'Económico' : prefs.budgetLevel === 'moderate' ? 'Moderado' : 'Premium'}
- Movilidad: ${prefs.mobilityLevel === 'full' ? 'Sin limitaciones' : prefs.mobilityLevel === 'limited' ? 'Movilidad reducida' : 'Silla de ruedas'}
${prefs.interests.length > 0 ? `- Intereses: ${prefs.interests.join(', ')}` : ''}
${prefs.foodRestrictions.length > 0 ? `- Restricciones alimentarias: ${prefs.foodRestrictions.join(', ')}` : ''}
${prefs.avoidances.length > 0 ? `- Evitar: ${prefs.avoidances.join(', ')}` : ''}

═══════════════════════════════════════════════════
CONTEXTO ACTUAL
═══════════════════════════════════════════════════
Pantalla actual: ${ui.currentScreen}
${ui.selectedDayDate ? `Día seleccionado: ${ui.selectedDayDate}` : ''}
`;

  // Info del viaje
  if (trip) {
    prompt += `
═══════════════════════════════════════════════════
VIAJE: ${trip.title} → ${trip.destination}
═══════════════════════════════════════════════════
- Fechas: ${trip.startDate} → ${trip.endDate} (${trip.totalDays} días)
- ${trip.daysUntilTrip > 0 ? `Faltan ${trip.daysUntilTrip} días para el viaje` : trip.daysUntilTrip === 0 ? '¡El viaje es HOY!' : `El viaje ya comenzó (día ${Math.abs(trip.daysUntilTrip) + 1})`}
${trip.party ? `- Viajeros: ${trip.party.adults} adultos${trip.party.kids > 0 ? `, ${trip.party.kids} niños` : ''}` : ''}
`;
  }

  // Agenda
  if (agenda) {
    prompt += `
AGENDA: ${agenda.totalItems} eventos planificados, ${agenda.emptyDays} días vacíos
`;
    if (agenda.days.length > 0) {
      const daysWithItems = agenda.days.filter(d => d.itemCount > 0).slice(0, 3);
      if (daysWithItems.length > 0) {
        prompt += `Próximos días con eventos:\n`;
        daysWithItems.forEach(d => {
          prompt += `  ${d.date} (Día ${d.dayNumber}): ${d.items.map(i => i.title).join(', ')}\n`;
        });
      }
    }
  }

  // Reservas
  if (reservations && reservations.length > 0) {
    prompt += `
RESERVAS (${reservations.length}):
${reservations.slice(0, 5).map(r => `  - ${r.name} [${r.category}] ${r.date || ''} ${r.time || ''}`).join('\n')}
`;
  }

  // Lugares guardados
  if (places && places.totalSaved > 0) {
    prompt += `
LUGARES GUARDADOS (${places.totalSaved}):
${places.saved.slice(0, 5).map(p => `  - ${p.name} [${p.category}]`).join('\n')}
`;
  }

  prompt += `
═══════════════════════════════════════════════════
CAPACIDADES Y ACCIONES
═══════════════════════════════════════════════════
Puedes proponer ACCIONES que el usuario puede ejecutar con un clic.
Acciones disponibles: ${contextPack.capabilities.availableActions.join(', ')}

IMPORTANTE SOBRE ACCIONES:
1. Solo propón acciones cuando sean útiles para el usuario
2. Máximo 3 acciones por respuesta
3. Las acciones que modifican datos (crear evento, guardar lugar) requieren confirmación
4. Usa create_agenda_item para añadir eventos a días específicos
5. Usa search_places cuando el usuario pida recomendaciones de lugares
6. Usa show_on_map para visualizar ubicaciones

FORMATO DE RESPUESTA:
- Primero da tu respuesta conversacional
- Si propones acciones, el sistema las mostrará como botones al usuario
- NO menciones las acciones en el texto, simplemente propónlas

═══════════════════════════════════════════════════
COMPORTAMIENTO POR PANTALLA
═══════════════════════════════════════════════════
`;

  switch (ui.currentScreen) {
    case 'agenda':
    case 'day_detail':
      prompt += `Estás en la AGENDA. Prioriza:
- Detectar huecos en el día y sugerir actividades
- Optimizar tiempos entre eventos
- Sugerir itinerarios para días vacíos
- Alertar sobre posibles conflictos de horarios`;
      break;
    case 'map':
    case 'place_detail':
      prompt += `Estás en el MAPA. Prioriza:
- Sugerir lugares cercanos a la ubicación actual
- Proponer rutas entre lugares guardados
- Recomendar zonas interesantes del destino
- Mostrar POIs relevantes en el mapa`;
      break;
    case 'trip_detail':
      prompt += `Estás en el DETALLE DEL VIAJE. Prioriza:
- Dar una visión general del estado del viaje
- Sugerir preparativos si faltan pocos días
- Identificar aspectos que faltan por planificar
- Ofrecer itinerarios completos`;
      break;
    default:
      prompt += `Chat general. Ayuda al usuario con cualquier aspecto del viaje.`;
  }

  return prompt;
}

// ============================================
// PARSEADOR DE FUNCTION CALLS
// ============================================

function parseFunctionCallsToActions(
  functionCalls: Array<{ name: string; args: Record<string, unknown> }>
): CopilotAction[] {
  return functionCalls.map((call, index) => {
    const actionLabels: Record<string, string> = {
      create_agenda_item: `Añadir "${call.args.title || 'evento'}" a la agenda`,
      search_places: `Buscar "${call.args.query || 'lugares'}"`,
      add_place_to_saved: `Guardar "${call.args.name || 'lugar'}"`,
      show_on_map: call.args.title ? `Ver "${call.args.title}" en mapa` : 'Ver en mapa',
      navigate_to: `Ir a ${call.args.screen || 'pantalla'}`,
      suggest_itinerary: `Ver itinerario para ${call.args.date || 'el día'}`,
    };

    const actionIcons: Record<string, string> = {
      create_agenda_item: 'calendar-outline',
      search_places: 'search-outline',
      add_place_to_saved: 'bookmark-outline',
      show_on_map: 'map-outline',
      navigate_to: 'arrow-forward-outline',
      suggest_itinerary: 'list-outline',
    };

    const requiresConfirmation = ['create_agenda_item', 'add_place_to_saved'].includes(call.name);

    return {
      id: `action_${Date.now()}_${index}`,
      label: actionLabels[call.name] || call.name,
      type: call.name,
      requiresConfirmation,
      params: call.args,
      icon: actionIcons[call.name],
      confidence: 0.9,
    };
  });
}

// ============================================
// ENDPOINT PRINCIPAL
// ============================================

/**
 * POST /api/copilot
 * Chat con el Copilot de Viatio usando Gemini con function calling
 */
router.post(
  '/',
  async (req: Request<{}, {}, CopilotRequest>, res: Response<CopilotResponse>): Promise<void> => {
    const startTime = Date.now();

    try {
      const { message, contextPack, conversationHistory } = req.body;

      // Validaciones
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Campo "message" requerido y no puede estar vacío',
        });
        return;
      }

      if (!contextPack) {
        res.status(400).json({
          success: false,
          error: 'Campo "contextPack" requerido',
        });
        return;
      }

      // Construir prompt dinámico
      const systemPrompt = buildCopilotPrompt(contextPack);

      // Crear modelo con function calling
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: copilotFunctions as any }],
      });

      // Construir historial
      const history =
        conversationHistory?.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })) || [];

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        },
      });

      // Enviar mensaje
      const result = await chat.sendMessage(message);
      const response = result.response;

      // Extraer texto y function calls
      let responseText = '';
      const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.text) {
            responseText += part.text;
          }
          if (part.functionCall) {
            functionCalls.push({
              name: part.functionCall.name,
              args: part.functionCall.args as Record<string, unknown>,
            });
          }
        }
      }

      // Convertir function calls a acciones
      const actions = parseFunctionCallsToActions(functionCalls);

      const processingTimeMs = Date.now() - startTime;

      res.json({
        success: true,
        response: {
          message: responseText || 'No pude generar una respuesta.',
          actions,
          metadata: {
            confidence: actions.length > 0 ? 0.9 : 0.7,
            sourcesUsed: ['trip_context', ...(actions.some((a) => a.type === 'search_places') ? ['google_places'] : [])],
            processingTimeMs,
          },
        },
      });
    } catch (error) {
      console.error('Error en /copilot:', error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al comunicarse con el Copilot',
      });
    }
  }
);

export default router;
