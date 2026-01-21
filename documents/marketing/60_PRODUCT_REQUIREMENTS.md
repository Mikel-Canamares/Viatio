# Product Requirements (as-is)

## Descripción del producto
Viatio es una app móvil para organizar viajes con capacidades de agenda, gastos, reservas, lugares y documentos, con sincronización opcional para viajes compartidos y asistencia IA.

## Funcionalidades principales
- **Crear/editar viajes** con destino, fechas y presupuesto.
- **Agenda diaria** con eventos personalizados.
- **Gestión de reservas** manual o por extracción desde imagen (Gemini).
- **Gestión de gastos** con reparto en viajes compartidos.
- **Gestión de lugares** y sugerencias (Google Places).
- **Documentos**: almacenamiento y sincronización.
- **Notificaciones**: recordatorios y alertas (Expo Notifications).
- **Copilot**: asistente contextual con acciones sugeridas.

## Reglas de negocio detectadas
- Viajes compartidos requieren `isShared` y `firestoreId`.
- Sync solo aplica a viajes compartidos.
- Gastos vinculados a reservas pueden reflejar pagos compartidos.

## Fuera de alcance
- Pagos reales o reservas automáticas (no hay integración de pagos).

