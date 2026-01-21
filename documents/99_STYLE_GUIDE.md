# Guía de Estilo — Documentación Viatio

**Propósito**: Unificar terminología, tono, formato y convenciones en toda la documentación (técnica, marketing y usuarios).

**Audiencias**: Desarrolladores, escritores técnicos, product managers, marketing.

**Última actualización**: 2026-01-21

---

## Glosario de términos oficiales

### Producto y marca

| Término CORRECTO | Variantes a evitar | Notas |
|------------------|-------------------|-------|
| **Viatio** | viatio, VIATIO | Siempre con mayúscula inicial |
| **Travel OS** | travel OS, TravelOS | Tagline oficial: "Tu Travel OS personal" |
| **App móvil** / **App** | aplicación, aplicación móvil | "App" es aceptable en contextos informales |
| **Asistente inteligente** | asistente de IA, IA, AI assistant | Para comunicación con usuarios |
| **Copilot** | Co-pilot, copilot, Viatio Copilot | Nombre de la feature específica |
| **Backend de IA** | backend, API backend, servidor IA | Para contextos técnicos |

### Funcionalidades core

| Término CORRECTO | Variantes a evitar | Notas |
|------------------|-------------------|-------|
| **Viaje** | trip, Travel | Entidad principal del dominio |
| **Viaje privado** | viaje local, viaje offline | Viaje sin sincronización en la nube |
| **Viaje compartido** | viaje colaborativo, viaje sync, shared trip | Viaje con sincronización entre personas |
| **Reserva** | booking, reservación | Vuelos, hoteles, restaurantes, actividades, transporte |
| **Escanear reserva** | extraer reserva, OCR reserva | Función de IA para extraer datos de imágenes |
| **Documento** | archivo, file, adjunto | PDFs, imágenes, documentos subidos por el usuario |
| **Gasto** | expense, coste | Registro de dinero gastado |
| **Reparto de gastos** | split, división de gastos | Dividir gastos entre personas |
| **Liquidación** | settlement, pago | Registro de transferencia real entre personas |
| **Agenda** | itinerario, calendario diario | Vista día a día del viaje |
| **Calendario** | calendar | Vista mensual |
| **Evento** | evento personalizado, actividad | Elemento de agenda creado por usuario (no reserva) |
| **Lugar** | point of interest, POI, ubicación | Marcador en mapa |
| **Sincronización** / **Sync** | sincronización, syncing | Proceso de actualización entre dispositivos |

### Tecnología (uso técnico)

| Término CORRECTO | Variantes a evitar | Notas |
|------------------|-------------------|-------|
| **SQLite** | sqlite, Sqlite | Base de datos local |
| **Firebase** | firebase | Auth, Firestore, Storage |
| **Firestore** | firestore, Cloud Firestore | Base de datos en la nube |
| **Firebase Storage** | storage, cloud storage | Almacenamiento de archivos |
| **Gemini** / **Gemini AI** | Google Gemini, AI Gemini | Modelo de IA de Google |
| **Google Places** | Google Places API, Places | API de lugares |
| **Google Maps** | Maps, Google maps | Mapas |
| **Expo** | expo, Expo SDK | Framework de React Native |
| **React Native** | react native, RN | Framework de desarrollo |
| **TypeScript** | typescript, TS | Lenguaje de programación |

### Usuarios y roles

| Término CORRECTO | Contexto | Notas |
|------------------|----------|-------|
| **Usuario** | Documentación técnica | Persona que usa Viatio |
| **Viajero** | Documentación de usuarios/marketing | Más cercano y aspiracional |
| **Miembro** | Viajes compartidos | Persona invitada a un viaje compartido |
| **Creador** / **Organizador** | Viajes compartidos | Persona que creó el viaje compartido |
| **Desarrollador** | Documentación técnica | Persona que desarrolla Viatio |
| **Inversor** / **Stakeholder** | Documentación de marketing | Persona interesada en el negocio |

---

## Tono de voz por audiencia

### Para usuarios (documentación `/usuarios`)

**Características**:
- ✅ **Cercano** y conversacional
- ✅ **Claro** y directo (sin jerga técnica)
- ✅ **Optimista** y motivador
- ✅ **Práctico**: enfocado en valor y beneficios
- ✅ **Empático**: entendemos los problemas del viajero

**Ejemplos**:
- ✅ "Olvídate de tener tus vuelos en Gmail y los gastos en Excel"
- ✅ "Viatio centraliza todo en un solo lugar"
- ✅ "Ahorra 5+ horas en organización"
- ❌ "Viatio implementa una arquitectura offline-first con SQLite" → demasiado técnico

**Verbos preferidos**: organizar, centralizar, ahorrar, disfrutar, controlar, compartir
**Evitar**: implementar, configurar, ejecutar, deployar

### Para inversores y stakeholders (documentación `/marketing`)

**Características**:
- ✅ **Profesional** y convincente
- ✅ **Orientado a negocio** (mercado, oportunidad, métricas)
- ✅ **Basado en datos** (TAM/SAM/SOM, CAC/LTV)
- ✅ **Estratégico**: visión a largo plazo
- ✅ **Realista**: transparente con riesgos y supuestos

**Ejemplos**:
- ✅ "Viatio busca convertirse en el Travel OS estándar para viajeros digitales"
- ✅ "TAM estimado de $20–30B en travel tech global (supuesto)"
- ✅ "Monetización escalable con múltiples palancas: freemium + afiliación + partnerships"
- ❌ "Viatio es la app más increíble del mundo" → hipérbole sin sustento

**Verbos preferidos**: capturar, escalar, monetizar, crecer, convertir, validar
**Evitar**: usar, clickear, probar

### Para desarrolladores (documentación `/tecnicos`)

**Características**:
- ✅ **Preciso** y técnico
- ✅ **Estructurado**: jerarquías claras, listas, tablas
- ✅ **Referenciable**: rutas de código, módulos, APIs
- ✅ **Honesto**: marcar TODOs, gaps, limitaciones
- ✅ **Accionable**: comandos ejecutables, ejemplos de código

**Ejemplos**:
- ✅ "La sincronización usa Firestore real-time listeners (`onSnapshot`)"
- ✅ "Ver implementación en `viatio-app/src/services/sync/uploadChanges.ts:45`"
- ✅ "**PENDIENTE / TODO**: política de resolución de conflictos no está definida"
- ❌ "La sincronización es súper rápida y funciona genial" → subjetivo, no técnico

**Verbos preferidos**: implementar, ejecutar, configurar, compilar, testear, deployar
**Evitar**: sentir, creer, pensar

---

## Reglas para claims y afirmaciones

### Marcas de estado obligatorias

Toda afirmación sobre funcionalidades debe incluir una **marca de estado**:

| Marca | Significado | Ejemplo de uso |
|-------|-------------|----------------|
| ✅ **IMPLEMENTADO** | Funcionalidad verificada en código actual | "✅ Escaneo de reservas con IA (implementado)" |
| 🔄 **EN DESARROLLO** | En progreso activo | "🔄 Widgets home screen (en desarrollo)" |
| 🚀 **ROADMAP** | Planificado para el futuro | "🚀 Plan familiar (roadmap)" |
| ⚠️ **PENDIENTE / TODO** | Información incompleta o por definir | "⚠️ Política de retención en Firestore (PENDIENTE / TODO)" |
| ❌ **NO VERIFICADO EN CÓDIGO** | Sin evidencia en repositorio | "❌ Exportación automática a Google Calendar (NO VERIFICADO)" |

**Regla de oro**: Si no puedes referenciar código o documentación técnica que lo respalde, **NO afirmes que está implementado**.

### Claims verificables vs no verificables

#### ✅ Claims verificables (OK)
- "Viatio escanea reservas con Gemini AI" → verificable en `viatio-backend/src/routes/assistant.ts`
- "La app funciona offline con SQLite" → verificable en `viatio-app/src/database/`
- "Sincronización en tiempo real con Firebase" → verificable en `viatio-app/src/services/sync/`

#### ❌ Claims no verificables (evitar o marcar como supuesto)
- "Viatio es la app más completa del mercado" → subjetivo, no verificable
- "Ahorra un 80% de tiempo en organización" → sin estudio, usar "5+ horas" (estimación conservadora)
- "TAM de $30B" → marcar como "supuesto" o "estimación de mercado"

### Reglas para supuestos y estimaciones

Cuando uses datos no verificados:
1. **Márcalos explícitamente**: "(supuesto)", "(estimación)", "(orientativo)"
2. **Cita fuentes** si existen: "según Statista 2024"
3. **Sé conservador**: mejor subestimar que sobrevender

**Ejemplos**:
- ✅ "TAM estimado de $20–30B (supuesto basado en reportes de travel tech)"
- ✅ "Ahorro de 3–5 horas en organización (estimación conservadora)"
- ❌ "TAM de $50B" → sin marcar como supuesto = claim inflado

---

## Formato y estructura

### Títulos y headings

**Jerarquía**:
```markdown
# H1 — Título principal (solo 1 por documento)
## H2 — Secciones principales
### H3 — Subsecciones
#### H4 — Detalles (usar con moderación)
```

**Estilo de títulos**:
- ✅ "Qué es Viatio" (sin signo de interrogación en headings)
- ✅ "Cómo funciona el Copilot" (capitalización solo en la primera palabra y nombres propios)
- ❌ "¿Qué Es Viatio?" (evitar signos de interrogación y capitalización excesiva)

### Listas

**Bullets** (`-` o `*`):
- Usar para listas no ordenadas
- Empezar con minúscula si no es frase completa
- Empezar con mayúscula si es frase completa con verbo

**Numeradas** (`1.`, `2.`, ...):
- Usar para pasos secuenciales o instrucciones
- Siempre empezar con mayúscula

**Checklists** (`- [ ]` o `- [x]`):
- Usar en TODOs o listas de verificación

### Tablas

**Formato estándar**:
```markdown
| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato 1    | Dato 2    | Dato 3    |
```

**Alineación**:
- Izquierda por defecto (texto)
- Derecha para números (`|----------:|`)
- Centro para estados o iconos (`|:---------:|`)

### Énfasis y formato

| Uso | Markdown | Ejemplo |
|-----|----------|---------|
| **Negrita** | `**texto**` | **IMPORTANTE**, **Firebase** |
| *Cursiva* | `*texto*` | *opcional*, *por ejemplo* |
| `Código inline` | `` `código` `` | `npm install`, `Viatio.tsx` |
| Bloque de código | ` ```lenguaje ` | Ver abajo |

**Bloques de código**:
````markdown
```typescript
// Código con syntax highlighting
const viaje = await database.getViaje(id);
```
````

### Enlaces

**Internos** (preferir rutas relativas):
```markdown
[Ver FAQ](./04_FAQ.md)
[Arquitectura](../tecnicos/10_ARCHITECTURE_OVERVIEW.md)
```

**Externos**:
```markdown
[Firebase Privacy](https://firebase.google.com/support/privacy)
```

### Emojis

**Uso permitido**:
- ✅ Marcas de estado: ✅ ❌ ⚠️ 🚀 🔄
- ✅ Categorías: 🏖️ 🤿 🏔️ (en casos de uso)
- ✅ Énfasis visual: 🔒 💰 📱 (en headings ocasionales)

**Uso restringido**:
- ❌ Evitar en documentación técnica (excepto marcas de estado)
- ❌ No más de 2–3 emojis por sección
- ❌ No usar emojis como sustitutos de palabras

---

## Convenciones de referencias

### Referencias a código

**Formato**:
```markdown
**Referencia verificada**: `ruta/archivo.ts:línea`
```

**Ejemplos**:
- `viatio-app/src/screens/TripDetailScreen.tsx:45`
- `viatio-backend/src/routes/assistant.ts`
- `database/schema.ts` (si es obvio que está en viatio-app)

**Cuándo usar**:
- Al afirmar funcionalidades implementadas en docs de usuarios/marketing
- En docs técnicas para facilitar navegación del código

### Referencias a documentación

**Formato**:
```markdown
➡️ **Ver más**: [Título del documento](./ruta/documento.md)
```

**Ejemplos**:
- `➡️ [Ver pricing completo](./06_PRICING_PROPUESTO.md)`
- `➡️ **Documentación técnica**: [Privacy and data handling](../tecnicos/31_PRIVACY_AND_DATA_HANDLING.md)`

---

## Plantillas de secciones comunes

### Plantilla de caso de uso

```markdown
## [Emoji] [Título] — [Contexto breve]

### Antes
**[Persona]** [describe el problema con dolor específico].

**Resultado**: [consecuencia negativa concreta]

### Con Viatio
1. **[Paso 1]**
2. **[Paso 2]**
3. **[Paso 3]**
...

### Resultado
- ✅ **[Beneficio medible 1]**
- ✅ **[Beneficio medible 2]**
- ✅ **Ahorro de X horas**
```

### Plantilla de FAQ

```markdown
### [Pregunta directa]
[Respuesta concisa en 1–3 párrafos]

**Referencia verificada** (si aplica): `código` o enlace a doc

---
```

### Plantilla de feature explicada

```markdown
### [Número]. [Emoji] [Nombre de la funcionalidad]

[Descripción de qué hace en 1–2 frases]

**Beneficios**:
- [Beneficio 1]
- [Beneficio 2]

**Cómo usarla**:
1. [Paso 1]
2. [Paso 2]

**Referencia verificada**: `ruta/archivo.ts`
```

---

## Reglas de longitud

### Documentación de usuarios
- **Párrafos**: 2–4 líneas máximo (escaneable)
- **Frases**: 15–20 palabras ideal, máximo 25
- **Secciones**: dividir si supera 300 palabras

### Documentación de marketing
- **One-pager**: máximo 800 palabras
- **Pitch deck**: 100–150 palabras por slide
- **Memo**: 2.000–3.000 palabras máximo

### Documentación técnica
- **Sin límite estricto**, pero usar jerarquía clara
- **Secciones**: dividir si supera 500 palabras
- **Diagramas**: preferir a texto largo cuando sea posible

---

## Mensajes clave y taglines oficiales

### Taglines principales

| Uso | Tagline |
|-----|---------|
| **Principal** | "Viatio — Tu Travel OS personal" |
| **Secundario** | "Menos apps, menos fricción, más viaje" |
| **Pitch corto** | "Organiza todo tu viaje en una sola app" |
| **Valor** | "Tus datos, tu viaje, tu control" |

### Mensajes de valor por audiencia

**Para usuarios**:
- "Olvídate de tener tus vuelos en Gmail, los gastos en Excel y el itinerario en notas"
- "Todo tu viaje en un solo lugar: reservas, documentos, gastos, mapas y colaboración"
- "Funciona offline. Sincroniza con tu grupo. IA que te ayuda"

**Para inversores**:
- "Viatio es el Travel OS personal para viajeros digitales"
- "Reemplazamos la fragmentación (TripIt + Wanderlog + Splitwise + IA) con una experiencia integrada"
- "Timing perfecto: auge del viaje experiencial + madurez de IA aplicada"

**Para desarrolladores**:
- "Arquitectura offline-first con sincronización opcional en tiempo real"
- "Stack moderno: React Native + Expo + TypeScript + Firebase + Gemini AI"
- "Documentación enterprise para operación en producción"

---

## Errores comunes a evitar

### ❌ Errores de terminología
- "trip" → usar "viaje"
- "expense" → usar "gasto"
- "backup" → usar "copia de seguridad" (usuarios) o "backup" (técnicos)

### ❌ Errores de tono
- "Viatio es increíble" → subjetivo, usar "Viatio centraliza todo"
- "No te arrepentirás" → marketing agresivo, evitar

### ❌ Errores de formato
- Títulos con signos de interrogación: "¿Qué es Viatio?"
- Capitalización excesiva: "Travel OS Personal"
- Emojis en exceso: "✨🎉 Viatio 🚀✈️"

### ❌ Errores de claims
- Afirmar funcionalidades futuras como presentes
- No marcar supuestos de mercado
- Comparaciones sin fuente: "Somos 10x mejor que la competencia"

---

## Checklist de calidad documental

Antes de publicar un documento, verifica:

- [ ] **Terminología**: ¿Usas términos del glosario oficial?
- [ ] **Tono**: ¿Adecuado a la audiencia (usuarios/inversores/devs)?
- [ ] **Claims**: ¿Todos los claims están marcados (✅/🚀/⚠️)?
- [ ] **Referencias**: ¿Claims implementados tienen referencias de código?
- [ ] **Enlaces**: ¿Todos los enlaces internos son relativos y correctos?
- [ ] **Formato**: ¿Sigue las convenciones (headings, listas, tablas)?
- [ ] **Longitud**: ¿Párrafos escaneables? ¿Secciones bien divididas?
- [ ] **Ortografía**: ¿Sin errores tipográficos?

---

## Contacto para dudas

**Responsable de documentación**: [por definir]
**Proceso de aprobación**: [por definir]

➡️ **Sugerencias de mejora**: [abrir issue en repo de docs]

---

**Última actualización**: 2026-01-21
**Versión**: 1.0
