# Índice maestro de documentación (Viatio)

## Cómo navegar la documentación
1. **Resumen ejecutivo y visión general** para entender el alcance y estado actual.
2. **Arquitectura y flujos de datos** para comprender cómo funciona la app y el backend.
3. **Operación y SRE/DevOps** para instalar, ejecutar y desplegar.
4. **Seguridad y compliance** para riesgos y controles.
5. **Base de datos e integraciones** para datos, sync y servicios externos.
6. **Calidad** para testing, estándares y contribución.
7. **Producto** para requisitos, flujos de usuario y roadmap.
8. **Diagramas centralizados** para visión rápida.

## Convenciones
- **PENDIENTE / TODO**: información incompleta en el código actual.
- **NO ENCONTRADO EN CÓDIGO**: no existe evidencia en el repositorio.
- **Ruta fuente**: cada sección referencia rutas relevantes del repositorio.

## Glosario rápido
- **App**: aplicación móvil Expo/React Native (carpeta `viatio-app`).
- **Backend**: API Node/Express para capacidades de IA (carpeta `viatio-backend`).
- **Sync**: sincronización local SQLite ↔ Firebase/Firestore.

## Mapa de documentación

### A) Entrypoint + mapa
- [01_EXECUTIVE_SUMMARY.md](./01_EXECUTIVE_SUMMARY.md)
- [02_SYSTEM_OVERVIEW.md](./02_SYSTEM_OVERVIEW.md)

### B) Arquitectura (Enterprise)
- [10_ARCHITECTURE_OVERVIEW.md](./10_ARCHITECTURE_OVERVIEW.md)
- [11_ARCHITECTURE_DECISIONS_ADR.md](./11_ARCHITECTURE_DECISIONS_ADR.md)
- [12_DATA_FLOW_AND_SYNC.md](./12_DATA_FLOW_AND_SYNC.md)
- [13_MODULES_CATALOG.md](./13_MODULES_CATALOG.md)
- [14_DOMAIN_MODEL.md](./14_DOMAIN_MODEL.md)

### C) Setup + Operación (SRE/DevOps)
- [20_GETTING_STARTED.md](./20_GETTING_STARTED.md)
- [21_LOCAL_DEVELOPMENT.md](./21_LOCAL_DEVELOPMENT.md)
- [22_CONFIGURATION_AND_ENV.md](./22_CONFIGURATION_AND_ENV.md)
- [23_BUILD_AND_RELEASE.md](./23_BUILD_AND_RELEASE.md)
- [24_DEPLOYMENT.md](./24_DEPLOYMENT.md)
- [25_OBSERVABILITY.md](./25_OBSERVABILITY.md)
- [26_RUNBOOKS.md](./26_RUNBOOKS.md)

### D) Seguridad y Compliance
- [30_SECURITY_OVERVIEW.md](./30_SECURITY_OVERVIEW.md)
- [31_PRIVACY_AND_DATA_HANDLING.md](./31_PRIVACY_AND_DATA_HANDLING.md)
- [32_DEPENDENCY_AND_SUPPLY_CHAIN.md](./32_DEPENDENCY_AND_SUPPLY_CHAIN.md)
- [33_SECURITY_CHECKLIST.md](./33_SECURITY_CHECKLIST.md)

### E) Base de datos + Integraciones
- [40_DATABASE_SCHEMA.md](./40_DATABASE_SCHEMA.md)
- [41_SYNC_STRATEGY.md](./41_SYNC_STRATEGY.md)
- [42_EXTERNAL_INTEGRATIONS.md](./42_EXTERNAL_INTEGRATIONS.md)
- [43_API_REFERENCE.md](./43_API_REFERENCE.md)

### F) Calidad: Testing, QA, Estándares
- [50_TEST_STRATEGY.md](./50_TEST_STRATEGY.md)
- [51_TESTING_HOWTO.md](./51_TESTING_HOWTO.md)
- [52_CODING_STANDARDS.md](./52_CODING_STANDARDS.md)
- [53_CONTRIBUTING.md](./53_CONTRIBUTING.md)
- [54_KNOWN_ISSUES_AND_TECH_DEBT.md](./54_KNOWN_ISSUES_AND_TECH_DEBT.md)

### G) Producto (Enterprise)
- [60_PRODUCT_REQUIREMENTS.md](./60_PRODUCT_REQUIREMENTS.md)
- [61_USER_FLOWS.md](./61_USER_FLOWS.md)
- [62_ROADMAP.md](./62_ROADMAP.md)

### H) Diagramas centralizados
- [90_DIAGRAMS.md](./90_DIAGRAMS.md)

### I) Metadatos
- [99_DOCS_CHANGELOG.md](./99_DOCS_CHANGELOG.md)

---

**Versionado de docs:** ver [99_DOCS_CHANGELOG.md](./99_DOCS_CHANGELOG.md).
