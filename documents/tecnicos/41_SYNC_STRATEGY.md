# Estrategia de sincronización

## Principios
- **Offline-first**: SQLite es la fuente primaria local.
- **Sincronización condicional**: solo viajes con `isShared=1` y `firestoreId`.
- **Tiempo real**: listeners Firestore para lugares, reservas, eventos, documentos, gastos.

## State diagram (Mermaid)
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

## Reintentos y conflictos
- Se observan reintentos en descargas y logs de sincronización.
- **PENDIENTE / TODO**: política formal de resolución de conflictos y backoff.


