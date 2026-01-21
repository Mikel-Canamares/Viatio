# System Overview

## Objetivos del sistema
- Centralizar la planificación de viajes (agenda, reservas, gastos, lugares, documentos).
- Permitir **uso offline** con SQLite.
- Permitir **viajes compartidos** con sincronización en Firestore y tiempo real.
- Ofrecer **asistencia IA** para extracción de reservas y recomendaciones.

## Alcance funcional (as-is)
- **Gestión de viajes**: creación, edición, archivado, compartir.
- **Agenda y eventos**: días de viaje y eventos personalizados.
- **Reservas**: registro manual o extracción desde imagen (Gemini).
- **Gastos**: registro y cálculos de reparto para viajes compartidos.
- **Lugares**: integración Google Places + mapas.
- **Documentos**: almacenamiento local y sincronización en Firebase Storage.
- **Notificaciones**: uso de Expo Notifications (según módulos).

## Componentes principales
1. **viatio-app** (Expo/React Native)
   - UI/UX móvil, SQLite local, sincronización Firestore, integraciones Google/Firebase.
2. **viatio-backend** (Node/Express)
   - Endpoints de IA (Gemini), extracción de reservas y copiloto.

## Límites del sistema
- No existe backend propio de datos de viajes (solo Firebase/Firestore).
- Sin infraestructura de observabilidad enterprise definida.

## Dependencias clave
- Firebase (Auth/Firestore/Storage)
- Google Maps/Places APIs
- Gemini (Google Generative AI)
- Frankfurter API (tasas de cambio)


