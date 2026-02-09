import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config/env';
import type { CopilotRequest, CopilotResponse, CopilotAction } from '../types';
import * as conversationSummary from '../services/conversationSummaryService';

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
    description: 'Busca lugares verificados usando Google Places API. Úsalo para encontrar restaurantes, atracciones, hoteles, etc. SIEMPRE usa este tool para recomendaciones de lugares concretos. Devuelve información real verificada (nombre, dirección, rating, si está abierto ahora). Si no hay datos de horario/precio/web, dirás "No disponible" sin inventar.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Texto de búsqueda específico. Ejemplos: "restaurantes vegetarianos", "museos de arte", "farmacias", "cafeterías con wifi".',
        },
        nearLat: {
          type: SchemaType.NUMBER,
          description: 'Latitud del punto de referencia (hotel, lugar actual, POI del día). OBLIGATORIO para búsquedas "cerca de".',
        },
        nearLng: {
          type: SchemaType.NUMBER,
          description: 'Longitud del punto de referencia. OBLIGATORIO para búsquedas "cerca de".',
        },
        radiusMeters: {
          type: SchemaType.NUMBER,
          description: 'Radio de búsqueda en metros. Default: 2000 (2km). Usa 500 para "muy cerca", 1000 para "cerca", 5000 para "en la zona".',
        },
        type: {
          type: SchemaType.STRING,
          description: 'Tipo específico de Google Places para filtrar. Ejemplos: "restaurant", "tourist_attraction", "museum", "cafe", "pharmacy", "atm". Opcional pero mejora precisión.',
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
${trip.destinationCoords ? `- COORDENADAS DEL DESTINO: lat=${trip.destinationCoords.lat}, lng=${trip.destinationCoords.lng} (usa estas coordenadas para búsquedas de lugares)` : ''}
${trip.lodgingBase ? `- ALOJAMIENTO BASE: ${trip.lodgingBase.name} (lat=${trip.lodgingBase.lat}, lng=${trip.lodgingBase.lng})` : ''}
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

  // Reservas (incluyendo ubicación del hotel como referencia clave)
  if (reservations && reservations.length > 0) {
    // Buscar hotel en reservas para usarlo como punto de referencia
    const hotelReservation = reservations.find(r =>
      r.category === 'hotel' || r.category === 'accommodation' ||
      r.name.toLowerCase().includes('hotel') || r.name.toLowerCase().includes('hostal') ||
      r.name.toLowerCase().includes('apartamento')
    );

    prompt += `
RESERVAS (${reservations.length}):
${reservations.slice(0, 5).map(r => `  - ${r.name} [${r.category}] ${r.date || ''} ${r.time || ''} ${r.location || ''}`).join('\n')}
${hotelReservation ? `\n📍 ALOJAMIENTO PRINCIPAL: "${hotelReservation.name}" - cuando el usuario diga "cerca del hotel", usa las coordenadas del destino o busca este lugar` : ''}
`;
  }

  // Lugares guardados (con coordenadas para búsquedas contextuales)
  if (places && places.totalSaved > 0) {
    prompt += `
LUGARES GUARDADOS (${places.totalSaved}):
${places.saved.slice(0, 5).map(p => `  - ${p.name} [${p.category}]${p.lat && p.lng ? ` (lat=${p.lat}, lng=${p.lng})` : ''}`).join('\n')}
`;
  }

  prompt += `
═══════════════════════════════════════════════════
TUS HERRAMIENTAS - ÚSALAS SIEMPRE
═══════════════════════════════════════════════════
Eres un asistente ACTIVO que ejecuta acciones, no solo da información.
Herramientas disponibles: ${contextPack.capabilities.availableActions.join(', ')}

🚨 REGLA DE ORO: ACTÚA, NO SOLO INFORMES 🚨

Cuando el usuario pida algo, EJECUTA las herramientas apropiadas inmediatamente.
NO des solo texto. USA las herramientas para hacer cosas útiles.

═══════════════════════════════════════════════════
⛔ RESTRICCIONES CRÍTICAS - BÚSQUEDA WEB PROHIBIDA ⛔
═══════════════════════════════════════════════════
🚫 PROHIBIDO: Web scraping, búsquedas en internet, Serper, Tavily, grounding web
🚫 NUNCA inventes datos: horarios, precios, reviews, números de teléfono, websites
🚫 Si no tienes un dato → Di "No disponible en Google Places" o "No consta"

✅ PERMITIDO: SOLO Google Places API (search_places tool)
✅ Para recomendar lugares → SIEMPRE llama a search_places
✅ Respuestas basadas SOLO en resultados verificados de Places
✅ Si falta info (horario/precio/web) → Mostrar "No disponible"
✅ Añade timestamp: "Consultado el [fecha actual]"

═══════════════════════════════════════════════════
HERRAMIENTA: search_places + show_on_map (COMBO OBLIGATORIO)
═══════════════════════════════════════════════════
Para recomendar lugares concretos (restaurantes, museos, hoteles, etc.):

1. SIEMPRE ejecuta search_places con coordenadas de contexto
2. SIEMPRE añade show_on_map para visualización en mapa
3. NUNCA inventes datos si no vienen en resultados de Places
4. Si falta horario/precio/teléfono → di "No disponible"
5. Añade "Consultado en Google Places el [fecha]"

EJEMPLO - Usuario: "Busca restaurantes cerca del hotel"
→ Ejecutas:
  - search_places({ query: "restaurantes", nearLat: [coords hotel/destino], nearLng: [coords hotel/destino], radiusMeters: 1000 })
  - show_on_map({ lat: [coords], lng: [coords], title: "Restaurantes cerca del hotel" })
→ Respuesta: Basada SOLO en resultados de Places (nombre, rating, distancia, openNow)

EJEMPLO - Usuario: "Alternativas para hoy"
→ Ejecutas:
  - search_places({ query: "[tipo POI del día]", nearLat: [coords POI principal del día], nearLng: [coords POI], radiusMeters: 1500 })
  - show_on_map({ lat: [coords], lng: [coords], title: "Alternativas cerca" })

EJEMPLO - Usuario: "Cafeterías con wifi cerca de aquí"
→ Ejecutas:
  - search_places({ query: "cafeterías wifi", nearLat: [coords destino], nearLng: [coords destino], radiusMeters: 500, type: "cafe" })
  - show_on_map({ lat: [coords], lng: [coords], title: "Cafeterías con wifi" })

═══════════════════════════════════════════════════
HERRAMIENTA: create_agenda_item
═══════════════════════════════════════════════════
Cuando el usuario quiera planificar algo:
- Añade eventos a la agenda directamente
- Sugiere horarios lógicos basados en el contexto

EJEMPLO - Usuario: "Añade visitar el Prado mañana"
→ Ejecutas: create_agenda_item({ tripId: "...", date: "2024-XX-XX", title: "Visitar Museo del Prado", type: "culture", start: "10:00" })

═══════════════════════════════════════════════════
INFERENCIA DE COORDENADAS (USA SIEMPRE)
═══════════════════════════════════════════════════
- "cerca del hotel" / "cerca de donde me alojo" → usa coordenadas del destino o alojamiento
- "por la zona" / "cerca de aquí" / "en el centro" → usa coordenadas del destino
- "cerca de [lugar guardado]" → busca ese lugar en la lista y usa sus coordenadas
- Si no hay coordenadas específicas → USA las coordenadas del destino (SIEMPRE las tienes)

⚠️ NUNCA digas "no tengo coordenadas" o "necesito la ubicación"
⚠️ SIEMPRE tienes las coordenadas del destino en el contexto

═══════════════════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════════════════
1. Respuesta breve y útil (2-3 frases máximo)
2. Las herramientas se ejecutan automáticamente
3. El usuario verá botones para las acciones
4. Máximo 3 acciones por respuesta

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

  // Few-shot examples: ejemplos de interacciones ideales
  prompt += `

═══════════════════════════════════════════════════
EJEMPLOS DE INTERACCIONES IDEALES
═══════════════════════════════════════════════════

Usuario: "Busca restaurantes vegetarianos cerca del hotel"
Asistente: "¡Claro! Voy a buscar opciones vegetarianas cerca de tu alojamiento en ${trip?.destination || '[destino]'}."
Acciones ejecutadas:
- search_places({ query: "restaurantes vegetarianos ${trip?.destination || ''}", nearLat: [coords hotel], nearLng: [coords hotel], radiusMeters: 1000 })
- show_on_map({ lat: [coords], lng: [coords], title: "Restaurantes vegetarianos cerca" })
Respuesta: Lista nombre, distancia, rating, openNow. Si falta horario → "Horario no disponible"

Usuario: "Alternativas para hoy en el museo"
Asistente: "Voy a buscar museos y atracciones culturales cerca de [POI del día]."
Acciones ejecutadas:
- search_places({ query: "museos atracciones culturales", nearLat: [coords POI día], nearLng: [coords POI día], radiusMeters: 1500, type: "museum" })
- show_on_map({ lat: [coords], lng: [coords], title: "Alternativas culturales cerca" })
Respuesta: SOLO datos de Places. "Consultado en Google Places el [hoy]"

Usuario: "Añade el Museo del Prado mañana por la mañana"
Asistente: "Perfecto, he añadido la visita al Museo del Prado en tu agenda para mañana a las 10:00."
Acciones ejecutadas:
- create_agenda_item({ tripId: "...", date: "[fecha]", title: "Museo del Prado", type: "culture", start: "10:00" })

Usuario: "¿Cuánto dinero me queda del presupuesto?"
Asistente: "Has gastado ${contextPack.budget?.spent || 0}€ de tu presupuesto de ${contextPack.budget?.total || 'no definido'}. Te quedan ${contextPack.budget?.remaining || 'no calculado'}€ disponibles."
Acciones: Ninguna (respuesta informativa)

Usuario: "Busca algo como X cerca de Y"
Asistente: "Buscando lugares tipo X cerca de Y usando Google Places."
Acciones ejecutadas:
- search_places({ query: "X", nearLat: [coords Y], nearLng: [coords Y], radiusMeters: 2000 })
- show_on_map({ lat: [coords], lng: [coords], title: "Resultados: X cerca de Y" })
Respuesta: Máximo 8 resultados ordenados por distancia + rating + openNow

Usuario: "Muéstrame los lugares que tengo guardados en el mapa"
Asistente: "Tienes ${contextPack.places?.totalSaved || 0} lugares guardados. Te los muestro en el mapa."
Acciones ejecutadas:
- show_on_map({ lat: [coords destino], lng: [coords destino], title: "Tus lugares guardados" })

⚠️ Si el usuario pregunta por clima, horarios de atracciones, eventos actuales:
→ Responde: "No puedo buscar en internet, pero puedo recomendarte lugares verificados con Google Places. ¿Qué tipo de lugar buscas?"
`;

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

      // Construir historial y gestionarlo automáticamente
      let rawHistory =
        conversationHistory?.map((m) => ({
          role: m.role,
          content: m.content,
        })) || [];

      // Gestionar historial (resumir si es necesario)
      const managedHistory = await conversationSummary.manageConversationHistory(rawHistory);

      // Convertir a formato de Gemini
      const history = managedHistory.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      // Log de estadísticas de historial
      const historyStats = conversationSummary.getHistoryStats(rawHistory);
      console.log('[Copilot] Historial:', {
        messages: historyStats.messageCount,
        estimatedTokens: historyStats.estimatedTokens,
        percentOfLimit: `${historyStats.percentOfLimit}%`,
        summarized: rawHistory.length !== managedHistory.length,
      });

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 1.0, // Recomendación oficial para Gemini 2.0+
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

// ============================================
// ENDPOINT CON STREAMING (SSE)
// ============================================

/**
 * POST /api/copilot/stream
 * Chat con streaming de respuestas usando Server-Sent Events
 */
router.post(
  '/stream',
  async (req: Request<{}, {}, CopilotRequest>, res: Response): Promise<void> => {
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

      // Configurar SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Deshabilitar buffering en nginx

      // Función helper para enviar eventos SSE
      const sendSSE = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Construir prompt dinámico
      const systemPrompt = buildCopilotPrompt(contextPack);

      // Crear modelo con function calling
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: copilotFunctions as any }],
      });

      // Construir historial y gestionarlo automáticamente
      let rawHistory =
        conversationHistory?.map((m) => ({
          role: m.role,
          content: m.content,
        })) || [];

      // Gestionar historial (resumir si es necesario)
      const managedHistory = await conversationSummary.manageConversationHistory(rawHistory);

      // Convertir a formato de Gemini
      const history = managedHistory.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      // Log de estadísticas de historial
      const historyStats = conversationSummary.getHistoryStats(rawHistory);
      console.log('[Copilot/Stream] Historial:', {
        messages: historyStats.messageCount,
        estimatedTokens: historyStats.estimatedTokens,
        percentOfLimit: `${historyStats.percentOfLimit}%`,
        summarized: rawHistory.length !== managedHistory.length,
      });

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 1.0,
        },
      });

      // Enviar evento de inicio
      sendSSE('start', { message: 'Iniciando respuesta...' });

      // Enviar mensaje con streaming
      const result = await chat.sendMessageStream(message);

      let responseText = '';
      const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

      // Procesar chunks de streaming
      for await (const chunk of result.stream) {
        for (const candidate of chunk.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.text) {
              responseText += part.text;
              // Enviar cada chunk de texto al cliente
              sendSSE('token', { text: part.text });
            }
            if (part.functionCall) {
              functionCalls.push({
                name: part.functionCall.name,
                args: part.functionCall.args as Record<string, unknown>,
              });
            }
          }
        }
      }

      // Convertir function calls a acciones
      const actions = parseFunctionCallsToActions(functionCalls);

      const processingTimeMs = Date.now() - startTime;

      // Enviar evento de finalización con metadata y acciones
      sendSSE('complete', {
        message: responseText || 'No pude generar una respuesta.',
        actions,
        metadata: {
          confidence: actions.length > 0 ? 0.9 : 0.7,
          sourcesUsed: ['trip_context', ...(actions.some((a) => a.type === 'search_places') ? ['google_places'] : [])],
          processingTimeMs,
        },
      });

      // Cerrar conexión
      res.end();
    } catch (error) {
      console.error('Error en /copilot/stream:', error);

      // Enviar evento de error
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' })}\n\n`);
      res.end();
    }
  }
);

export default router;
