# Plan de Mejora: Viatio Copilot v2

## 📊 Análisis del Estado Actual

### Lo que YA tenemos funcionando:
- ✅ Chat con Gemini 2.0 Flash (modelo adecuado, mantener)
- ✅ Contexto básico: viaje, reservas, lugares, gastos
- ✅ OCR de documentos con visión
- ✅ Persistencia de conversaciones en SQLite (`conversacionesService.ts`)
- ✅ Google Places API integrada (búsqueda, detalles, fotos)
- ✅ Google Directions API integrada
- ✅ Sistema de configuración con AsyncStorage (`useConfiguracionStore`)
- ✅ Hook `useAssistantContext` para sugerencias por pantalla

### Lo que FALTA para ser un verdadero agente:
- ❌ Configuración específica del agente (tono, módulos, estilo)
- ❌ Respuestas con acciones ejecutables
- ❌ Integración real con Google Places desde el agente
- ❌ Context Pack completo (pantalla actual, día seleccionado, etc.)
- ❌ UI para historial de conversaciones tipo ChatGPT
- ❌ Comportamiento diferenciado por módulo (Agenda, Mapa, Detalle viaje)

---

## 🎯 Objetivos Refinados

1. **Pantalla de Configuración del Copilot** - El usuario personaliza el agente
2. **Context Pack enriquecido** - Información completa del estado actual
3. **Respuestas accionables** - Texto + botones que ejecutan acciones
4. **Integración con Google Places** - Sugerencias reales basadas en ubicación
5. **Historial de conversaciones** - Como ChatGPT, con lista y reanudación
6. **Módulos activos**: Chat propio, Agenda, Mapa, Detalle del viaje (NO reservas)

---

## ✅ TODOs - Plan de Implementación

### FASE 0: Configuración del Copilot (Nueva Pantalla) ✅ COMPLETADA
- [x] 0.1 Crear interfaz `CopilotPreferences` en `types/asistente.ts`
- [x] 0.2 Crear `useCopilotStore.ts` para persistir preferencias del agente
- [x] 0.3 Crear pantalla `CopilotSettingsScreen.tsx` con:
  - Módulos donde aparece (toggles: Agenda, Mapa, Detalle viaje, Chat propio)
  - Tono de respuestas (Profesional / Amigable / Conciso)
  - Longitud de respuestas (Breve / Normal / Detallada)
  - Idioma de respuestas (Mismo del dispositivo / Forzar español/inglés)
  - Preferencias de viaje (ritmo, intereses, restricciones alimentarias, movilidad)
- [x] 0.4 Añadir entrada "Configurar Copilot" en SettingsScreen
- [ ] 0.5 Crear migración para tabla `copilot_preferences` en SQLite (Usa AsyncStorage por ahora)

### FASE 1: Context Pack Completo ✅ COMPLETADA
- [x] 1.1 Crear interfaz `ContextPack` completa en `types/asistente.ts`:
  ```
  - app: { version, platform, locale, timezone }
  - user: { name, travelStyle[], pace, budget, mobility, food }
  - ui: { currentScreen, selectedTripId, selectedDayId, selectedPlaceId }
  - trip: { id, title, destination, dateRange, party, lodgingBase }
  - agenda: { days: [{ date, items: [...] }] }
  - reservations: [...] (solo como contexto, sin acciones)
  - places: { saved: [...] }
  - documents: [...]
  - expenses: { items: [...], total, budget }
  - capabilities: { availableActions[], canWriteData }
  ```
- [x] 1.2 Crear `contextPackBuilder.ts` que construya el pack dinámicamente
- [ ] 1.3 Modificar `chatStore.ts` para pasar pantalla actual y selecciones
- [x] 1.4 Incluir preferencias del usuario desde `useCopilotStore`

### FASE 2: Sistema de Acciones del Agente ✅ COMPLETADA
- [x] 2.1 Definir interfaz `AgentAction` en `types/asistente.ts`:
  ```typescript
  type ActionType =
    | 'create_agenda_item'    // Añadir evento a la agenda
    | 'search_places'         // Buscar lugares con Google Places
    | 'get_directions'        // Calcular ruta
    | 'add_place_to_saved'    // Guardar lugar
    | 'suggest_itinerary'     // Proponer itinerario completo
    | 'navigate_to'           // Navegar a otra pantalla
    | 'show_on_map';          // Mostrar punto en el mapa
  ```
- [x] 2.2 Crear interfaz `AgentResponse` (mensaje + actions[])
- [x] 2.3 Crear `actionExecutor.ts` que ejecute cada tipo de acción
- [x] 2.4 Crear componente `ActionButton.tsx` para renderizar acciones
- [x] 2.5 Confirmación integrada en `actionExecutor.ts` con Alert.alert
- [x] 2.6 Modificar `ChatBubble.tsx` para mostrar botones de acción al final del mensaje

### FASE 3: Integración con Google Places (Sugerencias Reales)
- [ ] 3.1 Crear `copilotPlacesService.ts` que use `googlePlacesService.ts`:
  - `suggestNearbyActivities(lat, lng, preferences)` → POIs cercanos
  - `suggestRestaurants(lat, lng, preferences)` → Restaurantes según restricciones
  - `getPointsOfInterest(destination, categories)` → Atracciones principales
- [ ] 3.2 Crear función `buildPlacesSuggestions()` para formatear resultados para el agente
- [ ] 3.3 Integrar en el backend para que Gemini pueda "llamar" a estas funciones (function calling)
- [ ] 3.4 Cachear resultados de Places para reducir llamadas a la API

### FASE 4: Prompt del Agente Mejorado
- [ ] 4.1 Reescribir `ASSISTANT_PROMPT` como "Viatio Copilot":
  - Personalidad configurable según preferencias del usuario
  - Instrucciones de formato JSON para acciones
  - Comportamiento diferenciado por `currentScreen`
- [ ] 4.2 Definir comportamiento por módulo:
  - **Agenda**: Detectar huecos, sugerir actividades, optimizar tiempos
  - **Mapa**: Sugerir rutas, POIs cercanos, crear listas de lugares
  - **Detalle viaje**: Visión global, checklist de preparación, itinerarios
  - **Chat propio**: Modo conversacional libre, planificación general
- [ ] 4.3 Implementar "siguiente mejor acción" basada en contexto
- [ ] 4.4 Añadir ejemplos de alternativas A/B en el prompt

### FASE 5: Herramientas del Backend (Function Calling)
- [ ] 5.1 Refactorizar `geminiService.ts` para usar function calling de Gemini
- [ ] 5.2 Definir tools disponibles:
  ```
  - viatio.searchPlaces({ query, nearLat, nearLng, categories })
  - viatio.getDirections({ origin, destination, mode })
  - viatio.suggestItinerary({ tripId, date, preferences })
  - viatio.getWeather({ destination, date }) // Opcional, API externa
  ```
- [ ] 5.3 Crear endpoint `/api/copilot` separado de `/api/assistant` actual
- [ ] 5.4 Implementar parsing de function calls y ejecución

### FASE 6: UI del Historial de Conversaciones
- [ ] 6.1 Crear `ConversationListScreen.tsx` (lista tipo ChatGPT):
  - Lista de conversaciones agrupadas por viaje
  - Conversaciones generales (sin viaje asociado)
  - Búsqueda en historial
  - Deslizar para eliminar
- [ ] 6.2 Modificar `AssistantScreen.tsx`:
  - Botón "Nueva conversación" en header
  - Botón "Historial" que navega a ConversationListScreen
  - Auto-guardar conversación al salir
- [ ] 6.3 Implementar reanudación de conversaciones:
  - Cargar mensajes previos
  - Restaurar contexto del viaje
  - Indicador visual de "conversación reanudada"
- [ ] 6.4 Añadir funcionalidad de renombrar conversación

### FASE 7: Integración por Módulo
- [ ] 7.1 En `TripDetailScreen`:
  - FAB que abre el Copilot con contexto del viaje
  - Sugerencias proactivas ("Tu viaje empieza en 3 días, ¿revisamos el checklist?")
- [ ] 7.2 En `TripAgendaScreen`:
  - Detectar días vacíos y sugerir actividades
  - Botón "Planificar con Copilot" en días sin eventos
  - Alertar sobre conflictos horarios
- [ ] 7.3 En `TripMapScreen`:
  - Sugerir rutas optimizadas entre lugares guardados
  - Botón "¿Qué hay cerca?" que consulta al Copilot
  - Crear lista de lugares desde sugerencias del Copilot
- [ ] 7.4 Actualizar `useAssistantContext` con sugerencias más inteligentes

---

## 📋 Detalle de Interfaces Clave

### CopilotPreferences (Fase 0.1)
```typescript
interface CopilotPreferences {
  // Módulos donde aparece el Copilot
  enabledModules: {
    agenda: boolean;      // default: true
    map: boolean;         // default: true
    tripDetail: boolean;  // default: true
    standalone: boolean;  // default: true (chat propio)
  };

  // Personalidad y estilo
  tone: 'professional' | 'friendly' | 'concise';  // default: 'friendly'
  responseLength: 'brief' | 'normal' | 'detailed'; // default: 'normal'
  language: 'device' | 'es' | 'en';               // default: 'device'
  useEmojis: boolean;                              // default: true

  // Preferencias de viaje (para sugerencias personalizadas)
  travelPreferences: {
    pace: 'relaxed' | 'balanced' | 'intense';     // default: 'balanced'
    interests: string[];   // ['cultura', 'gastronomía', 'naturaleza', 'aventura', ...]
    avoidances: string[];  // ['multitudes', 'madrugar', 'caminar mucho', ...]
    foodRestrictions: string[]; // ['vegetariano', 'sin gluten', 'halal', ...]
    mobilityLevel: 'full' | 'limited' | 'wheelchair'; // default: 'full'
    budget: 'budget' | 'moderate' | 'luxury';     // default: 'moderate'
  };
}
```

### AgentResponse (Fase 2.2)
```typescript
interface AgentResponse {
  message: string;           // Texto natural para el usuario
  actions: AgentAction[];    // 0-3 acciones propuestas
  metadata?: {
    confidence: number;      // 0.0 - 1.0
    sourcesUsed: string[];   // ['google_places', 'trip_context', ...]
  };
}

interface AgentAction {
  id: string;
  label: string;             // Texto del botón: "Añadir a agenda", "Ver en mapa"
  type: ActionType;
  requiresConfirmation: boolean;
  params: Record<string, unknown>;
  icon?: string;             // Icono Ionicons opcional
}
```

### Ejemplo de Respuesta del Copilot

**Usuario (en Mapa de Barcelona):** "¿Qué puedo visitar cerca del hotel?"

**Respuesta:**
```json
{
  "message": "Cerca de tu hotel (Hotel Ritz, Eixample) hay varias opciones interesantes:\n\n**Cultura:**\n• Casa Batlló (400m) - Obra maestra de Gaudí, imprescindible\n• La Pedrera (600m) - Otra joya modernista\n\n**Gastronomía:**\n• Cervecería Catalana (300m) - Tapas excelentes, rating 4.5\n• Tickets Bar (800m) - De los hermanos Adrià\n\n¿Te gustaría añadir alguno a tus lugares guardados o planificarlo para un día específico?",
  "actions": [
    {
      "id": "a1",
      "label": "Guardar Casa Batlló",
      "type": "add_place_to_saved",
      "requiresConfirmation": false,
      "params": { "placeId": "ChIJ...", "name": "Casa Batlló", "category": "attraction" },
      "icon": "bookmark-outline"
    },
    {
      "id": "a2",
      "label": "Ver todos en mapa",
      "type": "show_on_map",
      "requiresConfirmation": false,
      "params": { "places": ["ChIJ...", "ChIJ...", "ChIJ...", "ChIJ..."] },
      "icon": "map-outline"
    },
    {
      "id": "a3",
      "label": "Planificar visita mañana",
      "type": "create_agenda_item",
      "requiresConfirmation": true,
      "params": { "date": "2024-03-15", "title": "Visita Casa Batlló", "placeId": "ChIJ..." },
      "icon": "calendar-outline"
    }
  ],
  "metadata": {
    "confidence": 0.9,
    "sourcesUsed": ["google_places", "trip_context"]
  }
}
```

---

## 🔧 Consideraciones Técnicas

### Modelo
**Mantener `gemini-2.0-flash-exp`**:
- Gratuito durante preview
- Soporta function calling nativo
- Context window de 1M tokens
- Buena velocidad (~1-2s respuesta)

### Function Calling vs JSON Parsing
Usar function calling nativo de Gemini en lugar de pedir JSON en el prompt:
- Más fiable (menos errores de parsing)
- Gemini decide cuándo ejecutar herramientas
- Respuestas más naturales

### Límites de la API de Google Places
- 100,000 requests/mes en el plan gratuito
- Cachear resultados agresivamente (1h mínimo)
- Priorizar búsquedas por destino sobre coordenadas exactas

### Persistencia
- Preferencias del Copilot: AsyncStorage (simple key-value)
- Conversaciones: SQLite (ya implementado)
- Caché de Places: AsyncStorage con TTL

---

## 🚀 Orden de Implementación Recomendado

```
FASE 0 (Configuración)     ████████░░ 2-3 días
     ↓
FASE 1 (Context Pack)      ██████░░░░ 2 días
     ↓
FASE 2 (Sistema Acciones)  ████████░░ 3 días
     ↓
FASE 4 (Prompt)            ██████░░░░ 2 días
     ↓
FASE 5 (Backend Tools)     ████████░░ 3 días
     ↓
FASE 3 (Google Places)     ██████░░░░ 2 días
     ↓
FASE 6 (UI Historial)      ██████░░░░ 2 días
     ↓
FASE 7 (Integración)       ████████░░ 3 días
```

**Prioridad**: 0 → 1 → 2 → 4 → 5 → 3 → 6 → 7

La Fase 3 (Google Places) se puede hacer en paralelo con Fase 5 (Backend).

---

## 📱 Flujo de Usuario Final

1. **Configuración inicial**: Usuario abre Settings → Configurar Copilot → Ajusta preferencias
2. **En cualquier módulo habilitado**: Ve el FAB del Copilot con badge contextual
3. **Abre el Copilot**: Chat con contexto precargado según la pantalla
4. **Recibe sugerencias**: Texto + botones de acción
5. **Ejecuta acciones**: Un tap añade evento, guarda lugar, etc.
6. **Historial**: Puede ver, buscar y reanudar conversaciones anteriores

---

## Review

### Resumen
Plan v2 mejorado con:
- **Pantalla de configuración** para personalizar el Copilot
- **Módulos específicos**: Solo Agenda, Mapa, Detalle viaje y Chat propio (NO reservas)
- **Acciones ejecutables** con botones en las respuestas
- **Google Places integrado** para sugerencias reales
- **Historial tipo ChatGPT** con reanudación

### Diferencias vs Plan v1
| Aspecto | Plan v1 | Plan v2 |
|---------|---------|---------|
| Configuración usuario | No | Pantalla completa |
| Módulos | Todos | Solo 4 (sin reservas) |
| Google Places | Mencionado | Integración detallada |
| Historial | Básico | Como ChatGPT |
| Preferencias viaje | Básico | Detallado (ritmo, intereses, restricciones) |

### Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| Parsing de acciones falle | Fallback a texto plano si no hay JSON válido |
| Latencia alta | Caché agresivo de Places, optimistic UI updates |
| Límites API Places | Cachear 1h+, priorizar búsquedas generales |
| Prompt muy largo | Comprimir contexto por pantalla (solo datos relevantes) |

### Siguientes pasos
1. **Confirmar este plan** - ¿Algún ajuste antes de empezar?
2. **Empezar por Fase 0** - Configuración del Copilot (base para todo)
3. **Iterar incrementalmente** - Cada fase es testeable por separado
