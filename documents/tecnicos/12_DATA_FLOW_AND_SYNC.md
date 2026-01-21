# Data Flow & Sync

## Flujo end-to-end: extracción de reserva desde imagen
```mermaid
sequenceDiagram
  participant User as Usuario
  participant App as App móvil
  participant Backend as Backend IA (Express)
  participant Gemini as Gemini AI
  participant SQLite as SQLite local

  User->>App: Adjunta imagen de reserva
  App->>Backend: POST /api/extract-reserva (base64)
  Backend->>Gemini: Genera extracción estructurada
  Gemini-->>Backend: JSON de reserva
  Backend-->>App: Respuesta con datos
  App->>SQLite: Guarda reserva local
```

## Flujo end-to-end: viaje compartido (sync)
```mermaid
sequenceDiagram
  participant App as App móvil
  participant SQLite as SQLite local
  participant Firestore as Firebase Firestore
  participant Storage as Firebase Storage

  App->>SQLite: Crear/editar entidad (viaje, reserva, gasto, etc.)
  alt Viaje compartido
    App->>Firestore: Subir datos (syncUpload)
    Firestore-->>App: Confirmación + firestoreId
    App->>SQLite: Actualiza firestoreId
    Firestore-->>App: Cambios en tiempo real (subscriptions)
    App->>SQLite: Aplicar cambios remotos
  else Viaje no compartido
    App->>SQLite: Solo persistencia local
  end

  opt Documentos
    App->>Storage: Subir archivo
    Storage-->>App: URL/confirmación
    App->>Firestore: Guardar metadatos
  end
```

## Estrategia de sincronización (resumen)
- **Offline-first**: SQLite es la fuente primaria local.
- **Sync bidireccional**: subidas y descargas con Firestore cuando el viaje es compartido.
- **Identidad dual**: cada entidad puede tener `id` local y `firestoreId` remoto.
- **Tiempo real**: listeners Firestore actualizan SQLite en background.

## Consistencia y conflictos
- Se observa lógica de “vinculación” por `localId` y `firestoreId`.
- **PENDIENTE / TODO**: política formal de resolución de conflictos (prioridad temporal, merge, etc.).


