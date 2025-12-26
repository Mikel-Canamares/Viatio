# Plan de Mejora: Viatio Copilot (Agente IA)

## 📊 Estado Actual vs Objetivo

| Aspecto | Estado Actual | Objetivo |
|---------|---------------|----------|
| **Tipo** | Chat contextual básico | Agente con acciones ejecutables |
| **Contexto** | Viaje + reservas + lugares + gastos | Context Pack completo (UI, preferencias, agenda, rutas) |
| **Respuesta** | Solo texto natural | Texto + JSON de acciones propuestas |
| **Interacción** | Preguntas/respuestas pasivas | Proactivo, sugiere siguiente mejor acción |
| **Modelo** | gemini-2.0-flash-exp | Mantener (buena relación costo/calidad) |
| **Seguridad** | Sin confirmaciones | Acciones reversibles con confirmación |

## 🎯 Objetivos del Plan

1. **Convertir el chat en un agente accionable** - Respuestas con botones de acción
2. **Context Pack enriquecido** - Incluir pantalla actual, preferencias, agenda detallada
3. **Acciones atómicas y seguras** - Crear/editar eventos, buscar lugares, optimizar rutas
4. **Modo por pantalla** - Comportamiento adaptado según dónde esté el usuario
5. **UX de "efecto wow"** - Sugerencias proactivas, alternativas A/B, anticipación

---

## ✅ TODOs

### FASE 1: Infraestructura del Context Pack
- [ ] 1.1 Crear interfaz `ContextPack` completa en `types/asistente.ts`
- [ ] 1.2 Crear `contextPackBuilder.ts` para construir el contexto dinámicamente
- [ ] 1.3 Añadir campo `currentScreen` al contexto (detectar pantalla actual)
- [ ] 1.4 Añadir campo `selectedItems` (día, lugar, reserva seleccionados)
- [ ] 1.5 Crear interfaz `UserPreferences` (estilo viaje, ritmo, presupuesto, restricciones)
- [ ] 1.6 Persistir preferencias de usuario en AsyncStorage/SQLite

### FASE 2: Sistema de Acciones
- [ ] 2.1 Definir interfaz `AgentAction` con tipos de acción estandarizados
- [ ] 2.2 Crear interfaz `AgentResponse` (mensaje + acciones + notas)
- [ ] 2.3 Implementar `actionExecutor.ts` para ejecutar acciones desde el agente
- [ ] 2.4 Crear componente `ActionButton` para renderizar acciones propuestas
- [ ] 2.5 Implementar sistema de confirmación para acciones destructivas
- [ ] 2.6 Añadir soporte de rollback/deshacer para acciones reversibles

### FASE 3: Herramientas del Agente (Backend)
- [ ] 3.1 Refactorizar `geminiService.ts` para usar function calling de Gemini
- [ ] 3.2 Implementar tool `viatio.getAgenda({ tripId, date? })`
- [ ] 3.3 Implementar tool `viatio.createAgendaItem({ ... })`
- [ ] 3.4 Implementar tool `viatio.searchPlaces({ query, nearLat, nearLng, categories })`
- [ ] 3.5 Implementar tool `viatio.getDirections({ origin, destination, mode })`
- [ ] 3.6 Implementar tool `viatio.suggestActivities({ tripId, date, preferences })`

### FASE 4: Prompt del Agente Mejorado
- [ ] 4.1 Reescribir `ASSISTANT_PROMPT` con personalidad de "Viatio Copilot"
- [ ] 4.2 Definir comportamiento por pantalla (agenda, mapa, reservas, chat)
- [ ] 4.3 Añadir instrucciones de formato JSON para acciones
- [ ] 4.4 Implementar sistema de "siguiente mejor acción"
- [ ] 4.5 Añadir ejemplos de alternativas A/B en el prompt

### FASE 5: UI del Agente
- [ ] 5.1 Rediseñar `ChatBubble` para soportar acciones embebidas
- [ ] 5.2 Crear componente `ActionChip` para botones de acción rápida
- [ ] 5.3 Añadir indicador visual de "acción en progreso"
- [ ] 5.4 Implementar animación de "acción completada"
- [ ] 5.5 Crear componente `ContextBadge` que muestra qué contexto tiene el agente

### FASE 6: Integración por Pantalla
- [ ] 6.1 En TripAgenda: detectar huecos, conflictos, sugerir actividades
- [ ] 6.2 En TripMap: sugerir rutas, optimizar paradas, crear listas
- [ ] 6.3 En ReservationDetail: resumir, detectar conflictos, crear eventos
- [ ] 6.4 En TripDetail: visión global, itinerarios, preparación del viaje
- [ ] 6.5 Actualizar `useAssistantContext` con sugerencias más inteligentes

---

## 📋 Detalle de Implementación

### 1. Interfaz ContextPack (Fase 1.1)

```typescript
interface ContextPack {
  app: {
    version: string;
    platform: 'ios' | 'android';
    locale: string;
    timezone: string;
  };
  user: {
    name?: string;
    travelStyle: string[];        // ['cultura', 'gastronomia', 'aventura']
    pace: 'relajado' | 'equilibrado' | 'intenso';
    budget?: { level: string; currency: string; dailyCap?: number };
    mobility?: { walkingToleranceKmPerDay?: number };
    food?: { preferences: string[]; restrictions: string[] };
  };
  ui: {
    currentScreen: ScreenName;
    selectedTripId?: string;
    selectedDayId?: string;
    selectedPlaceId?: string;
    selectedReservationId?: string;
  };
  trip: { ... };      // Datos del viaje actual
  agenda: { ... };    // Días con items detallados
  reservations: [...];
  places: { saved: [...], recentSearch?: {...} };
  documents: [...];
  expenses: { currency: string; items: [...]; total: number; budget?: number };
  capabilities: {
    availableActions: string[];  // Acciones que puede ejecutar
    canWriteData: boolean;
  };
}
```

### 2. Interfaz AgentResponse (Fase 2.2)

```typescript
interface AgentResponse {
  message: string;           // Respuesta natural para el usuario
  actions: AgentAction[];    // Acciones propuestas (0-3)
  notes?: string;            // Notas técnicas opcionales
}

interface AgentAction {
  id: string;
  label: string;             // "Añadir a agenda", "Buscar cerca"
  type: ActionType;          // 'create_agenda_item' | 'search_places' | ...
  requiresConfirmation: boolean;
  params: Record<string, any>;
  confidence: number;        // 0.0 - 1.0
  rollback?: { supported: boolean; how: string };
}

type ActionType =
  | 'create_agenda_item'
  | 'update_agenda_item'
  | 'delete_agenda_item'
  | 'search_places'
  | 'get_directions'
  | 'optimize_route'
  | 'add_expense'
  | 'extract_document'
  | 'navigate_to';           // Navegar a otra pantalla
```

### 3. Ejemplo de Respuesta del Agente

**Usuario (en pantalla Agenda, día 2 vacío):** "¿Qué puedo hacer mañana?"

**Respuesta del agente:**
```json
{
  "message": "Tu día 2 (15 marzo) está libre. Basándome en tu check-in del Hotel Ritz a las 15:00, te sugiero:\n\n**Opción A - Cultural:**\n- 10:00-12:30 Sagrada Familia (ya la tienes guardada)\n- 13:00 Almuerzo en Born\n- 15:00 Check-in hotel\n\n**Opción B - Relajada:**\n- 11:00 Paseo por Las Ramblas\n- 13:30 Mercado de la Boquería\n- 15:00 Check-in hotel\n\n¿Cuál prefieres o quieres que la ajuste?",
  "actions": [
    {
      "id": "a1",
      "label": "Aplicar Opción A",
      "type": "create_agenda_item",
      "requiresConfirmation": true,
      "params": {
        "items": [
          { "title": "Sagrada Familia", "start": "10:00", "end": "12:30", "type": "visit" },
          { "title": "Almuerzo en Born", "start": "13:00", "end": "14:30", "type": "meal" },
          { "title": "Check-in Hotel Ritz", "start": "15:00", "type": "checkin" }
        ]
      },
      "confidence": 0.8,
      "rollback": { "supported": true, "how": "Eliminar los 3 eventos creados" }
    },
    {
      "id": "a2",
      "label": "Aplicar Opción B",
      "type": "create_agenda_item",
      "requiresConfirmation": true,
      "params": { "items": [...] },
      "confidence": 0.7,
      "rollback": { "supported": true, "how": "Eliminar los 3 eventos creados" }
    },
    {
      "id": "a3",
      "label": "Buscar más actividades",
      "type": "search_places",
      "requiresConfirmation": false,
      "params": { "nearLat": 41.4036, "nearLng": 2.1744, "categories": ["activity", "culture"] },
      "confidence": 0.9
    }
  ]
}
```

---

## 🔧 Consideraciones Técnicas

### Modelo Recomendado
**Mantener `gemini-2.0-flash-exp`** por:
- Gratuito durante preview
- Soporta function calling nativo
- Buena velocidad de respuesta (UX móvil)
- Context window de 1M tokens

### Function Calling
Gemini 2.0 soporta function calling nativo. En lugar de parsear JSON manualmente, definimos las herramientas como funciones y Gemini decide cuándo usarlas.

### Seguridad
- Acciones de escritura siempre requieren confirmación
- Límite de 3 acciones por respuesta
- Rollback disponible para todas las acciones de creación/edición
- No ejecutar acciones sin contexto suficiente

---

## 🚀 Orden de Implementación Recomendado

1. **Fase 1** (Contexto) → Base necesaria para todo
2. **Fase 2** (Acciones) → Sistema de respuesta enriquecida
3. **Fase 4** (Prompt) → Comportamiento del agente
4. **Fase 5** (UI) → Visualización de acciones
5. **Fase 3** (Tools) → Herramientas ejecutables (opcional, se puede simular primero)
6. **Fase 6** (Integración) → Pulir por pantalla

---

## Review

### Resumen
Plan completo para transformar el chat contextual actual en un agente proactivo con:
- Context Pack enriquecido con pantalla actual, preferencias y datos detallados
- Sistema de acciones atómicas con confirmación y rollback
- Respuestas estructuradas (mensaje + acciones JSON)
- Comportamiento adaptado por pantalla
- Sugerencias de "siguiente mejor acción"

### Riesgos potenciales
- **Complejidad del prompt**: Un prompt muy largo puede degradar la calidad
- **Parsing de respuestas**: Gemini puede no siempre devolver JSON válido
- **Latencia**: Más contexto = más tokens = más tiempo de respuesta
- **Sincronización**: Ejecutar acciones puede requerir actualizar múltiples stores

### Mitigaciones
- Usar function calling nativo de Gemini en lugar de parsing manual
- Implementar validación robusta de respuestas con fallback a texto plano
- Comprimir contexto inteligentemente (solo datos relevantes por pantalla)
- Usar optimistic updates en UI + sincronización en background

### Siguientes pasos
1. **Aprobación del plan** - ¿Ajustar prioridades o alcance?
2. **Empezar por Fase 1.1** - Definir interfaces TypeScript
3. **Iterar incrementalmente** - Cada fase es testeable independientemente
