# Índice Maestro — Documentación Viatio

Bienvenido/a al portal central de documentación de **Viatio**, tu Travel OS personal.

Esta documentación está organizada por audiencia y propósito. Encuentra rápidamente lo que necesitas usando la navegación por roles y áreas.

---

## 📍 Start Here — Empieza por tu audiencia

### 👤 Soy usuario (potencial o actual)
**¿Quieres saber qué es Viatio, cómo usarlo y qué te ofrece?**

➡️ **Ve a:** [Documentación para usuarios](./usuarios/01_OVERVIEW_PARA_USUARIOS.md)

📂 Contenido disponible:
- [Overview para usuarios](./usuarios/01_OVERVIEW_PARA_USUARIOS.md) — Qué es Viatio en 30 segundos
- [Casos de uso](./usuarios/02_CASOS_DE_USO.md) — 10 escenarios reales de viajeros
- [Guía rápida](./usuarios/03_GUIA_RAPIDA.md) — Empieza en 5 pasos
- [FAQ](./usuarios/04_FAQ.md) — 40+ preguntas frecuentes
- [Privacidad](./usuarios/05_PRIVACIDAD_RESUMEN.md) — Tus datos, tu control
- [Planes y pricing](./usuarios/06_PRICING_PROPUESTO.md) — Free, Lite y Pro

---

### 💼 Soy inversor, partner o stakeholder
**¿Quieres entender el negocio, mercado y oportunidad?**

➡️ **Ve a:** [Documentación de marketing e inversores](./marketing/71_INVESTOR_ONE_PAGER.md)

📂 Contenido disponible:
- [One-pager inversores](./marketing/71_INVESTOR_ONE_PAGER.md) — Resumen ejecutivo en 1 página
- [Pitch deck (texto)](./marketing/70_INVESTOR_PITCH_DECK.md) — Narrativa completa de slides
- [Investor memo](./marketing/72_INVESTOR_MEMO.md) — Memo detallado con mercado, producto, métricas y "the ask"
- [Product requirements](./marketing/60_PRODUCT_REQUIREMENTS.md) — Funcionalidades y reglas de negocio
- [User flows](./marketing/61_USER_FLOWS.md) — Flujos principales de usuario
- [Roadmap propuesto](./marketing/62_ROADMAP.md) — Hoja de ruta técnica y producto

---

### 👨‍💻 Soy desarrollador, arquitecto o DevOps
**¿Quieres entender la arquitectura, setup local y operación?**

➡️ **Ve a:** [Documentación técnica](./tecnicos/00_INDEX.md)

📂 Contenido disponible (38 documentos):
- **Resumen ejecutivo y sistema**: `01_EXECUTIVE_SUMMARY.md`, `02_SYSTEM_OVERVIEW.md`
- **Arquitectura**: `10_ARCHITECTURE_OVERVIEW.md`, `11_ARCHITECTURE_DECISIONS_ADR.md`, `12_DATA_FLOW_AND_SYNC.md`, `13_MODULES_CATALOG.md`, `14_DOMAIN_MODEL.md`
- **Setup y operación**: `20_GETTING_STARTED.md`, `21_LOCAL_DEVELOPMENT.md`, `22_CONFIGURATION_AND_ENV.md`, `23_BUILD_AND_RELEASE.md`, `24_DEPLOYMENT.md`, `25_OBSERVABILITY.md`, `26_RUNBOOKS.md`
- **Seguridad**: `30_SECURITY_OVERVIEW.md`, `31_PRIVACY_AND_DATA_HANDLING.md`, `32_DEPENDENCY_AND_SUPPLY_CHAIN.md`, `33_SECURITY_CHECKLIST.md`
- **Base de datos e integraciones**: `40_DATABASE_SCHEMA.md`, `41_SYNC_STRATEGY.md`, `42_EXTERNAL_INTEGRATIONS.md`, `43_API_REFERENCE.md`
- **Calidad y testing**: `50_TEST_STRATEGY.md`, `51_TESTING_HOWTO.md`, `52_CODING_STANDARDS.md`, `53_CONTRIBUTING.md`, `54_KNOWN_ISSUES_AND_TECH_DEBT.md`
- **Diagramas y metadatos**: `90_DIAGRAMS.md`, `99_DOCS_CHANGELOG.md`

➡️ **Índice técnico completo**: [tecnicos/00_INDEX.md](./tecnicos/00_INDEX.md)

---

## 🗂️ Estructura de carpetas

```
/documents
├── 00_INDEX.md                 ← Estás aquí (índice maestro)
├── 00_DOCS_AUDIT.md            ← Auditoría de documentación
├── 99_STYLE_GUIDE.md           ← Guía de estilo global (terminología, tono)
│
├── /usuarios                   ← Documentación user-facing
│   ├── 01_OVERVIEW_PARA_USUARIOS.md
│   ├── 02_CASOS_DE_USO.md
│   ├── 03_GUIA_RAPIDA.md
│   ├── 04_FAQ.md
│   ├── 05_PRIVACIDAD_RESUMEN.md
│   └── 06_PRICING_PROPUESTO.md
│
├── /marketing                  ← Pitch, investor docs, roadmap
│   ├── 60_PRODUCT_REQUIREMENTS.md
│   ├── 61_USER_FLOWS.md
│   ├── 62_ROADMAP.md
│   ├── 70_INVESTOR_PITCH_DECK.md
│   ├── 71_INVESTOR_ONE_PAGER.md
│   └── 72_INVESTOR_MEMO.md
│
└── /tecnicos                   ← Docs técnicas enterprise (38 archivos)
    ├── 00_INDEX.md             ← Índice técnico detallado
    ├── 01–02: Executive summary + system overview
    ├── 10–14: Arquitectura
    ├── 20–26: Setup y operación
    ├── 30–33: Seguridad
    ├── 40–43: Base de datos e integraciones
    ├── 50–54: Calidad y testing
    ├── 90: Diagramas
    └── 99: Changelog
```

---

## 🎯 Navegación rápida por temas

### Quiero entender qué hace Viatio
- **Para usuarios**: [Overview para usuarios](./usuarios/01_OVERVIEW_PARA_USUARIOS.md)
- **Para inversores**: [One-pager](./marketing/71_INVESTOR_ONE_PAGER.md)
- **Para devs**: [Executive summary técnico](./tecnicos/01_EXECUTIVE_SUMMARY.md)

### Quiero ver cómo funciona Viatio
- **Casos de uso reales**: [Casos de uso](./usuarios/02_CASOS_DE_USO.md)
- **Flujos de usuario**: [User flows](./marketing/61_USER_FLOWS.md)
- **Arquitectura técnica**: [Architecture overview](./tecnicos/10_ARCHITECTURE_OVERVIEW.md)

### Quiero empezar a usar Viatio
- **Guía rápida**: [Guía rápida](./usuarios/03_GUIA_RAPIDA.md)
- **FAQ**: [FAQ usuarios](./usuarios/04_FAQ.md)

### Quiero desarrollar o contribuir
- **Getting started**: [Getting started](./tecnicos/20_GETTING_STARTED.md)
- **Local development**: [Local development](./tecnicos/21_LOCAL_DEVELOPMENT.md)
- **Contributing**: [Contributing](./tecnicos/53_CONTRIBUTING.md)

### Quiero entender privacidad y datos
- **Para usuarios**: [Privacidad resumen](./usuarios/05_PRIVACIDAD_RESUMEN.md)
- **Para devs/legal**: [Privacy and data handling](./tecnicos/31_PRIVACY_AND_DATA_HANDLING.md)

### Quiero entender el roadmap
- **Roadmap producto**: [Roadmap](./marketing/62_ROADMAP.md)
- **Known issues y tech debt**: [Known issues](./tecnicos/54_KNOWN_ISSUES_AND_TECH_DEBT.md)

---

## 📖 Convenciones de documentación

### Marcas de estado
- ✅ **IMPLEMENTADO**: Funcionalidad verificada en código actual
- 🔄 **EN DESARROLLO**: En progreso activo
- 🚀 **ROADMAP**: Planificado para el futuro
- ⚠️ **PENDIENTE / TODO**: Información incompleta o por definir
- ❌ **NO VERIFICADO EN CÓDIGO**: Sin evidencia en repositorio

### Audiencias
- **Usuarios**: personas que usan Viatio para organizar viajes
- **Inversores/Stakeholders**: personas interesadas en el negocio
- **Desarrolladores**: personas que desarrollan o mantienen Viatio
- **DevOps/SRE**: personas que despliegan y operan Viatio

### Glosario rápido
- **Viatio**: nombre del producto
- **Travel OS**: tagline y posicionamiento ("sistema operativo del viaje")
- **App móvil**: aplicación Expo/React Native (carpeta `viatio-app`)
- **Backend de IA**: API Node/Express para capacidades Gemini
- **Viajes compartidos**: viajes sincronizados con Firebase/Firestore
- **Asistente inteligente / Copilot**: funcionalidad de IA contextual
- **Sync**: sincronización local SQLite ↔ Firestore

➡️ **Guía completa de estilo**: [99_STYLE_GUIDE.md](./99_STYLE_GUIDE.md)

---

## 🔍 Meta-documentación

- **Auditoría de documentación**: [00_DOCS_AUDIT.md](./00_DOCS_AUDIT.md) — Estado y plan de mejora
- **Changelog técnico**: [tecnicos/99_DOCS_CHANGELOG.md](./tecnicos/99_DOCS_CHANGELOG.md)
- **Guía de estilo**: [99_STYLE_GUIDE.md](./99_STYLE_GUIDE.md)

---

## 🆘 Ayuda y soporte

- **Usuarios**: Consulta la [FAQ](./usuarios/04_FAQ.md) primero
- **Desarrolladores**: Revisa [Known issues](./tecnicos/54_KNOWN_ISSUES_AND_TECH_DEBT.md) y [Contributing](./tecnicos/53_CONTRIBUTING.md)
- **Inversores/Partners**: Contacta a través de los canales oficiales mencionados en el [One-pager](./marketing/71_INVESTOR_ONE_PAGER.md)

---

**Última actualización**: 2026-01-21
**Versión de docs**: v1.0 (post-auditoría inicial)
