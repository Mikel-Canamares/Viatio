# Executive Summary

## Qué es Viatio
Viatio es un sistema compuesto por una **app móvil Expo/React Native** y un **backend Node/Express**. La app gestiona viajes, reservas, gastos, lugares y documentos con almacenamiento local en SQLite y sincronización opcional con Firebase/Firestore. El backend proporciona capacidades de IA (Gemini) para extracción de datos de reservas y asistentes de viaje.

## Estado actual (según código)
- **Front-end móvil**: implementación rica en módulos (agenda, gastos, documentos, mapas, notificaciones). La app usa Firebase Auth, Firestore y Storage cuando el viaje es compartido.
- **Persistencia**: SQLite local con migraciones y múltiples tablas (viajes, reservas, gastos, lugares, eventos personalizados, documentos).
- **Backend IA**: API HTTP en Express con endpoints `/health`, `/api/extract-reserva`, `/api/assistant`, `/api/copilot`.
- **Integraciones externas**: Firebase (Auth/Firestore/Storage), Google Places/Maps, Frankfurter (divisas) y Gemini (IA).

## Riesgos principales
- **Dependencia de terceros**: Gemini, Google Places, Firebase; fallos o cambios de cuota afectan funciones clave.
- **Seguridad de secretos**: múltiples claves en entorno; exige gestión estricta.
- **Observabilidad limitada**: logging básico; no se aprecia integración explícita con APM o crash reporting.

## Próximos pasos recomendados
1. Endurecer observabilidad (tracing, métricas, crash reporting) – **PENDIENTE / TODO**.
2. Definir estrategia formal de despliegue backend (entornos, rollback) – **PENDIENTE / TODO**.
3. Documentar política de privacidad y retención conforme a GDPR – **PENDIENTE / TODO**.
