# Chatbot Viatio - Asistente Contextual Basado en Google Places

## 🎯 Resumen Ejecutivo

Se ha transformado exitosamente el chatbot de Viatio en un **asistente contextual de viaje profesional** que:

✅ Se activa exclusivamente dentro del contexto de un viaje específico
✅ Utiliza toda la información del viaje (gastos, presupuesto, reservas, agenda, lugares, documentos)
✅ Recomienda lugares verificados usando **Google Places API** (sin búsqueda web)
✅ Proporciona respuestas optimizadas aplicando mejores prácticas de Gemini 2.0+
✅ Incluye ejemplos de interacciones ideales (few-shot learning)
✅ **PROHIBIDA** la búsqueda web para evitar costes y datos no verificados

---

## 📦 Fases Implementadas

| Fase | Estado | Descripción |
|------|--------|-------------|
| **Fase 1** | ✅ Completada | Activación contextual - Chatbot solo en TripDetailScreen |
| **Fase 2** | ✅ Completada | Búsqueda de lugares con Google Places API (SIN web search) |
| **Fase 3** | ✅ Completada | Optimización backend (temperature 1.0 + prompt mejorado) |
| **Fase 4** | ✅ **COMPLETADA** | Streaming de respuestas con Server-Sent Events (SSE) |
| **Fase 5** | ✅ **COMPLETADA** | Gestión inteligente de historial con resúmenes automáticos |

---

## 🚫 Restricciones Importantes

### ❌ Lo que NO hace el chatbot (por diseño):

- **NO busca en internet** (prohibido: Serper, Tavily, web scraping, Google Custom Search)
- **NO inventa datos** (horarios, precios, teléfonos, websites)
- **NO proporciona información en tiempo real** (clima, eventos actuales, noticias)

### ✅ Lo que SÍ hace el chatbot:

- **Busca lugares verificados** con Google Places API (restaurantes, museos, hoteles, etc.)
- **Usa datos reales** del viaje (presupuesto, gastos, reservas, agenda)
- **Muestra solo información disponible** en Places (rating, dirección, estado apertura)
- **Informa cuando falta data**: "Horario no disponible", "Precio no consta", etc.
- **Añade timestamp** a cada consulta: "Consultado en Google Places el DD/MM/AAAA HH:MM"

---

## 🚀 Cómo Empezar

### 1. Verificar Backend

```bash
cd viatio-backend
npm run dev  # Desarrollo con hot reload
```

**Nota:** Ya NO se requiere configurar Google Custom Search API (fue eliminado).

---

### 2. Probar el Chatbot

1. Abrir Viatio app
2. Ir a un viaje existente (TripDetailScreen)
3. Click en el FAB del chatbot (bottom-right)
4. Probar preguntas permitidas:
   - ✅ `"¿Cuál es mi presupuesto?"`
   - ✅ `"Busca restaurantes vegetarianos cerca del hotel"`
   - ✅ `"Alternativas para hoy"`
   - ✅ `"Cafeterías con wifi cerca de aquí"`
   - ❌ `"¿Qué tiempo hará mañana?"` → Responderá que no puede buscar clima

---

## 📋 Archivos Modificados/Eliminados

### Backend (Archivos modificados)
- ✅ `src/routes/copilot.ts` - Prompt mejorado + eliminado search_web
- ✅ `src/services/geminiService.ts` - Temperature 1.0
- ✅ `src/index.ts` - Eliminado registro de ruta `/api/search`
- 🗑️ `src/services/searchService.ts` - **ELIMINADO** (era web search)
- 🗑️ `src/routes/search.ts` - **ELIMINADO** (era web search)
- 🆕 `src/services/placesRankingService.ts` - **NUEVO** (ranking inteligente)

### Frontend (Archivos modificados)
- ✅ `src/screens/TripDetailScreen.tsx` - FAB activado
- ✅ `src/services/ai/contextPackBuilder.ts` - Gastos/presupuesto + coords hotel incluidos
- ✅ `src/services/ai/actionExecutor.ts` - Mejorado executeSearchPlaces con timestamp
- ✅ `src/types/asistente.ts` - Eliminado SearchWebParams

### Documentación
- 🗑️ `CONFIGURACION_API_KEYS.md` - **ELIMINADO** (era para Google Custom Search)
- ✅ `README_CHATBOT_OPTIMIZADO.md` - **ACTUALIZADO** (este archivo)
- ✅ `IMPLEMENTACION_CHATBOT_RESUMEN.md` - **ACTUALIZADO**

---

## 🧪 Testing

### Checklist de Verificación

**Activación Contextual:**
- [ ] FAB del chatbot visible SOLO en TripDetailScreen
- [ ] Click en FAB abre AssistantScreen con contexto del viaje
- [ ] Preguntar por presupuesto → Responde con cifras exactas del viaje

**Búsqueda de Lugares (Google Places):**
- [ ] "Restaurantes cerca del hotel" → Ejecuta search_places con coords del hotel
- [ ] Muestra máximo 8 resultados con rating, dirección, distancia, estado apertura
- [ ] Añade timestamp: "Consultado en Google Places el DD/MM/AAAA HH:MM"
- [ ] Si falta horario → Muestra "Horario no disponible"
- [ ] Si falta precio → Muestra "Precio no consta"

**Restricciones de Web Search:**
- [ ] "¿Qué tiempo hará mañana?" → Responde que no puede buscar clima
- [ ] "Eventos en Madrid este finde" → Responde que solo busca lugares verificados
- [ ] NO ejecuta search_web (función eliminada)

**Contexto del Hotel:**
- [ ] Si hay reserva de accommodation con coords → trip.lodgingBase tiene name/lat/lng
- [ ] "Cerca del hotel" usa las coords de lodgingBase o destinationCoords

---

## 🔍 Casos de Uso Principales

### 1. "Restaurantes cerca del hotel"
**Flujo:**
1. Chatbot detecta "restaurantes" + "cerca del hotel"
2. Obtiene coords del hotel (trip.lodgingBase o trip.destinationCoords)
3. Ejecuta `search_places({ query: "restaurantes", nearLat: X, nearLng: Y, radiusMeters: 1000 })`
4. Rankea resultados por distancia + rating + openNow
5. Retorna top 8 con timestamp

**Respuesta esperada:**
```
Encontrados 15 lugares (mostrando top 8):

1. La Tasca del Barrio
   ⭐ 4.5 (234 opiniones)
   📍 Calle Mayor 12
   🟢 Abierto

2. Restaurante Vegetalia
   ⭐ 4.7 (89 opiniones)
   📍 Plaza del Sol 5
   🔴 Cerrado

...

📅 Consultado en Google Places el 28/01/2026 15:30
```

---

### 2. "Alternativas para hoy"
**Flujo:**
1. Chatbot identifica itinerario del día actual
2. Obtiene coords del POI principal del día
3. Busca lugares similares en radio de 1500m
4. Filtra por tipo relevante (si el POI es museo → busca museos/atracciones)

---

### 3. "Busca algo como X cerca de Y"
**Flujo:**
1. Parsea query: X = tipo de lugar, Y = punto de referencia
2. Resuelve coords de Y (puede ser lugar guardado, destino, hotel)
3. Ejecuta search con esas coords

---

## 🛠️ Personalización del Ranking

El ranking de lugares se basa en:

| Factor | Peso | Descripción |
|--------|------|-------------|
| **Distancia** | 40% | 0-500m = máx puntos, >2km = mín puntos |
| **Rating** | 30% | 4.5-5.0 = máx, <3.5 = mín |
| **Popularidad** | 20% | >1000 reviews = máx, <10 = mín |
| **OpenNow** | 10% | Bonus si está abierto |

**Máximo resultados:** 8 lugares (ordenados por score descendente)

---

## 🚨 Troubleshooting

### El chatbot no muestra resultados de lugares

**Causas posibles:**
1. No hay coords del hotel → Verificar que la reserva de accommodation tenga latitud/longitud
2. Timeout de Google Places API → Verificar conectividad
3. API key de Places inválida (viatio-app)

**Solución:**
- Revisar logs del backend: `npm run dev` y buscar errores de Places API
- Verificar que `trip.lodgingBase` o `trip.destinationCoords` existan en ContextPack

---

### El chatbot responde que "no puede buscar X"

**Causa:** X es información que requiere web search (clima, eventos, noticias).

**Comportamiento esperado:** El chatbot está configurado para RECHAZAR búsquedas web.

**Solución:** Reformular pregunta enfocándola en lugares concretos.
❌ "¿Qué tiempo hará?"
✅ "¿Hay algún lugar cubierto para visitar en caso de lluvia?"

---

## 🎉 Funcionalidades Avanzadas (Fases 4 y 5 - COMPLETADAS)

### ✅ Fase 4: Streaming de Respuestas

**Implementado con Server-Sent Events (SSE)**

- **Backend**: Endpoint `/api/copilot/stream` con eventos SSE
- **Frontend**: Servicio `sendMessageToCopilotStream()` con callbacks
- **ChatStore**: Modo streaming activado por defecto (`streamingEnabled: true`)
- **UX**: El usuario ve la respuesta generándose token por token en tiempo real

**Cómo funciona:**
1. Usuario envía mensaje
2. Backend inicia stream con evento `start`
3. Cada token se envía con evento `token` →  Frontend actualiza mensaje
4. Al finalizar, envía evento `complete` con actions y metadata

**Ventajas:**
- ✅ Mejor percepción de velocidad (UX similar a ChatGPT)
- ✅ Respuestas largas se sienten más rápidas
- ✅ Feedback visual inmediato

**Desactivar streaming (opcional):**
```typescript
useChatStore.getState().setStreamingEnabled(false);
```

---

### ✅ Fase 5: Gestión Inteligente de Historial

**Implementado con resúmenes automáticos**

- **Servicio**: `conversationSummaryService.ts` en backend
- **Estrategia**: Mantener últimos 3 intercambios (6 mensajes) + resumir antiguos
- **Límites automáticos**:
  - Máx **20 mensajes** antes de resumir
  - Máx **4000 tokens** estimados en historial
- **Resumen**: Gemini Flash genera resumen en 2-3 párrafos conservando info relevante
- **Persistencia**: Tabla `conversaciones` en SQLite (ya existente)

**Cómo funciona:**
1. Antes de enviar a Gemini, se calcula tokens del historial
2. Si supera límites → se resume automáticamente con Gemini Flash
3. Resumen se inserta como mensaje único al inicio
4. Se mantienen últimos 6 mensajes completos (contexto inmediato)
5. Logs backend muestran: mensajes, tokens, % del límite, si fue resumido

**Ejemplo de log:**
```
[Copilot] Historial: {
  messages: 22,
  estimatedTokens: 4500,
  percentOfLimit: '113%',
  summarized: true
}
```

**Ventajas:**
- ✅ Conversaciones ilimitadas sin perder contexto
- ✅ **Menor coste** de tokens (menos mensajes a Gemini)
- ✅ Sin límites de contexto de Gemini
- ✅ Historial persistente en SQLite

---

**Última actualización:** 2026-01-28
