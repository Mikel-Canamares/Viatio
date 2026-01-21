# Diagramas centralizados

## Diagrama de componentes
Fuente: [10_ARCHITECTURE_OVERVIEW.md](./10_ARCHITECTURE_OVERVIEW.md)
```mermaid
flowchart LR
  subgraph Mobile[App móvil - Expo/React Native]
    UI[UI Screens]
    LocalDB[(SQLite Local)]
    Sync[Sync Engine]
    Auth[Firebase Auth]
  end

  subgraph Firebase[Firebase]
    Firestore[(Firestore)]
    Storage[(Storage)]
  end

  subgraph Backend[Backend IA - Express]
    Extract[API /api/extract-reserva]
    Assistant[API /api/assistant]
    Copilot[API /api/copilot]
  end

  subgraph External[Servicios externos]
    Places[Google Places/Maps]
    Frankfurter[Frankfurter API]
    Gemini[Gemini AI]
  end

  UI --> LocalDB
  UI --> Sync
  UI --> Auth
  Sync <--> Firestore
  Sync <--> Storage
  UI --> Backend
  Backend --> Gemini
  UI --> Places
  UI --> Frankfurter
```

## Diagrama de secuencia: extracción de reserva
Fuente: [12_DATA_FLOW_AND_SYNC.md](./12_DATA_FLOW_AND_SYNC.md)
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

## ERD SQLite
Fuente: [40_DATABASE_SCHEMA.md](./40_DATABASE_SCHEMA.md)
```mermaid
erDiagram
  viajes ||--o{ dias_viaje : contiene
  viajes ||--o{ reservas : contiene
  viajes ||--o{ lugares : contiene
  viajes ||--o{ documentos : contiene
  viajes ||--o{ gastos : contiene
  viajes ||--o{ eventos_personalizados : contiene
  dias_viaje ||--o{ reservas : agrupa
  dias_viaje ||--o{ lugares : agrupa
  dias_viaje ||--o{ eventos_personalizados : agrupa
  reservas ||--o{ gastos : asociado
  reservas ||--o{ reservas_documentos : vincula
  documentos ||--o{ reservas_documentos : vincula
  lugares ||--o{ reservas : referencia
  lugares ||--o{ eventos_personalizados : referencia
```

## State diagram de sync
Fuente: [41_SYNC_STRATEGY.md](./41_SYNC_STRATEGY.md)
```mermaid
stateDiagram-v2
  [*] --> LocalOnly
  LocalOnly: Viaje no compartido

  LocalOnly --> SyncEnabled: Viaje compartido + firestoreId
  SyncEnabled --> Uploading: Cambios locales pendientes
  Uploading --> Synced: Confirmación Firestore
  SyncEnabled --> Downloading: Cambios remotos
  Downloading --> Synced

  Synced --> SyncEnabled
  SyncEnabled --> Error
  Error --> SyncEnabled: reintento
```

