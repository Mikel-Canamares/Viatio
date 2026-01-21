# Configuración y variables de entorno

## Principios
- Las variables `EXPO_PUBLIC_*` son inyectadas por Expo en tiempo de build.
- El backend usa `dotenv` y variables en tiempo de ejecución.

## Variables de entorno (App móvil)
| Variable | Propósito | Uso en código |
|---|---|---|
| EXPO_PUBLIC_FIREBASE_API_KEY | API key Firebase | Config Firebase |
| EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN | Auth domain Firebase | Config Firebase |
| EXPO_PUBLIC_FIREBASE_PROJECT_ID | Project ID Firebase | Config Firebase |
| EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET | Storage bucket | Config Firebase |
| EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Messaging sender ID | Config Firebase |
| EXPO_PUBLIC_FIREBASE_APP_ID | App ID Firebase | Config Firebase |
| EXPO_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps/Places | googlePlacesService |
| EXPO_PUBLIC_BACKEND_URL | URL Backend IA | assistant/copilot services |
| EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID | OAuth Web | Google Auth |
| EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID | OAuth iOS | Google Auth |
| EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID | OAuth Android | Google Auth |

## Variables de entorno (Backend IA)
| Variable | Propósito |
|---|---|
| GEMINI_API_KEY | Clave API de Gemini (obligatoria) |
| CORS_ORIGINS | Lista de orígenes permitidos (CSV) |
| PORT | Puerto HTTP |
| NODE_ENV | Entorno de ejecución |

## Seguridad de secrets
- **No** almacenar claves en el repositorio.
- Gestionar secretos via Vault/Secret Manager en CI/CD.

## Plantilla
Usa la plantilla en: [`/documentacion/.env.example`](./.env.example)


