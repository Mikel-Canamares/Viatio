# Auditoría de Documentación — Viatio

**Fecha de auditoría:** 2026-01-21
**Auditor:** Equipo combinado PM + Tech Writer + UX Writer + Marketing Lead
**Objetivo:** Diagnóstico completo del estado de la documentación existente y plan de mejora priorizado.

---

## Resumen ejecutivo

### Estado general
La documentación técnica en `/documents/tecnicos` es **extensa y bien estructurada** con 38 archivos que cubren arquitectura, operación, seguridad, base de datos, testing y producto desde una perspectiva enterprise/developer.

La documentación de marketing en `/documents/marketing` contiene **6 archivos orientados a inversores**, con pitch deck, one-pager y memo bien redactados, pero falta contenido para usuarios finales.

**NO EXISTE** documentación orientada a usuarios potenciales (no técnicos) que explique qué es Viatio, cómo usarlo, casos de uso, FAQ, privacidad comprensible ni pricing.

### Problemas detectados

#### P0 — Críticos (afectan a usuarios y go-to-market)
1. **Falta documentación user-facing completa**: No hay guías de usuario, onboarding, FAQ ni casos de uso para potenciales clientes.
2. **No hay índice maestro unificado**: El índice actual está solo en `/documents/tecnicos/00_INDEX.md`, sin visión global de marketing ni usuarios.
3. **Duplicación de archivos**: `60_PRODUCT_REQUIREMENTS.md`, `61_USER_FLOWS.md` y `62_ROADMAP.md` existen **duplicados** en `/documents/tecnicos` y `/documents/marketing` (contenido similar pero no idéntico).
4. **Claims no verificables en marketing**: Varios documentos de marketing mencionan funcionalidades futuras o propuestas sin marcar claramente qué está implementado vs roadmap.

#### P1 — Importantes (afectan a coherencia y escalabilidad)
5. **Inconsistencia terminológica**: "Travel OS" vs "app móvil", "asistente IA" vs "Copilot", "Gemini" vs "capacidades de IA".
6. **Falta guía de estilo global**: No hay documento que unifique tono, terminología, formato y convenciones de claims.
7. **Enlaces rotos o relativos incorrectos**: Algunos enlaces en `/documents/tecnicos` asumen estructura interna sin validar rutas.
8. **Privacidad y GDPR incompleto**: `/documents/tecnicos/31_PRIVACY_AND_DATA_HANDLING.md` marca múltiples **PENDIENTE / TODO** pero no hay versión comprensible para usuarios.

#### P2 — Deseables (mejoras incrementales)
9. **Falta navegación por audiencia**: No hay "start here" claro para: desarrolladores, usuarios, inversores, partners.
10. **Documentos muy técnicos para producto**: `60_PRODUCT_REQUIREMENTS.md` en `/documents/tecnicos` está orientado a devs, no a PM/stakeholders.
11. **Roadmap disperso**: Hay roadmaps técnicos y de producto/marketing sin consolidar.
12. **Faltan piezas de marketing**: No hay elevator pitch, mensajes cortos, CTAs, copy para ads/redes, app store listing.

---

## Mapa de documentos existentes

### A) Documentos técnicos (`/documents/tecnicos`) — 38 archivos

| Archivo | Propósito | Audiencia | Estado | Mejoras necesarias |
|---------|-----------|-----------|--------|-------------------|
| `00_INDEX.md` | Índice maestro técnico | Developers/SRE | ✅ Completo | Integrar con índice global |
| `README.md` | Punto de entrada técnico | Developers | ✅ Completo | Redirigir a índice global |
| `01_EXECUTIVE_SUMMARY.md` | Resumen ejecutivo del sistema | Tech leads/CTO | ✅ Completo | OK |
| `02_SYSTEM_OVERVIEW.md` | Visión general del sistema | Developers | ✅ Completo | OK |
| `10_ARCHITECTURE_OVERVIEW.md` | Arquitectura de alto nivel | Architects/Devs | ✅ Completo | OK |
| `11_ARCHITECTURE_DECISIONS_ADR.md` | Decisiones arquitectónicas | Architects/Tech leads | ⚠️ Parcial | Verificar completitud de ADRs |
| `12_DATA_FLOW_AND_SYNC.md` | Flujos de datos y sync | Developers | ✅ Completo | OK |
| `13_MODULES_CATALOG.md` | Catálogo de módulos | Developers | ✅ Completo | OK |
| `14_DOMAIN_MODEL.md` | Modelo de dominio | Developers/Architects | ✅ Completo | OK |
| `20_GETTING_STARTED.md` | Primeros pasos | New developers | ✅ Completo | OK |
| `21_LOCAL_DEVELOPMENT.md` | Setup local | Developers | ✅ Completo | OK |
| `22_CONFIGURATION_AND_ENV.md` | Config y variables | Devs/DevOps | ✅ Completo | OK |
| `23_BUILD_AND_RELEASE.md` | Build y release | DevOps/Release mgr | ✅ Completo | OK |
| `24_DEPLOYMENT.md` | Despliegue | DevOps/SRE | ⚠️ Parcial | Marcar TODOs pendientes |
| `25_OBSERVABILITY.md` | Observabilidad | SRE/DevOps | ⚠️ Parcial | Marcar TODOs pendientes |
| `26_RUNBOOKS.md` | Runbooks operación | SRE/Ops | ⚠️ Parcial | Marcar TODOs pendientes |
| `30_SECURITY_OVERVIEW.md` | Seguridad general | Security/Devs | ✅ Completo | OK |
| `31_PRIVACY_AND_DATA_HANDLING.md` | Privacidad y datos | Security/Legal | ⚠️ Incompleto | Marcar TODOs; crear versión usuario |
| `32_DEPENDENCY_AND_SUPPLY_CHAIN.md` | Dependencias | DevOps/Security | ✅ Completo | OK |
| `33_SECURITY_CHECKLIST.md` | Checklist seguridad | Security/Devs | ✅ Completo | OK |
| `40_DATABASE_SCHEMA.md` | Esquema BD | Developers/DBAs | ✅ Completo | OK |
| `41_SYNC_STRATEGY.md` | Estrategia sync | Developers | ✅ Completo | OK |
| `42_EXTERNAL_INTEGRATIONS.md` | Integraciones externas | Developers | ✅ Completo | OK |
| `43_API_REFERENCE.md` | Referencia API | Developers | ✅ Completo | OK |
| `50_TEST_STRATEGY.md` | Estrategia testing | QA/Developers | ✅ Completo | OK |
| `51_TESTING_HOWTO.md` | Cómo testear | Developers/QA | ✅ Completo | OK |
| `52_CODING_STANDARDS.md` | Estándares código | Developers | ✅ Completo | OK |
| `53_CONTRIBUTING.md` | Guía contribución | Contributors | ✅ Completo | OK |
| `54_KNOWN_ISSUES_AND_TECH_DEBT.md` | Issues y deuda técnica | Developers/PM | ✅ Completo | OK |
| `60_PRODUCT_REQUIREMENTS.md` | Requisitos producto | PM/Developers | ✅ Completo | **DUPLICADO** con marketing |
| `61_USER_FLOWS.md` | Flujos usuario | PM/Designers | ✅ Completo | **DUPLICADO** con marketing |
| `62_ROADMAP.md` | Roadmap técnico | PM/Tech leads | ⚠️ Propuesto | **DUPLICADO** con marketing |
| `90_DIAGRAMS.md` | Diagramas centralizados | All | ✅ Completo | OK |
| `99_DOCS_CHANGELOG.md` | Changelog docs | All | ✅ Completo | OK |

### B) Documentos marketing (`/documents/marketing`) — 6 archivos

| Archivo | Propósito | Audiencia | Estado | Mejoras necesarias |
|---------|-----------|-----------|--------|-------------------|
| `60_PRODUCT_REQUIREMENTS.md` | Requisitos producto | PM/Stakeholders | ✅ Completo | **DUPLICADO** con técnicos; consolidar |
| `61_USER_FLOWS.md` | Flujos usuario | PM/Designers | ✅ Completo | **DUPLICADO** con técnicos; consolidar |
| `62_ROADMAP.md` | Roadmap producto | PM/Stakeholders | ⚠️ Propuesto | **DUPLICADO** con técnicos; consolidar |
| `70_INVESTOR_PITCH_DECK.md` | Pitch deck inversores | Investors/VCs | ✅ Completo | Validar claims vs código |
| `71_INVESTOR_ONE_PAGER.md` | One-pager inversores | Investors | ✅ Completo | Validar claims vs código |
| `72_INVESTOR_MEMO.md` | Memo inversores | Investors | ✅ Completo | Verificar NO LEÍDO aún |

**Faltan piezas clave**:
- Elevator pitch (30s/60s/2min)
- Mensajes cortos y CTAs (ads, redes)
- App Store / Play Store listing
- Press kit / Media assets
- Partnership decks

### C) Documentos usuarios (`/documents/usuarios`) — 0 archivos

**NO EXISTE** esta carpeta. Es el gap más crítico.

**Documentos necesarios**:
1. `01_OVERVIEW_PARA_USUARIOS.md` — Qué es Viatio en 30 segundos
2. `02_CASOS_DE_USO.md` — 6–10 casos reales con "antes/con Viatio/resultado"
3. `03_GUIA_RAPIDA.md` — Cómo empezar en 5–10 pasos
4. `04_FAQ.md` — 25–40 preguntas frecuentes agrupadas
5. `05_PRIVACIDAD_RESUMEN.md` — Resumen comprensible (no legal)
6. `06_PRICING_PROPUESTO.md` — Planes Free/Plus/Pro con lógica de valor

---

## Problemas de coherencia detectados

### 1. Terminología inconsistente

| Concepto | Variantes encontradas | Propuesta unificada |
|----------|----------------------|-------------------|
| Producto | "Viatio", "Travel OS", "app móvil", "sistema" | **Viatio** (nombre), **Travel OS** (tagline/positioning) |
| IA | "asistente IA", "Copilot", "Gemini", "capacidades IA" | **Asistente inteligente** (usuario), **Copilot** (feature), **Gemini** (tech stack) |
| Sincronización | "sync", "sincronización", "viajes compartidos" | **Sincronización** (general), **Viajes compartidos** (feature) |
| Backend | "backend", "backend IA", "API Express" | **Backend de IA** (arquitectura), **API de Viatio** (referencia usuario) |
| Usuario | "usuario", "viajero", "user" | **Usuario** (docs técnicas), **Viajero** (docs marketing/usuarios) |

### 2. Claims no verificados o ambiguos

**En documentos de marketing**:
- ❌ "IA madura para automatizar tareas de organización" → NO especifica qué está implementado hoy vs roadmap
- ❌ "Automatización de documentos y gastos" → parcialmente verificado (OCR reservas sí, gastos automáticos NO VERIFICADO)
- ❌ "Experiencia Apple-like" → claim subjetivo sin criterios
- ❌ TAM/SAM/SOM ($20–30B, 150–250M usuarios) → marcado como "supuesto" pero sin fuente
- ❌ Pricing "€4.99/mes (Lite), €9.99/mes (Pro)" → propuesto, no validado

**Recomendación**: Separar claramente:
- ✅ **Implementado hoy** (verificable en código)
- 🔄 **En desarrollo** (con timeline si existe)
- 🚀 **Roadmap futuro** (propuesta sin compromiso)

### 3. Duplicación de archivos

| Archivo | Ubicación 1 | Ubicación 2 | Diferencias |
|---------|------------|-------------|-------------|
| `60_PRODUCT_REQUIREMENTS.md` | `/tecnicos` | `/marketing` | Contenido idéntico |
| `61_USER_FLOWS.md` | `/tecnicos` | `/marketing` | Contenido idéntico |
| `62_ROADMAP.md` | `/tecnicos` | `/marketing` | Técnicos: roadmap de infraestructura; Marketing: roadmap de producto |

**Recomendación**:
- Mantener `60_PRODUCT_REQUIREMENTS.md` y `61_USER_FLOWS.md` en `/marketing` (audiencia PM/stakeholders)
- Eliminar duplicados en `/tecnicos` y referenciar desde allí
- Consolidar `62_ROADMAP.md` en un solo archivo con secciones técnicas y producto

### 4. Enlaces y referencias

**No detectados enlaces rotos** en revisión inicial, pero:
- ⚠️ El índice actual (`/tecnicos/00_INDEX.md`) solo referencia archivos técnicos
- ⚠️ No hay enlaces entre documentos técnicos ↔ marketing ↔ usuarios
- ⚠️ Faltan referencias cruzadas contextuales (ej: desde arquitectura → diagramas)

---

## Plan de mejora priorizado

### P0 — Crítico (ejecutar primero)

| # | Acción | Impacto | Esfuerzo | Entregables |
|---|--------|---------|----------|-------------|
| 1 | **Crear documentación user-facing completa** | 🔥🔥🔥 Alto | 🕒🕒🕒 Alto | 6 archivos en `/documents/usuarios` |
| 2 | **Crear índice maestro unificado** | 🔥🔥 Medio-Alto | 🕒 Bajo | `/documents/00_INDEX.md` con navegación por audiencia |
| 3 | **Resolver duplicación de archivos** | 🔥🔥 Medio | 🕒 Bajo | Consolidar `60/61/62` y actualizar referencias |
| 4 | **Validar y marcar claims en marketing** | 🔥🔥 Medio-Alto | 🕒🕒 Medio | Revisar `70/71/72` con marcas "IMPLEMENTADO/ROADMAP" |

### P1 — Importante (ejecutar después)

| # | Acción | Impacto | Esfuerzo | Entregables |
|---|--------|---------|----------|-------------|
| 5 | **Crear guía de estilo global** | 🔥 Medio | 🕒 Bajo | `/documents/99_STYLE_GUIDE.md` |
| 6 | **Unificar terminología en todos los docs** | 🔥 Medio | 🕒🕒 Medio | Aplicar glosario de style guide |
| 7 | **Completar piezas faltantes de marketing** | 🔥 Medio | 🕒🕒 Medio | Elevator pitch, CTAs, App Store listing |
| 8 | **Expandir privacidad para usuarios** | 🔥 Medio | 🕒 Bajo | Versión comprensible de `31_PRIVACY` en `/usuarios` |

### P2 — Deseable (mejora continua)

| # | Acción | Impacto | Esfuerzo | Entregables |
|---|--------|---------|----------|-------------|
| 9 | **Añadir navegación "Start here" por audiencia** | 🔥 Bajo-Medio | 🕒 Bajo | Sección en índice maestro |
| 10 | **Consolidar roadmaps** | 🔥 Bajo | 🕒 Medio | Roadmap único con vistas técnica/producto |
| 11 | **Revisar enlaces y referencias cruzadas** | 🔥 Bajo | 🕒 Bajo | Lint de enlaces en todos los docs |
| 12 | **Documentar TODOs pendientes** | 🔥 Bajo | 🕒🕒 Medio | Completar `24/25/26/31` con info real o marcar explícitamente |

---

## Métricas de éxito

### Cobertura documental
- ✅ **Técnicos**: 38/38 archivos (100%)
- ⚠️ **Marketing**: 6/12 archivos (~50%, faltan piezas clave)
- ❌ **Usuarios**: 0/6 archivos (0%, gap crítico)

### Coherencia
- ⚠️ Terminología: ~70% consistente (mejorar con style guide)
- ⚠️ Claims verificables: ~60% en marketing (validar vs código)
- ✅ Estructura: buena en técnicos, OK en marketing, N/A en usuarios

### Navegabilidad
- ✅ Índice técnico: funcional
- ❌ Índice global: no existe
- ❌ Navegación por audiencia: no existe

---

## Próximos pasos

1. ✅ **Ejecutar plan P0** (este sprint)
2. 🔄 **Ejecutar plan P1** (próximo sprint)
3. 🚀 **Ejecutar plan P2** (mejora continua)
4. 📊 **Revisión trimestral** de coherencia y completitud

---

**Fin de auditoría** — Ver plan de ejecución en tareas asignadas.
