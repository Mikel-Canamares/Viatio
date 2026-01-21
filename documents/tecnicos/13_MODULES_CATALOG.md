# Catálogo de módulos

## App móvil (`viatio-app/src`)

| Módulo | Responsabilidad | Archivos clave | Dependencias principales |
|---|---|---|---|
| `components` | Componentes UI reutilizables | `components/*` | React Native, Expo UI |
| `screens` | Pantallas y flujos de usuario | `screens/*` | Navigation, stores |
| `navigation` | Stack y tabs de navegación | `navigation/*` | React Navigation |
| `database` | SQLite, esquema y migraciones | `database/schema.ts`, `database/migrations.ts` | expo-sqlite |
| `services` | Lógica de negocio, sync, integraciones | `services/*` | Firebase, Google APIs |
| `services/sync` | Sync upload/download/realtime | `services/sync/*` | Firestore |
| `services/firestore` | Acceso Firestore/Storage | `services/firestore/*` | firebase |
| `services/ai` | Copilot, context pack, acciones | `services/ai/*` | Backend IA |
| `store` | Estado global (Zustand) | `store/*` | zustand |
| `hooks` | Hooks personalizados | `hooks/*` | React |
| `types` | Tipos de dominio | `types/*` | TypeScript |
| `config` | Configuración/env/firebase | `config/*` | Env + Firebase |
| `utils` | Helpers y utilidades | `utils/*` | Varias |

## Backend (`viatio-backend/src`)

| Módulo | Responsabilidad | Archivos clave | Dependencias principales |
|---|---|---|---|
| `index.ts` | Bootstrap del servidor | `index.ts` | Express |
| `routes` | Endpoints HTTP | `routes/*` | Express Router |
| `services` | Integración Gemini AI | `services/geminiService.ts` | @google/generative-ai |
| `middleware` | Rate limiting y errores | `middleware/*` | express-rate-limit |
| `config` | Variables de entorno | `config/env.ts` | dotenv |
| `types` | Contratos API | `types/index.ts` | TypeScript |


