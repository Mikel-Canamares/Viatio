# Plan de Mejora: Viatio Copilot v2

## 📊 Análisis del Estado Actual

### Lo que YA tenemos funcionando:
- ✅ Chat con Gemini 2.0 Flash (modelo adecuado, mantener)
- ✅ Contexto básico: viaje, reservas, lugares (gastos excluidos - módulo independiente)
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
  - capabilities: { availableActions[], canWriteData }
  - (gastos/expenses excluidos - módulo independiente del Copilot)
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

### FASE 3: Integración con Google Places (Sugerencias Reales) ✅ COMPLETADA
- [x] 3.1 Crear `copilotPlacesService.ts` que use `googlePlacesService.ts`:
  - `suggestNearbyActivities(lat, lng, preferences)` → POIs cercanos
  - `suggestRestaurants(lat, lng, preferences)` → Restaurantes según restricciones
  - `getPointsOfInterest(destination, categories)` → Atracciones principales
- [x] 3.2 Crear función `buildPlacesSuggestions()` para formatear resultados para el agente
- [x] 3.3 Integrar en el backend para que Gemini pueda "llamar" a estas funciones (function calling)
- [x] 3.4 Cachear resultados de Places para reducir llamadas a la API (AsyncStorage con TTL 1h)

### FASE 4: Prompt del Agente Mejorado ✅ COMPLETADA (integrado en Fase 3)
- [x] 4.1 Reescribir `ASSISTANT_PROMPT` como "Viatio Copilot":
  - Personalidad configurable según preferencias del usuario
  - Instrucciones de formato JSON para acciones
  - Comportamiento diferenciado por `currentScreen`
- [x] 4.2 Definir comportamiento por módulo:
  - **Agenda**: Detectar huecos, sugerir actividades, optimizar tiempos
  - **Mapa**: Sugerir rutas, POIs cercanos, crear listas de lugares
  - **Detalle viaje**: Visión global, checklist de preparación, itinerarios
  - **Chat propio**: Modo conversacional libre, planificación general
- [ ] 4.3 Implementar "siguiente mejor acción" basada en contexto
- [ ] 4.4 Añadir ejemplos de alternativas A/B en el prompt

### FASE 5: Herramientas del Backend (Function Calling) ✅ COMPLETADA
- [x] 5.1 Crear nuevo endpoint `/api/copilot` con function calling de Gemini
- [x] 5.2 Definir tools disponibles:
  - `create_agenda_item` - Añadir evento a la agenda
  - `search_places` - Buscar lugares
  - `add_place_to_saved` - Guardar lugar
  - `show_on_map` - Mostrar en mapa
  - `navigate_to` - Navegar a pantalla
  - `suggest_itinerary` - Proponer itinerario
- [x] 5.3 Crear `copilotService.ts` en frontend para comunicación con nuevo endpoint
- [x] 5.4 Implementar parsing de function calls y conversión a acciones

### FASE 6: UI del Historial de Conversaciones ✅ COMPLETADA
- [x] 6.1 Reescribir `ConversationHistoryList.tsx` (lista tipo ChatGPT):
  - Lista de conversaciones agrupadas por fecha (Hoy, Ayer, Esta semana, etc.)
  - Búsqueda en historial
  - Long-press para renombrar/eliminar
- [x] 6.2 Modificar `AssistantScreen.tsx`:
  - Header dinámico con título de conversación
  - Botón "Nueva conversación" en header
  - Navegación back al historial
- [x] 6.3 Implementar reanudación de conversaciones:
  - Cargar mensajes previos
  - Restaurar contexto del viaje
- [x] 6.4 Añadir funcionalidad de renombrar conversación (renameConversacion en store y service)

### FASE 7: Integración por Módulo ✅ COMPLETADA
- [x] 7.1 En `TripDetailScreen`:
  - CopilotFAB que navega a AssistantScreen con viajeId
- [x] 7.2 En `TripAgendaScreen`:
  - CopilotFAB que navega a AssistantScreen con viajeId (posición ajustada para botón "Añadir evento")
- [x] 7.3 En `TripMapScreen`:
  - CopilotFAB que navega a AssistantScreen con viajeId (posición bottom-left)
- [x] 7.4 Creado componente `CopilotFAB.tsx` reutilizable con animaciones Reanimated

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
1. ~~**Confirmar este plan** - ¿Algún ajuste antes de empezar?~~
2. ~~**Empezar por Fase 0** - Configuración del Copilot (base para todo)~~
3. ~~**Iterar incrementalmente** - Cada fase es testeable por separado~~

---

## Cambios Recientes (26/12/2024)

### Gastos/Presupuesto eliminados del Copilot
El módulo de gastos es independiente del asistente. Se eliminaron todas las referencias a gastos/presupuesto de:
- `contextPackBuilder.ts` - Ya no carga ni incluye gastos
- `asistente.ts` (tipos) - Eliminados gastoActual, presupuesto de ContextoViaje
- `assistantPrompt.ts` - Eliminadas referencias a presupuesto en el prompt y sugerencias
- `assistantService.ts` - Eliminados budget, currentExpense del contexto API
- `AssistantBottomSheet.tsx` - Ya no carga gastos
- `AssistantScreen.tsx` - Ya no carga gastos
- `viatio-backend/src/types/index.ts` - Eliminado expenses de CopilotRequest
- `viatio-backend/src/routes/copilot.ts` - Eliminada sección de gastos del prompt

### Fases 6 y 7 completadas
- UI de historial con agrupación por fecha, búsqueda y renombrado
- CopilotFAB integrado en TripDetail, Agenda y Map

### Correcciones de bugs (26/12/2024)

**Problema 1: Botón "Nueva conversación" no funcionaba**
- **Causa**: Al llamar `startNewConversation()`, los mensajes se limpiaban y `showHistorial` volvía a ser `true` (porque `showHistorial = !viajeId && mensajes.length === 0`)
- **Solución**: Añadido estado `forceShowChat` en `AssistantScreen.tsx` que se activa al pulsar "Nueva conversación" y permite mostrar el chat vacío
- **Archivos modificados**: `AssistantScreen.tsx`

**Problema 2: Copilot no usaba coordenadas para búsquedas contextuales**
- **Causa**: Los tipos `ContextoViaje` y `ContextoViajeAPI` no incluían coordenadas del destino ni de los lugares
- **Solución**:
  - Añadidas coordenadas a los tipos en `asistente.ts`
  - Actualizado `loadContexto` en `AssistantScreen.tsx` para obtener coordenadas del `destinoPlaceId` vía Google Places
  - Actualizado `contextPackBuilder.ts` para incluir `destinationCoords` en el ContextPack
  - Las coordenadas se incluyen en el resumen del prompt para que Gemini las use en búsquedas
- **Archivos modificados**: `asistente.ts`, `AssistantScreen.tsx`, `contextPackBuilder.ts`

**Problema 3: Copilot no usaba búsquedas automáticas con coordenadas**
- **Causa**: El prompt del backend no instruía al modelo para usar las coordenadas disponibles automáticamente
- **Solución**:
  - Actualizado `viatio-backend/src/routes/copilot.ts`:
    - Añadidas coordenadas del destino y alojamiento al prompt
    - Añadidas coordenadas de lugares guardados al prompt
    - Añadidas instrucciones explícitas para inferir ubicación ("cerca del hotel" → usar coords del hotel)
    - Reglas claras: NUNCA pedir coordenadas al usuario, siempre usar las del contexto
  - Actualizado `viatio-backend/src/types/index.ts`:
    - Añadido `destinationCoords` y `lodgingBase` al tipo `trip`
- **Archivos modificados**: `viatio-backend/src/routes/copilot.ts`, `viatio-backend/src/types/index.ts`

**Problema 4: Copilot no usaba el mapa como herramienta activa**
- **Causa**: El Copilot daba información textual pero no ejecutaba acciones automáticamente para mostrar lugares en el mapa
- **Solución**:
  - Reescrito el prompt del backend para enfatizar "ACTÚA, NO SOLO INFORMES"
  - Añadidas instrucciones de "COMBO OBLIGATORIO": search_places + show_on_map
  - Modificado `actionExecutor.ts`: search_places ahora navega al mapa automáticamente si hay resultados
  - Añadido useEffect en `AssistantScreen.tsx` que ejecuta acciones automáticas (search_places, show_on_map) sin necesidad de pulsar botón
- **Archivos modificados**:
  - `viatio-backend/src/routes/copilot.ts` - Prompt mejorado con instrucciones de herramientas
  - `viatio-app/src/services/ai/actionExecutor.ts` - search_places ahora llama a onShowOnMap
  - `viatio-app/src/screens/AssistantScreen.tsx` - Auto-ejecución de acciones

---

## 🚧 Copilot Temporalmente Desactivado (26/12/2024)

El Copilot está completamente implementado pero **oculto** hasta una fase más avanzada del desarrollo.

**Cambios realizados**:
- Tab "Asistente" en menú inferior: **comentado** en `RootTabs.tsx`
- CopilotFAB en `TripDetailScreen`: **comentado**
- CopilotFAB en `TripAgendaScreen`: **comentado**
- CopilotFAB en `TripMapScreen`: **comentado**

**Para reactivar**: Simplemente descomentar las líneas marcadas con `/* COPILOT TEMPORALMENTE DESACTIVADO */` en los archivos mencionados.

**Implementación mantenida**:
- ✅ Toda la lógica del Copilot permanece intacta
- ✅ Servicios, stores, tipos y componentes sin cambios
- ✅ Backend del Copilot funcional
- ✅ No se realizan llamadas a la API mientras está oculto

---

## 🤝 Integración de Viajes Compartidos (02/01/2026)

### Objetivo
Unificar la funcionalidad de viajes compartidos (antes en tab separado) con el flujo normal de viajes. Los usuarios crean viajes normalmente y pueden añadir personas desde TripDetail. Al compartir, el viaje se migra de SQLite a Firestore automáticamente.

### Cambios Completados

#### Fase 1: Modelo de Datos
- [x] Extendido tipo `Viaje` con `isShared`, `firestoreId`, `syncedAt`
- [x] Migración SQLite v13 añadida en `database/schema.ts`
- [x] Funciones `markViajeAsShared`, `getViajeByFirestoreId` en `viajesService.ts`

#### Fase 2: Servicio de Migración
- [x] Creado `services/migration/migrateTripToFirestore.ts` para migrar viajes completos de SQLite a Firestore (viaje + reservas + lugares + gastos)

#### Fase 3: UI en TripDetail
- [x] Creado `components/MembersSection.tsx` - muestra botón "Compartir viaje" o avatares de miembros
- [x] Creado `components/ShareTripModal.tsx` - modal de confirmación con progreso de migración
- [x] Integrado en `TripDetailScreen.tsx`

#### Fase 4: Gastos Integrados
- [x] Modificado `ExpensesScreen.tsx` - detecta `isShared` y muestra balances/liquidaciones si compartido
- [x] Modificado `AddExpenseScreen.tsx` - redirige a `AddSharedExpenseScreen` si viaje compartido

#### Fase 5: Navegación
- [x] Actualizado `navigation/types.ts` - eliminado Shared tab, añadidas rutas TripMembers, InviteToTrip, TripSettlements, RecordSettlement al HomeStack
- [x] Actualizado `RootTabs.tsx` - eliminado tab Shared
- [x] Actualizado `HomeStackNavigator.tsx` - añadidas pantallas de shared
- [x] Adaptadas pantallas `TripMembersScreen`, `InviteToTripScreen`, `TripSettlementsScreen`, `RecordSettlementScreen` para usar `firestoreId`

#### Fase 6: Hooks Unificados
- [x] Creado `hooks/useUnifiedTrip.ts` - acceso unificado a viajes locales y compartidos
- [x] Creado `hooks/useTripMembers.ts` - gestión de miembros de viajes compartidos

### Archivos Creados
| Archivo | Propósito |
|---------|-----------|
| `services/migration/migrateTripToFirestore.ts` | Migración completa SQLite→Firestore |
| `components/MembersSection.tsx` | Sección de miembros en TripDetail |
| `components/ShareTripModal.tsx` | Modal de confirmación para compartir |
| `hooks/useUnifiedTrip.ts` | Hook para datos unificados |
| `hooks/useTripMembers.ts` | Hook para gestión de miembros |

### Archivos Modificados
| Archivo | Cambios |
|---------|---------|
| `types/viaje.ts` | +3 campos (isShared, firestoreId, syncedAt) |
| `database/schema.ts` | Migración v13 |
| `services/viajesService.ts` | +4 funciones |
| `screens/TripDetailScreen.tsx` | +MembersSection, +ShareTripModal |
| `screens/ExpensesScreen.tsx` | Lógica condicional shared |
| `screens/AddExpenseScreen.tsx` | Redirección a shared |
| `navigation/types.ts` | -Shared tab, +4 rutas en HomeStack |
| `navigation/HomeStackNavigator.tsx` | +4 pantallas |
| `navigation/RootTabs.tsx` | -Shared tab |
| `screens/shared/TripMembersScreen.tsx` | Params actualizados |
| `screens/shared/InviteToTripScreen.tsx` | Params actualizados |
| `screens/shared/TripSettlementsScreen.tsx` | Params actualizados |
| `screens/shared/RecordSettlementScreen.tsx` | Params actualizados |

### Review

#### Resumen
Se ha integrado completamente la funcionalidad de viajes compartidos en el flujo normal. Ya no existe un tab separado "Compartido". Los usuarios:
1. Crean viajes normalmente (SQLite)
2. Desde TripDetail, pueden "Compartir viaje"
3. El viaje se migra a Firestore con todos sus datos
4. Los gastos muestran balances y liquidaciones automáticamente

#### Riesgos Potenciales
| Riesgo | Mitigación |
|--------|------------|
| Pérdida de datos en migración | El viaje local se mantiene, solo se marca como compartido |
| Conflictos de sincronización | Firestore es fuente de verdad para viajes compartidos |
| UX confusa para usuarios | MembersSection muestra claramente el estado |

#### Siguientes Pasos Sugeridos
1. **Testing manual**: Probar flujo completo de compartir → invitar → gastos compartidos
2. **Testing automático**: Añadir tests para `migrateTripToFirestore`
3. **Cleanup opcional**: Eliminar `SharedStackNavigator.tsx` y pantallas redundantes en `screens/shared/`
4. **Sincronización bidireccional**: Implementar sync de cambios de Firestore a SQLite (mejora futura)

### Cómo Probar
1. Crear viaje normal
2. Ir a TripDetail → ver botón "Compartir viaje" en sección de miembros
3. Pulsar → modal muestra preview de datos a migrar
4. Confirmar → progreso de migración → éxito
5. Ver avatares de miembros + botón "Invitar"
6. Navegar a Gastos → ver UI con balances (si hay otros miembros)
7. Añadir gasto → formulario con reparto entre participantes

---

## 🐛 Correcciones de Gastos Compartidos (03/01/2026)

### Problemas detectados
1. **Error `Cannot read property 'toDate' of null`** - Firestore emite documentos 2 veces al usar `serverTimestamp()`
2. **Error `Encountered two children with the same key`** - Keys duplicadas por el doble snapshot
3. **Gastos no tocables** - No se podía navegar al detalle para editar/eliminar
4. **Sin agrupación por categoría** - Los gastos compartidos aparecían en lista plana

### Soluciones implementadas

#### 1. Filtrar snapshots con timestamp pendiente
**Archivo**: `services/firestore/expensesService.ts`
- En `subscribeToExpenses`, añadido filtro antes del map:
  ```typescript
  .filter(docSnap => docSnap.data().createdAt !== null)
  ```
- Añadido optional chaining con fallback en conversión de timestamps:
  ```typescript
  const createdAt = data.createdAt?.toDate() ?? new Date();
  ```

#### 2. Gastos tocables + Agrupación por categoría
**Archivo**: `screens/ExpensesScreen.tsx`
- Añadido handler `handleExpensePress` que navega a `ExpenseDetail`
- Añadido mapeo de categorías inglés→español (`categoryToSpanish`)
- Añadido agrupación `sharedExpensesPorCategoria` (igual que viajes individuales)
- Reemplazado render de lista plana por grupos con header de categoría
- Cada gasto es ahora un `Pressable` que navega al detalle
- Corregido useEffect para cargar miembros antes de suscribirse

#### 3. Navegación a ExpenseDetail
**Archivo**: `navigation/types.ts`
- Añadida ruta `ExpenseDetail: { tripId: string; expenseId: string }` a `HomeStackParamList`

**Archivo**: `navigation/HomeStackNavigator.tsx`
- Importado `ExpenseDetailScreen`
- Añadido `<Stack.Screen name="ExpenseDetail" />`

### Archivos Modificados
| Archivo | Cambios |
|---------|---------|
| `services/firestore/expensesService.ts` | Filtro de snapshots pendientes, optional chaining |
| `screens/ExpensesScreen.tsx` | Handler navegación, agrupación por categoría, nuevos estilos |
| `navigation/types.ts` | +ExpenseDetail en HomeStackParamList |
| `navigation/HomeStackNavigator.tsx` | +import y Screen de ExpenseDetail |

### Verificación
- [x] Crear gasto → no error de keys duplicadas
- [x] Tocar gasto → navega a ExpenseDetail
- [x] Gastos agrupados por categoría con totales
- [x] Botones editar/eliminar visibles en detalle
- [x] Liquidaciones se actualizan en tiempo real

---

## 💳 Mejora de Controles de Pago en Reservas (17/01/2026)

### Objetivo
Unificar la UI de registro de pagos en reservas compartidas con la de gastos compartidos.

### Cambios Realizados

**Archivo modificado**: `screens/AddReservationScreen.tsx`

1. **Importaciones actualizadas**:
   - Añadido `Dropdown`, `DropdownOption`, `ParticipantCheckboxList`
   - Añadido `DatePickerInput`
   - Eliminados `MemberChipsSelector` y `SplitMethodSelector`

2. **Nuevos estados y opciones**:
   - `paidDate`: Estado para la fecha de pago
   - `paidByOptions`: Opciones de dropdown para "Pagado por"
   - `splitMethodOptions`: Opciones de dropdown para método de reparto (Igualmente, Partes, Como montos)

3. **Nuevas funciones**:
   - `handleToggleParticipant`: Toggle de selección de participante
   - `handleAmountChange`: Cambio de monto individual para método 'exact'
   - `calculateAmounts`: Cálculo de montos por participante según método

4. **Nueva UI de pago compartido**:
   - Fila con Dropdown "Pagado por" + DatePickerInput "Cuando"
   - Dropdown "Dividir" con icono para cada método
   - `ParticipantCheckboxList` con checkboxes, nombres y montos
   - `SharesEditor` solo visible para métodos 'shares' y 'percentage'

### Verificación
- [x] Compilación TypeScript sin errores
- [ ] Probar en viaje compartido con reserva de estado "Pagado"
- [ ] Verificar que se muestran los miembros en el dropdown
- [ ] Verificar que el método de reparto calcula correctamente
- [ ] Verificar que los montos se actualizan al cambiar participantes

---

## 💱 Conversión de Divisas en Gastos Compartidos (17/01/2026)

### Objetivo
Implementar conversión automática de divisas en la pantalla de gastos compartidos para mostrar los importes en la moneda configurada en el perfil del usuario.

### Cambios Realizados

**Archivo modificado**: `screens/ExpensesScreen.tsx`

1. **Nuevos imports**:
   - `useConfiguracionStore` - Para obtener la moneda del perfil del usuario
   - `formatCurrency` - Para formatear las cantidades convertidas

2. **Nuevos estados**:
   - `convertedMyExpenses`: Conversión de "Mis Gastos" a la moneda del perfil
   - `convertedSharedTotal`: Conversión de "Gastos Totales" a la moneda del perfil
   - `expenseConversions`: Record con conversiones de balance individual para cada gasto

3. **Carga de tasas de cambio**:
   - Modificado `loadViaje()` para cargar tasas usando `userCurrency` (moneda del perfil) en lugar de la moneda del viaje

4. **Conversión de totales** (nuevo useEffect):
   - Convierte "Mis Gastos" y "Gastos Totales" cuando la moneda del viaje difiere de la del perfil
   - Solo convierte cuando `tripCurrency !== userCurrency`
   - Maneja céntimos correctamente (divide por 100 antes de convertir)

5. **Conversión de balances individuales** (nuevo useEffect):
   - Para cada gasto, convierte el balance individual (myImpact) a la moneda del perfil
   - Almacena conversiones en un Record indexado por expense.id
   - Solo convierte si hay impacto diferente de 0

6. **UI actualizada**:
   - **Resumen**: Muestra conversión debajo de "Mis Gastos" y "Gastos Totales" con formato `≈ {monto convertido}`
   - **Gastos individuales**: Muestra conversión del balance debajo del badge de impacto con formato `≈ +/-{monto convertido}`

7. **Nuevos estilos**:
   - `summaryConverted`: Estilo para conversión en resumen (12px, itálica, gris)
   - `expenseConversion`: Estilo para conversión en gastos individuales (10px, itálica, gris)

### Ejemplo Visual

**Antes**:
```
Mis Gastos          Gastos Totales
0 JPY               10 JPY
```

**Después** (con moneda del perfil = EUR):
```
Mis Gastos          Gastos Totales
0 JPY               10 JPY
≈ 0.00 €            ≈ 0.06 €
```

**Gasto individual**:
```
Ferry isla
Pagó Mikel 1                10 JPY
                            -5 JPY
                            ≈ -0.03 €  ← NUEVO
```

### Corrección (17/01/2026 - 2da iteración)

Se corrigió la implementación según los requisitos reales:

**Cambios**:
1. **"Mis Gastos" y "Gastos Totales"**: Ahora muestran directamente el monto convertido a la moneda del perfil (no la moneda del viaje con conversión debajo)
   - Ejemplo: Si el viaje es en JPY y el perfil en EUR, muestra "0.06 €" en lugar de "10 JPY ≈ 0.06 €"

2. **Total de categoría**: Muestra el total ya convertido a la moneda del perfil
   - Ejemplo: "Transporte" muestra "0.06 €" en lugar de "10 JPY"

3. **Gastos individuales**:
   - Monto principal: Se mantiene en la moneda original del gasto (ej: "10 JPY")
   - Debajo: Muestra la conversión "≈ 0.06 €"
   - **NO se muestra el balance** (se eliminó el badge de +/- impacto)

**Estados modificados**:
- Eliminado: `expenseConversions` (conversiones de balances)
- Añadido: `convertedCategoryTotals` (totales de categoría convertidos)
- Añadido: `expenseAmountConversions` (conversiones de montos individuales)

**Estilos eliminados**:
- `summaryConverted` (ya no se usa)
- `expenseImpactBadge`, `impactBadgePositive`, `impactBadgeNegative` (se eliminó el badge de impacto)
- `expenseImpact`, `impactPositive`, `impactNegative`

### Corrección (17/01/2026 - 3ra iteración)

Se implementaron mejoras adicionales según los requisitos:

**Cambios**:
1. **Formato de conversión**: Ahora usa 3 decimales en lugar de 2 para mayor precisión
   - Modificado en `ExpensesScreen.tsx`: `formatCurrency(amount, currency, { decimals: 3 })`

2. **Balances convertidos**:
   - Añadido estado `convertedBalances` que convierte todos los balances a la moneda del perfil
   - Los balances ahora se muestran directamente en EUR (o moneda del perfil)
   - Se convierten: `totalPaid`, `totalOwed` y `netBalance`

3. **Liquidaciones convertidas** (`TripSettlementsScreen.tsx`):
   - Añadidos imports: `useConfiguracionStore`, `useCurrencyStore`, `getViajeById`
   - Añadidos estados: `viaje`, `convertedSuggestions`, `convertedSettlements`
   - Nuevos useEffect que convierten sugerencias y settlements a la moneda del perfil
   - Todos los montos se muestran en EUR (o moneda del perfil)

4. **Registro de pagos** (`RecordSettlementScreen.tsx`):
   - Añadido import: `useConfiguracionStore`
   - El formulario ahora muestra la moneda del perfil (EUR)
   - El campo de importe usa 3 decimales: `.toFixed(3)`
   - El "Sugerido" se muestra en la moneda del perfil

**Archivos modificados**:
- `screens/ExpensesScreen.tsx` - Formato 3 decimales + balances convertidos
- `screens/shared/TripSettlementsScreen.tsx` - Conversión completa de liquidaciones
- `screens/shared/RecordSettlementScreen.tsx` - Formulario con moneda del perfil

### Verificación
- [x] Compilación TypeScript sin errores
- [ ] Probar con viaje en JPY y perfil en EUR
- [ ] Verificar que "Mis Gastos" y "Gastos Totales" muestran montos en EUR directamente
- [ ] Verificar que totales de categoría muestran montos en EUR
- [ ] Verificar que gastos individuales muestran monto original + conversión (3 decimales) debajo
- [ ] Verificar que NO se muestran balances (+/- impacto) en los gastos
- [ ] Verificar que balances se muestran en EUR
- [ ] Verificar que liquidaciones (sugerencias + pagos) se muestran en EUR
- [ ] Verificar que el formulario de registro de pago muestra EUR y usa 3 decimales

---

## 🐛 Duplicación de Eventos/Reservas/Lugares al Compartir Viaje (17/01/2026)

### Problema Detectado
Al compartir un viaje y descargarlo con otra cuenta, todos los eventos, reservas y lugares se duplican (aparecen 2 veces cada uno).

### Análisis del Problema

He identificado el flujo completo del problema:

**1. Migración de SQLite a Firestore** ([migrateTripToFirestore.ts:234-350](viatio-app/src/services/migration/migrateTripToFirestore.ts#L234-L350))
- La función `migrateTripToFirestore` crea documentos en Firestore con un campo `localId` que guarda el ID original de SQLite
- Los documentos en Firestore usan IDs autogenerados diferentes al `localId`

**2. Sincronización Realtime** ([syncRealtimeReservations.ts:84-152](viatio-app/src/services/sync/syncRealtimeReservations.ts#L84-L152), [syncRealtimePlaces.ts:84-156](viatio-app/src/services/sync/syncRealtimePlaces.ts#L84-L156), [syncRealtimeEvents.ts:89-148](viatio-app/src/services/sync/syncRealtimeEvents.ts#L89-L148))
- Los listeners de sincronización procesan el snapshot inicial de Firestore
- **PROBLEMA CLAVE**: Usan `INSERT OR REPLACE` con el `localId` de Firestore como ID en SQLite:
  ```typescript
  const id = resData.localId || firestoreId;  // Línea 234
  await db.runAsync(`INSERT OR REPLACE INTO reservas (id, ...) VALUES (?, ...)`, [id, ...])
  ```
- Cuando un segundo usuario descarga el viaje compartido:
  - Ya tiene los datos originales en SQLite con IDs como `"abc123"`
  - Recibe de Firestore documentos con `localId = "abc123"` pero `firestoreId = "xyz789"`
  - El código intenta insertar con `id = "abc123"` (del `localId`)
  - **PERO** la consulta de verificación busca por `firestoreId`:
    ```typescript
    const existing = await db.getFirstAsync('SELECT id FROM reservas WHERE firestoreId = ?', [firestoreReservationId])
    ```
  - Como no encuentra ningún registro con `firestoreId = "xyz789"`, cree que es nuevo
  - Inserta un nuevo registro con `id = "abc123"` y `firestoreId = "xyz789"`
  - El registro original con `id = "abc123"` y `firestoreId = NULL` queda intacto
  - **RESULTADO: Duplicación**

### Causa Raíz
La lógica de sincronización tiene una **inconsistencia entre el criterio de verificación y el criterio de inserción**:
- Verifica existencia por `firestoreId`
- Inserta usando `localId` como `id`

Esto causa que cuando un usuario descarga un viaje compartido que él mismo creó (o que contiene datos que ya existen localmente), los datos se dupliquen.

### Solución Propuesta

**Opción 1: Verificar por ID local primero (RECOMENDADA)**
En los listeners de sincronización, verificar primero si existe un registro con el `localId` antes de verificar por `firestoreId`:

```typescript
// En createLocalReserva, createLocalPlace, createLocalEvent
const id = resData.localId || firestoreId;

// Verificar primero por localId
const existingByLocalId = await db.getFirstAsync(
  'SELECT id, firestoreId FROM reservas WHERE id = ?',
  [id]
);

if (existingByLocalId) {
  // Ya existe con este ID local
  if (!existingByLocalId.firestoreId) {
    // Es un registro local sin firestoreId, actualizarlo
    await db.runAsync(
      'UPDATE reservas SET firestoreId = ?, updatedAt = ? WHERE id = ?',
      [firestoreId, now, id]
    );
  }
  // Luego actualizar el resto de campos
  await updateLocalReserva(id, resData, viajeId, diasMap, placeIdMap);
} else {
  // No existe, verificar por firestoreId (por si fue creado por otro usuario)
  const existingByFirestore = await db.getFirstAsync(
    'SELECT id FROM reservas WHERE firestoreId = ?',
    [firestoreId]
  );

  if (existingByFirestore) {
    await updateLocalReserva(existingByFirestore.id, resData, viajeId, diasMap, placeIdMap);
  } else {
    // Realmente nuevo, insertar
    await db.runAsync('INSERT INTO reservas (...) VALUES (...)', [...]);
  }
}
```

**Opción 2: Limpiar registros sin firestoreId antes de sincronizar**
Antes de iniciar la sincronización, eliminar todos los registros locales que no tengan `firestoreId` para ese viaje.

**Opción 3: Usar UPSERT con clave compuesta**
Modificar la lógica para usar una clave única compuesta que considere tanto el `id` como el `firestoreId`.

### Plan de Implementación

- [x] **Paso 1**: Modificar `syncRealtimeReservations.ts` - Implementar verificación por `localId` primero ✅
- [x] **Paso 2**: Modificar `syncRealtimePlaces.ts` - Implementar verificación por `localId` primero ✅
- [x] **Paso 3**: Modificar `syncRealtimeEvents.ts` - Implementar verificación por `localId` primero ✅
- [x] **Paso 4**: Compilación TypeScript sin errores ✅
- [ ] **Paso 5**: Probar flujo completo:
  - Crear viaje con 2 reservas, 2 lugares, 2 eventos
  - Compartir viaje
  - Entrar con otra cuenta
  - Descargar viaje compartido
  - Verificar que NO se duplican los datos
- [ ] **Paso 6**: Probar caso de usuario que ya tiene datos locales y descarga el viaje compartido
- [ ] **Paso 7**: (Opcional) Crear migración de limpieza para usuarios que ya tienen duplicados

### Cambios Implementados (17/01/2026)

**1. syncRealtimeReservations.ts**
- Añadido import de `SQLite` de `expo-sqlite`
- Creada función `syncReserva()` con verificación doble:
  - Paso 1: Busca por `localId`, si existe y no tiene `firestoreId`, lo vincula
  - Paso 2: Si no existe por `localId`, busca por `firestoreId`
  - Paso 3: Si no existe de ninguna manera, crea nuevo registro
- Reemplazada lógica de verificación en snapshots inicial y posteriores

**2. syncRealtimePlaces.ts**
- Añadido import de `SQLite` de `expo-sqlite`
- Creada función `syncPlace()` con verificación doble (misma lógica que reservas)
- Retorna el `localId` para actualizar referencias en reservas
- Reemplazada lógica de verificación en snapshots inicial y posteriores

**3. syncRealtimeEvents.ts**
- Añadido import de `SQLite` de `expo-sqlite`
- Creada función `syncEvent()` con verificación doble (misma lógica que reservas)
- Reemplazada lógica de verificación en snapshots inicial y posteriores

### Corrección Adicional (17/01/2026 - 2da iteración)

**Problema encontrado**: La solución inicial arreglaba la sincronización en tiempo real, pero **el problema también estaba en la descarga inicial** (`syncDownload.ts`).

**4. syncDownload.ts**
- Modificadas funciones `createLocalLugar`, `createLocalReserva`, `createLocalEvento`
- Ahora usan el `localId` de Firestore en lugar de generar un ID nuevo
- Verifican si ya existe un registro con ese `localId` antes de insertar
- Si existe, actualizan en lugar de duplicar
- Si no existe, insertan normalmente

### Corrección Adicional (17/01/2026 - 3ra iteración)

**Problema encontrado**: Los eventos personalizados **no se estaban migrando a Firestore** durante el proceso de compartir viaje.

**5. migrateTripToFirestore.ts**
- Añadido import de `getEventosByViajeId` y tipo `EventoPersonalizado`
- Añadida fase `'events'` al tipo `MigrationProgress`
- Añadido `events` a las estadísticas de `MigrationResult`
- Modificada función principal para cargar y migrar eventos
- Creada función `migrateEvento()` para migrar eventos a Firestore
- Ajustados contadores de progreso (de 4 a 5 fases totales)

### Corrección Adicional (19/01/2026 - 4ta iteración)

**Problema encontrado**: Los eventos se migraban correctamente pero **no se vinculaban al día correcto** al descargar el viaje compartido. El `diaId` quedaba en `null`.

**Causa raíz**: Cada usuario tiene sus propios IDs de días en SQLite. Cuando User1 migraba el viaje, guardaba el ID del día de su SQLite en Firestore. Cuando User2 descargaba, tenía IDs de días completamente diferentes, por lo que el mapeo fallaba.

**Primera solución intentada**: Mapear por fecha Y por ID
- Modificada función `buildDiasMap()` en `syncRealtimeEvents.ts` y `syncRealtimePlaces.ts`
- El mapa tenía entradas por fecha y por ID
- **PROBLEMA**: No funciona porque User2 tiene IDs diferentes para sus días

**Solución definitiva (19/01/2026)**: Guardar **fecha** en lugar de **ID** en Firestore
- Modificada `migrateTripToFirestore.ts` para convertir `diaId` (ID del día) a `fecha` antes de guardar en Firestore
- Añadido `getDiasByViajeId` para construir mapa de conversión `diaId → fecha`
- Las funciones `migrateLugar()` y `migrateEvento()` ahora reciben el mapa y convierten el ID a fecha
- Los lugares y eventos se guardan con `diaId: "2026-01-22"` (fecha) en lugar de `diaId: "abc123"` (ID)
- Esto asegura que `buildDiasMap()` en User2 pueda mapear correctamente por fecha (que es consistente entre usuarios)

### Archivos Modificados
- [syncRealtimeReservations.ts](viatio-app/src/services/sync/syncRealtimeReservations.ts) - +68 líneas (verificación doble)
- [syncRealtimePlaces.ts](viatio-app/src/services/sync/syncRealtimePlaces.ts) - +73 líneas (verificación doble + mapeo dual)
- [syncRealtimeEvents.ts](viatio-app/src/services/sync/syncRealtimeEvents.ts) - +70 líneas (verificación doble + mapeo dual)
- [syncDownload.ts](viatio-app/src/services/sync/syncDownload.ts) - +138 líneas (3 funciones modificadas)
- [migrateTripToFirestore.ts](viatio-app/src/services/migration/migrateTripToFirestore.ts) - +50 líneas (migración de eventos + conversión ID→fecha)

### Riesgos
- **Bajo**: La lógica de verificación doble (por `localId` y `firestoreId`) es compatible con datos existentes
- **Medio**: Si hay datos ya duplicados, seguirán duplicados (necesitaría limpieza manual o migración)

### Notas Adicionales
- Este bug afecta solo a viajes compartidos
- Los viajes locales no compartidos funcionan correctamente
- El problema se manifiesta solo cuando el usuario que descarga el viaje compartido ya tiene datos locales con los mismos IDs

---

## Sistema de Notificaciones Integral (23/01/2026)

### Objetivo
Optimizar y expandir el sistema de notificaciones de Viatio para:
1. Alinear notificaciones locales con la arquitectura Firebase existente
2. Implementar notificaciones para el módulo de gastos
3. Añadir notificaciones in-app (banners)
4. Mejorar el control granular del usuario
5. Optimizar costes de Firebase

### Cambios Completados

#### FASE 1: Preferencias Expandidas
- [x] Expandir `PreferenciasNotificaciones` en `types/perfil.ts`:
  - Master switch `notificacionesActivas`
  - Alertas de presupuesto con umbrales (50%, 75%, 90%)
  - Preferencias de gastos compartidos (nuevoGasto, gastoEditado, etc.)
  - Modo silencio ('off', 'urgent_only', 'all')
  - Horario de silencio configurable
- [x] Actualizar `perfilService.ts`:
  - Migración automática de preferencias antiguas
  - Funciones `shouldSendNotification()`, `isInSilentHours()`
  - Tracking de último umbral notificado por viaje
- [x] Rediseñar `NotificationsSettingsScreen.tsx`:
  - Sección "Viajes y Reservas"
  - Sección "Presupuesto" con selector de umbral
  - Sección "Gastos Compartidos" (5 toggles)
  - Sección "Control de Notificaciones" (modo silencio + horario)
  - Master switch prominente

#### FASE 2: Notificaciones de Presupuesto
- [x] Crear `budgetNotificationsService.ts`:
  - `checkBudgetAndNotify()` - verifica umbral y envía notificación local
  - Control de duplicados (no notificar el mismo umbral 2 veces)
  - Formatos de moneda y mensajes personalizados
- [x] Integrar en `gastosStore.ts`:
  - Llamada a `checkBudgetAndNotify()` después de añadir gasto
  - Carga automática del viaje y resumen para el cálculo

#### FASE 3: Notificaciones In-App (Banners)
- [x] Crear `InAppNotificationBanner.tsx`:
  - Componente animado con slide desde arriba
  - Auto-dismiss en 4 segundos
  - Iconos y colores según tipo de notificación
  - Botón de cierre manual
- [x] Crear `NotificationBannerContext.tsx`:
  - Provider que escucha notificaciones en primer plano
  - Cola de notificaciones (muestra una a la vez)
  - Respeta modo silencio y horario
- [x] Integrar en `App.tsx`

#### FASE 4: Cloud Functions para Gastos Compartidos
- [x] Crear `functions/src/expenses.ts`:
  - `onExpenseCreated` - notifica cuando alguien añade gasto
  - `onExpenseUpdated` - notifica cambios significativos
  - `onExpenseDeleted` - notifica eliminación
- [x] Crear `functions/src/settlements.ts`:
  - `onSettlementCreated` - notifica solicitud de pago
  - `onSettlementUpdated` - notifica pago completado
- [x] Crear `functions/src/utils/rateLimiter.ts`:
  - Límite 50 notificaciones/usuario/día
  - Límite 30 notificaciones/viaje/día
  - Deduplicación (5 minutos)

#### FASE 5: Deep Linking Expandido
- [x] Actualizar `notificationNavigation.ts`:
  - Nuevos tipos: budget_warning, expense_*, settlement_*, trip_invite
  - Navegación a ExpenseDetail, TripSettlements, etc.
  - Función `navigateToNotification()` para uso desde banners

#### FASE 6: Cleanup y Optimización
- [x] Crear `functions/src/cleanup.ts`:
  - `cleanupInactiveTokens` - limpia tokens sin usar >30 días (domingos 3AM)
  - `cleanupRateLimitCounters` - limpia contadores antiguos (diario 4AM)
  - `cleanupExpiredNotifications` - limpia notificaciones >30 días (lunes 5AM)

### Archivos Creados
| Archivo | Propósito |
|---------|-----------|
| `services/budgetNotificationsService.ts` | Alertas de presupuesto |
| `components/InAppNotificationBanner.tsx` | Banner animado |
| `context/NotificationBannerContext.tsx` | Provider para banners |
| `functions/src/expenses.ts` | Triggers de gastos |
| `functions/src/settlements.ts` | Triggers de liquidaciones |
| `functions/src/utils/rateLimiter.ts` | Rate limiting |
| `functions/src/cleanup.ts` | Limpieza automática |

### Archivos Modificados
| Archivo | Cambios |
|---------|---------|
| `types/perfil.ts` | +4 interfaces, +3 constantes, +40 líneas |
| `services/perfilService.ts` | +7 funciones, +100 líneas |
| `screens/NotificationsSettingsScreen.tsx` | Rediseño completo (+220 líneas) |
| `store/gastosStore.ts` | Integración presupuesto |
| `utils/notificationNavigation.ts` | Nuevos tipos y rutas |
| `App.tsx` | +NotificationBannerProvider |
| `functions/src/index.ts` | Re-exportar nuevas funciones |

### Review

#### Resumen
Sistema de notificaciones integral implementado con:
- **Estrategia híbrida**: Local (viajes, presupuesto) + Push (gastos compartidos)
- **Control granular**: 15+ toggles configurables por el usuario
- **Anti-invasivo**: Master switch, modo silencio, horario silencio
- **Optimización de costes**: Rate limiting, deduplicación, cleanup automático

#### Decisiones Tomadas
| Decisión | Valor |
|----------|-------|
| Umbrales presupuesto | 50%, 75%, 90% |
| Default gastos compartidos | Activadas |
| Digest diario | No (fase futura) |
| Acciones en notificaciones | Solo navegación |

#### Verificación
- [x] TypeScript compila sin errores (viatio-app)
- [x] TypeScript compila sin errores (functions)
- [ ] Probar preferencias en dispositivo
- [ ] Probar alerta de presupuesto al añadir gasto
- [ ] Probar banner in-app
- [ ] Deploy Cloud Functions y probar push compartidos
- [ ] Probar deep linking desde notificaciones

#### Próximos Pasos
1. **Deploy Functions**: `firebase deploy --only functions`
2. **Pruebas manuales**: Seguir checklist de verificación
3. **Ajustar umbrales**: Si rate limiting es muy agresivo, ajustar
4. **Digest (futuro)**: Implementar resumen diario opcional

---

## 🔄 Corrección de Logs Repetitivos en Módulo de Gastos (23/01/2026)

### Problema Detectado
Al entrar al módulo de gastos de un viaje, se observaban logs repetitivos que generaban ruido en la consola y posibles recargas innecesarias:

```
LOG  [TripDetail] Reservas actualizadas, recargando stats...
ERROR  Error obteniendo tasas de Frankfurter: [TypeError: Network request failed]
ERROR  Error obteniendo tasas: [TypeError: Network request failed]
WARN  Usando caché antigua de tasas debido a error de API
LOG  [DEBUG calculateSettlementSuggestions] Completed settlements: 0
LOG  [DEBUG calculateSettlementSuggestions] Pending settlements: 0
LOG  [DEBUG calculateSettlementSuggestions] Balances received: [...]
LOG  [DEBUG calculateSettlementSuggestions] Adjusted balances: [...]
LOG  [DEBUG calculateSettlementSuggestions] Debtors: []
LOG  [DEBUG calculateSettlementSuggestions] Creditors: []
LOG  [DEBUG calculateSettlementSuggestions] Final suggestions: []
```

### Análisis de Causas

#### 1. Recargas múltiples de stats en TripDetailScreen
- Los callbacks `handleReservationsChange` y `handlePlacesChange` se ejecutaban inmediatamente al detectar cambios
- Esto causaba múltiples llamadas consecutivas a `getViajeStats()`
- Sin debounce, cada evento de sincronización disparaba una recarga

#### 2. Logs de error repetitivos por API de divisas
- El servicio `currencyService.ts` logueaba errores de red cada vez que fallaba la API de Frankfurter
- En modo offline o con mala conexión, esto generaba múltiples logs de error
- Aunque el servicio tenía fallback a caché, los errores se logueaban igualmente

#### 3. Logs de debug en calculateSettlementSuggestions
- La función `calculateSettlementSuggestions` en `expensesService.ts` contenía 7 console.log de DEBUG
- Esta función se ejecuta en múltiples flujos del store (10 lugares diferentes)
- Cada operación de gastos o liquidaciones generaba múltiples logs

### Soluciones Implementadas

#### 1. Debounce en TripDetailScreen ([TripDetailScreen.tsx:68-108](viatio-app/src/screens/TripDetailScreen.tsx#L68-L108))

**Cambios**:
- Añadido ref `reloadStatsTimeoutRef` para controlar el timeout de debounce
- Modificados callbacks para usar debounce de 500ms antes de ejecutar `getViajeStats()`
- Si llega un nuevo cambio mientras hay uno pendiente, se cancela el anterior
- Añadido cleanup del timeout al desmontar el componente

**Código**:
```typescript
const reloadStatsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleReservationsChange = useCallback(() => {
  console.log('[TripDetail] Reservas actualizadas, programando recarga de stats...');

  if (reloadStatsTimeoutRef.current) {
    clearTimeout(reloadStatsTimeoutRef.current);
  }

  reloadStatsTimeoutRef.current = setTimeout(() => {
    console.log('[TripDetail] Ejecutando recarga de stats');
    getViajeStats(viajeId).then(setStats).catch(console.error);
  }, 500);
}, [viajeId]);
```

**Beneficios**:
- Reduce llamadas múltiples consecutivas a una sola
- Mejora el rendimiento en sincronización de viajes compartidos
- Logs más limpios y legibles

#### 2. Silenciar logs de error de red en currencyService ([currencyService.ts:81-104](viatio-app/src/services/currencyService.ts#L81-L104))

**Cambios**:
- En `fetchExchangeRates`: Solo loguear errores si NO es un problema de red
- En `getExchangeRates`: Detectar errores de red y solo loguear cuando no es error de conexión
- Mantener el warn cuando se usa caché solo si no es error de red

**Código**:
```typescript
// En fetchExchangeRates
catch (error) {
  if (error instanceof Error && !error.message.includes('Network request failed')) {
    console.error('[CurrencyService] Error obteniendo tasas de Frankfurter:', error);
  }
  throw error;
}

// En getExchangeRates
catch (error) {
  const cached = await getCachedRates(baseCurrency);
  if (cached) {
    const isNetworkError = error instanceof Error && error.message.includes('Network request failed');
    if (!isNetworkError) {
      console.warn('[CurrencyService] Error obteniendo tasas, usando caché:', error);
    }
    return cached;
  }

  const isNetworkError = error instanceof Error && error.message.includes('Network request failed');
  if (!isNetworkError) {
    console.error('[CurrencyService] Error obteniendo tasas sin caché disponible:', error);
  }

  return null;
}
```

**Beneficios**:
- Modo offline ya no genera errores en consola
- Los errores reales (API down, respuestas incorrectas) se siguen logueando
- Reduce el ruido en los logs durante desarrollo y pruebas

#### 3. Eliminar logs de debug en calculateSettlementSuggestions ([expensesService.ts:552-649](viatio-app/src/services/firestore/expensesService.ts#L552-L649))

**Cambios**:
- Eliminados 7 console.log de debug en `calculateSettlementSuggestions`
- Mantenida la lógica de cálculo intacta
- Limpiados comentarios de debug

**Logs eliminados**:
```typescript
// Eliminados:
console.log('[DEBUG calculateSettlementSuggestions] Completed settlements:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Pending settlements:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Balances received:', ...)
console.log('[DEBUG] Ajustando por settlement pendiente:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Adjusted balances:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Debtors:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Creditors:', ...)
console.log('[DEBUG calculateSettlementSuggestions] Final suggestions:', ...)
```

**Beneficios**:
- Consola mucho más limpia en operaciones de gastos
- Sin impacto en la funcionalidad (los logs eran solo informativos)
- Mejor performance (menos operaciones de string formatting)

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| [TripDetailScreen.tsx](viatio-app/src/screens/TripDetailScreen.tsx) | +37 líneas (debounce) | 68-108 |
| [currencyService.ts](viatio-app/src/services/currencyService.ts) | +20 líneas (silenciar logs de red) | 81-104, 114-147 |
| [expensesService.ts](viatio-app/src/services/firestore/expensesService.ts) | -50 líneas (remover logs debug) | 552-649 |

### Verificación

- [x] Compilación TypeScript sin errores
- [x] Los callbacks de TripDetailScreen usan debounce correctamente
- [x] Logs de error de red silenciados cuando se usa caché
- [x] Logs de debug eliminados de calculateSettlementSuggestions
- [ ] Probar en modo offline: verificar que no hay errores de Frankfurter
- [ ] Probar sincronización de viaje compartido: verificar que stats se recargan solo una vez
- [ ] Probar añadir/editar/eliminar gasto: verificar ausencia de logs debug

### Impacto

**Antes**:
- 15+ líneas de logs por cada cambio en gastos
- Múltiples errores de API en modo offline
- Recargas múltiples de stats en sincronización

**Después**:
- 2-3 líneas de logs informativos
- Sin errores de API en modo offline (usa caché silenciosamente)
- Una sola recarga de stats (debounced)

### Riesgos

- **Bajo**: Los cambios no afectan la lógica de negocio
- **Bajo**: El debounce de 500ms es suficientemente corto para mantener UX fluida
- **Ninguno**: Los logs de debug no eran necesarios en producción


## 🎨 Mejora Visual de Modales (23/01/2026)

### Objetivo
Mejorar la apariencia visual de los modales con múltiples botones para seguir el estilo de la app, igual que los modales de un solo botón.

### Cambios Completados

#### FASE 1: Mejora del componente CustomModal
- [x] Añadida prop `destructive?: boolean` al primaryButton
- [x] Cambiado layout de botones de horizontal a vertical para mejor jerarquía visual
- [x] Botón primario siempre arriba (acción principal)
- [x] Botón secundario abajo (acción de cancelar)
- [x] Nuevo estilo `destructiveButton` con color rojo (`theme.colors.error`)
- [x] Aumentado minHeight de botones a 50px para mejor área táctil
- [x] Aumentado paddingVertical a 14px
- [x] Botón secundario ahora transparente con borde de 1.5px
- [x] Mejorados fontWeights (600 para primario/destructivo, 500 para secundario)

#### FASE 2: Reemplazo masivo de Alert.alert
Se reemplazaron todos los `Alert.alert` nativos por `CustomModal` personalizado en:

**Pantallas principales (19 archivos)**:
- [x] TripReservationsScreen.tsx
- [x] EditReservationScreen.tsx
- [x] EventoDetailScreen.tsx
- [x] ArchivedTripsScreen.tsx
- [x] AddEventoScreen.tsx
- [x] TripListScreen.tsx
- [x] ReservationDetailScreen.tsx
- [x] TripDocumentsScreen.tsx
- [x] AddReservationScreen.tsx
- [x] ProfileScreen.tsx
- [x] EditProfileScreen.tsx
- [x] SettingsScreen.tsx
- [x] NotificationsSettingsScreen.tsx
- [x] ScanReservationScreen.tsx
- [x] TripMapScreen.tsx
- [x] CopilotSettingsScreen.tsx
- [x] HelpScreen.tsx
- [x] NotificationsManagementScreen.tsx
- [x] NotificationDebugScreen.tsx
- [x] VerifyEmailScreen.tsx

**Pantallas de viajes compartidos (5 archivos)**:
- [x] CreateSharedTripScreen.tsx
- [x] ExpenseDetailScreen.tsx
- [x] SharedTripDetailScreen.tsx
- [x] TripMembersScreen.tsx
- [x] TripSettlementsScreen.tsx

**Componentes (2 archivos)**:
- [x] PlaceMatchNotification.tsx
- [x] SelectItem.tsx

**Total**: 26 archivos migrados, ~40 modales reemplazados

### Comparación Visual

**Antes (Alert.alert nativo)**:
- Botones horizontales (Cancelar | Eliminar)
- Sin iconos, sin colores de marca
- Área táctil pequeña

**Después (CustomModal)**:
- Botones verticales (Eliminar arriba, Cancelar abajo)
- Icono de 48px con fondo de color
- Botones de 50px con colores distintivos
- Botón destructivo en rojo prominente

### Verificación
- [x] Compilación TypeScript sin errores
- [x] Todas las pantallas migradas
- [x] 0 Alert.alert restantes en screens/

