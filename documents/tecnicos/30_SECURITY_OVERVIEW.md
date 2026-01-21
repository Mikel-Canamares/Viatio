# Seguridad - Overview

## Modelo de amenazas (alto nivel)
- **Exposición de claves**: API keys Firebase/Google/Gemini.
- **Acceso indebido a datos compartidos**: reglas de Firestore/Storage.
- **Abuso de endpoints IA**: alto coste por prompts o abuso de cuota.
- **Exfiltración local**: SQLite en dispositivo sin cifrado explícito.

## Superficie de ataque
- App móvil (dispositivo cliente)
- Backend IA (HTTP)
- Firestore/Storage
- Google Places/Maps API

## Gestión de credenciales
- Uso de variables de entorno (Expo/Backend).
- **PENDIENTE / TODO**: política de rotación y almacenamiento de secretos.

## Controles observados
- Rate limiting en backend.
- Error handler con mensajes sanitizados en producción.


