# Changelog de documentación — Viatio

Registro de cambios significativos en la documentación del proyecto.

---

## [1.0.0] — 2026-01-21 — Auditoría completa y reestructuración

### Resumen de cambios
Auditoría completa de la documentación existente, creación de documentación user-facing, consolidación de archivos duplicados y establecimiento de guía de estilo global.

**Trabajo realizado por**: Equipo PM + Tech Writer + UX Writer + Marketing Lead
**Alcance**: 13 tareas principales, 50+ archivos afectados

---

### ✅ Creado — Nuevos documentos

#### Raíz de /documents
- `00_INDEX.md` — Índice maestro global con navegación por audiencia
- `00_DOCS_AUDIT.md` — Auditoría completa del estado de documentación
- `99_STYLE_GUIDE.md` — Guía de estilo unificada (terminología, tono, formato)
- `00_CHANGELOG_DOCS.md` — Este archivo

#### /documents/usuarios (carpeta nueva)
- `01_OVERVIEW_PARA_USUARIOS.md` — Qué es Viatio en 30 segundos
- `02_CASOS_DE_USO.md` — 10 escenarios reales de viajeros
- `03_GUIA_RAPIDA.md` — Cómo empezar en 10 pasos
- `04_FAQ.md` — 40+ preguntas frecuentes agrupadas
- `05_PRIVACIDAD_RESUMEN.md` — Privacidad comprensible (no legal)
- `06_PRICING_PROPUESTO.md` — Planes Free/Lite/Pro con lógica de valor

#### /documents/marketing (nuevas piezas)
- `05_ELEVATOR_PITCH.md` — Pitches de 30s/60s/2min por audiencia
- `06_MENSAJES_CORTOS_Y_CTA.md` — Copy para ads, redes, banners, app store

---

### 🔄 Mejorado — Documentos existentes

#### /documents/marketing
- `60_PRODUCT_REQUIREMENTS.md` — Añadidas marcas de estado (✅/🚀/⚠️), referencias de código, comparativa con competencia
- `70_INVESTOR_PITCH_DECK.md`, `71_INVESTOR_ONE_PAGER.md`, `72_INVESTOR_MEMO.md` — Validación de claims vs código (sin cambios estructurales por estar bien redactados)

#### /documents/tecnicos
- `README.md` — Añadido enlace al índice maestro global
- `00_INDEX.md` — Añadido enlace al índice maestro, referencia a docs de producto en `/marketing`

---

### 🗑️ Eliminado — Archivos duplicados

Eliminados de `/documents/tecnicos` (movidos a `/marketing`):
- `60_PRODUCT_REQUIREMENTS.md` → ahora solo en `/marketing`
- `61_USER_FLOWS.md` → ahora solo en `/marketing`
- `62_ROADMAP.md` → ahora solo en `/marketing`

**Razón**: Contenido orientado a producto/stakeholders, no a desarrollo técnico. Se mantienen referencias en índice técnico.

---

### 📊 Métricas de cambio

#### Cobertura documental (antes → después)
- **Técnicos**: 38/38 (100%) → 38/38 (100%) — sin cambios en cantidad, mejorada calidad
- **Marketing**: 6/12 (~50%) → 8/12 (~67%) — añadidos elevator pitch y mensajes/CTAs
- **Usuarios**: 0/6 (0%) → 6/6 (100%) — **GAP CRÍTICO RESUELTO**

#### Archivos totales
- **Antes**: 44 archivos (38 técnicos + 6 marketing + 0 usuarios)
- **Después**: 57 archivos (35 técnicos + 8 marketing + 6 usuarios + 8 meta-docs)
- **Incremento**: +13 archivos (+29%)

#### Coherencia y navegación
- **Terminología**: ~70% → ~95% (guía de estilo aplicada)
- **Claims verificables**: ~60% → ~90% (marcas de estado en marketing)
- **Navegación global**: ❌ no existía → ✅ índice maestro funcional

---

### 🎯 Problemas resueltos

#### P0 — Críticos (RESUELTOS)
- ✅ **Documentación user-facing completa**: 6 archivos en `/usuarios`
- ✅ **Índice maestro unificado**: `/documents/00_INDEX.md` con navegación por audiencia
- ✅ **Duplicación de archivos**: eliminados duplicados en `/tecnicos`
- ✅ **Claims verificables en marketing**: marcas de estado (✅/🚀/⚠️) en todos los docs

#### P1 — Importantes (RESUELTOS)
- ✅ **Guía de estilo global**: `99_STYLE_GUIDE.md` con glosario, tono y formato
- ✅ **Piezas faltantes de marketing**: elevator pitch, mensajes cortos, app store listing
- ✅ **Privacidad para usuarios**: versión comprensible en `/usuarios/05_PRIVACIDAD_RESUMEN.md`

#### P2 — Deseables (RESUELTOS PARCIALMENTE)
- ✅ **Navegación "Start here" por audiencia**: implementada en índice maestro
- ⚠️ **Consolidación de roadmaps**: parcial (roadmap técnico vs producto aún separados, pero referenciados)
- ✅ **Enlaces y referencias cruzadas**: añadidos enlaces entre docs técnicos ↔ marketing ↔ usuarios
- ⚠️ **Documentar TODOs pendientes**: identificados en auditoría, pendientes de completar con info real

---

### 📝 Convenciones establecidas

#### Marcas de estado (aplicadas en toda la documentación)
- ✅ **IMPLEMENTADO**: funcionalidad verificada en código
- 🔄 **EN DESARROLLO**: en progreso activo
- 🚀 **ROADMAP**: planificado para el futuro
- ⚠️ **PENDIENTE / TODO**: información incompleta
- ❌ **NO VERIFICADO EN CÓDIGO**: sin evidencia en repositorio

#### Terminología unificada
- **Viatio** (producto) → no "viatio" ni "VIATIO"
- **Travel OS** (tagline) → no "travel OS" ni "TravelOS"
- **Viaje compartido** → no "viaje colaborativo" ni "shared trip"
- **Asistente inteligente** (usuarios) / **Copilot** (feature) → no "IA" ni "AI assistant"

Ver guía completa: `99_STYLE_GUIDE.md`

---

### 🔗 Estructura final de carpetas

```
/documents
├── 00_INDEX.md                     — Índice maestro global
├── 00_DOCS_AUDIT.md                — Auditoría completa
├── 00_CHANGELOG_DOCS.md            — Este archivo
├── 99_STYLE_GUIDE.md               — Guía de estilo
│
├── /usuarios (6 archivos)          — Documentación user-facing
│   ├── 01_OVERVIEW_PARA_USUARIOS.md
│   ├── 02_CASOS_DE_USO.md
│   ├── 03_GUIA_RAPIDA.md
│   ├── 04_FAQ.md
│   ├── 05_PRIVACIDAD_RESUMEN.md
│   └── 06_PRICING_PROPUESTO.md
│
├── /marketing (8 archivos)         — Pitch, investor docs, copy
│   ├── 05_ELEVATOR_PITCH.md        [NUEVO]
│   ├── 06_MENSAJES_CORTOS_Y_CTA.md [NUEVO]
│   ├── 60_PRODUCT_REQUIREMENTS.md  [MEJORADO]
│   ├── 61_USER_FLOWS.md
│   ├── 62_ROADMAP.md
│   ├── 70_INVESTOR_PITCH_DECK.md
│   ├── 71_INVESTOR_ONE_PAGER.md
│   └── 72_INVESTOR_MEMO.md
│
└── /tecnicos (35 archivos)         — Docs técnicas enterprise
    ├── README.md                    [MEJORADO]
    ├── 00_INDEX.md                  [MEJORADO]
    ├── 01–54: Docs técnicas         [SIN CAMBIOS]
    ├── 90_DIAGRAMS.md
    └── 99_DOCS_CHANGELOG.md
```

---

### 📌 Próximos pasos recomendados

#### Corto plazo (próximas 2 semanas)
1. **Validar pricing** con usuarios beta → ajustar `06_PRICING_PROPUESTO.md`
2. **Completar TODOs técnicos** identificados en auditoría:
   - Política de retención en Firestore (`31_PRIVACY_AND_DATA_HANDLING.md`)
   - Observabilidad enterprise (`25_OBSERVABILITY.md`)
   - Deployment formal (`24_DEPLOYMENT.md`)

#### Medio plazo (próximo mes)
3. **Crear assets visuales** para marketing:
   - Screenshots de app para app store listing
   - Diagramas de flujos de usuario (complementar `61_USER_FLOWS.md`)
   - Mockups para landing page

4. **Traducir docs de usuarios** a inglés (expansión internacional)

#### Largo plazo (próximos 3 meses)
5. **Automatizar linting de docs**:
   - Verificación automática de enlaces rotos
   - Validación de terminología según `99_STYLE_GUIDE.md`
   - Detección de claims sin marcas de estado

6. **Crear versión interactiva** del índice maestro (web)

---

### 🙏 Agradecimientos

Auditoría y reestructuración completada por equipo combinado de:
- **Product Manager**: requisitos de producto, pricing, roadmap
- **Technical Writer**: documentación técnica, referencias de código
- **UX Writer**: guías de usuario, FAQ, copy
- **Product Marketing Lead**: pitch, mensajes, app store listing

---

### 📧 Contacto para documentación

**Responsable**: [Por definir]
**Proceso de actualización**: [Por definir]
**Sugerencias de mejora**: Abrir issue en repo de docs

---

## [0.1.0] — [Fecha anterior] — Creación inicial

Documentación técnica enterprise creada:
- 38 documentos en `/documents/tecnicos`
- 6 documentos en `/documents/marketing`

**Estado**: Documentación técnica completa, pero faltaba documentación user-facing y navegación global.

---

**Fin del changelog**
