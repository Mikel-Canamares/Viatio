# Integraciones externas

## Firebase (Auth, Firestore, Storage)
- **Propósito**: autenticación, sincronización en viajes compartidos y almacenamiento de documentos.
- **SDK**: `firebase` en app móvil.
- **Configuración**: variables `EXPO_PUBLIC_FIREBASE_*`.
- **Riesgos**: reglas mal configuradas pueden exponer datos.

## Google Places/Maps
- **Propósito**: búsqueda de lugares, detalles y fotos.
- **Endpoints (Places API v1)**:
  - `POST https://places.googleapis.com/v1/places:searchText`
  - `POST https://places.googleapis.com/v1/places:searchNearby`
  - `GET https://places.googleapis.com/v1/places/{placeId}`
  - `POST https://places.googleapis.com/v1/places:autocomplete`
- **Configuración**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Costes**: el código menciona tiers (Pro) y logging de coste en `placesCostLogger`.

## Google Maps Directions
- **Propósito**: cálculo de rutas.
- **Endpoint**: `https://maps.googleapis.com/maps/api/directions/json`.
- **Configuración**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Gemini (Google Generative AI)
- **Propósito**: extracción de reservas y asistente.
- **SDK**: `@google/generative-ai`.
- **Configuración**: `GEMINI_API_KEY` en backend.
- **Riesgos**: coste por tokens y respuestas variables.

## Frankfurter API
- **Propósito**: tasas de cambio.
- **Endpoint**: `https://api.frankfurter.app/latest`.
- **Costes**: gratuito según documentación del propio servicio.


