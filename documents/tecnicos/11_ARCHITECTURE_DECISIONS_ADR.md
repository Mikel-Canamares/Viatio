# Architecture Decision Records (ADR)

> Este documento registra decisiones arquitectónicas **inferidas del código actual**. No se encontró un repositorio formal de ADR en el proyecto, por lo que se registran decisiones iniciales con estatus **Accepted** o **PENDIENTE / TODO**.

## ADR-001: Stack principal de la app móvil
- **Estado**: Accepted (inferido)
- **Contexto**: La app está implementada en Expo/React Native con TypeScript y librerías típicas de navegación y UI.
- **Decisión**: Usar Expo/React Native como stack móvil.
- **Consecuencias**:
  - Desarrollo multi-plataforma iOS/Android.
  - Dependencia de Expo SDK y su ciclo de releases.

## ADR-002: Persistencia local offline-first con SQLite
- **Estado**: Accepted (inferido)
- **Contexto**: Existe un módulo `database` con esquema y migraciones en SQLite.
- **Decisión**: Persistir datos localmente en SQLite con migraciones controladas.
- **Consecuencias**:
  - Funcionalidad offline prioritaria.
  - Necesidad de sincronización con backend remoto en viajes compartidos.

## ADR-003: Sincronización remota con Firebase/Firestore
- **Estado**: Accepted (inferido)
- **Contexto**: Servicios de sincronización y suscripción en tiempo real con Firestore.
- **Decisión**: Usar Firestore para viajes compartidos y sincronización en tiempo real.
- **Consecuencias**:
  - Requiere manejo de conflictos y mapeo de IDs local vs remoto.
  - Dependencia de reglas de seguridad Firestore/Storage.

## ADR-004: Autenticación de usuarios con Firebase Auth
- **Estado**: Accepted (inferido)
- **Contexto**: Se usa Firebase Auth y Google Sign-In.
- **Decisión**: Centralizar autenticación en Firebase.
- **Consecuencias**:
  - Un solo proveedor de identidad.
  - Gestión de OAuth y configuración de client IDs por plataforma.

## ADR-005: Almacenamiento de documentos con Firebase Storage
- **Estado**: Accepted (inferido)
- **Contexto**: Módulos de documentos sincronizan binarios con Storage y metadatos en Firestore.
- **Decisión**: Usar Firebase Storage para archivos adjuntos.
- **Consecuencias**:
  - Separación de metadatos (Firestore) y binarios (Storage).
  - Requiere control de permisos en reglas de Storage.

## ADR-006: Estrategia de errores y reintentos en sincronización
- **Estado**: PENDIENTE / TODO
- **Contexto**: Se observan reintentos y logs, pero no una estrategia formal documentada.
- **Decisión**: Definir política homogénea de reintentos, backoff y manejo de conflictos.
- **Consecuencias**:
  - Reduce inconsistencias y fallos intermitentes.
  - Necesita documentación y pruebas específicas.

## ADR-007: Gestión de secretos vía variables de entorno
- **Estado**: Accepted (inferido)
- **Contexto**: Uso de `EXPO_PUBLIC_*` y variables en backend.
- **Decisión**: Configurar secretos vía variables de entorno.
- **Consecuencias**:
  - Requiere procesos de gestión de secretos en CI/CD.
  - Evita credenciales hardcodeadas en repositorio.

## ADR-008: Modularización por capas (UI / servicios / datos)
- **Estado**: Accepted (inferido)
- **Contexto**: Estructura `components`, `services`, `database`, `store`, `hooks`.
- **Decisión**: Separar responsabilidades por capas y dominios.
- **Consecuencias**:
  - Mejor mantenibilidad y escalabilidad.
  - Necesita disciplina de límites entre módulos.

## ADR-009: Observabilidad mínima en runtime
- **Estado**: PENDIENTE / TODO
- **Contexto**: Se observa logging con `console.log`/`console.error`, sin APM ni crash reporting explícitos.
- **Decisión**: Definir solución enterprise para logging, métricas y crashes.
- **Consecuencias**:
  - Mejor diagnóstico en producción.
  - Implica cambios de infraestructura y librerías.

