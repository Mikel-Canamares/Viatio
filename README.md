# Viatio

App movil (Expo + React Native) para planificar viajes con autenticacion por email, persistencia local en SQLite y herramientas de agenda, reservas, mapas y documentos.

## Arquitectura rapida
- React Native 0.81 / Expo SDK 54 con tipado TypeScript y alias `@` hacia `src`.
- Navegacion con stacks y tabs (auth separado de la app principal).
- Estado global ligero en Zustand para viajes, reservas y documentos.
- Capa de servicios sobre expo-sqlite con migraciones versionadas y utilidades para IDs/timestamps.
- Integraciones: Firebase Auth (email/password + verificacion), Google Maps/Places/Directions, OCR externo con Gemini via backend, expo-file-system/next para archivos locales.
- Tema centralizado (`src/config/theme.ts`) y libreria de componentes reutilizables (cards, inputs, modales, badges, etc.).

## Flujos clave
- Onboarding y acceso: login/registro/reset de password con Firebase; bloqueo de la app si el email no esta verificado.
- Gestion de viajes: creacion con fechas, presupuesto, imagen y viajeros; resumen de stats y acceso a agenda, reservas, documentos y mapa.
- Agenda y calendario: dias de viaje generados automaticamente, vista agenda por fecha y calendario mensual con eventos (reservas/lugares).
- Reservas: CRUD por categoria (transporte, alojamiento, comida, actividad, other), estados de pago, metadatos y vinculo opcional a documentos.
- OCR para reservas: pantalla de escaneo que acepta camara/galeria/documentos, envia base64 al backend Gemini y pre-rellena el alta de reserva.
- Documentos: almacenamiento local en `Paths.document/viatio_docs`, deteccion de tipo (pdf/imagen), apertura y comparticion nativa.
- Mapa y lugares: busqueda y nearby con Google Places, marcador de ubicacion, guardado por dia/categoria y lista plegable de lugares visitados/pendientes.

## Datos y persistencia
- SQLite local (`viatio.db`) con tablas: `viajes`, `dias_viaje`, `reservas` (incluye `documentoId`), `lugares` (incluye `googlePlaceId`), `documentos`, `gastos`, `_migrations`.
- Version actual de esquema: 3 (migraciones en `src/database/migrations.ts` crean tablas, indices y columnas nuevas).
- Creacion de dias de viaje automatica al crear un viaje; eliminaciones en cascada apoyadas por claves foraneas.
- Flag de desarrollo `CLEAR_DB_ON_START` en `App.tsx` permite limpiar datos locales al arrancar.

## Configuracion y arranque

### 🚀 Inicio Rápido en Nuevo PC
Si es tu primera vez configurando el proyecto en un nuevo PC, usa el **script automático**:

**Windows:**
```bash
git clone <URL_REPO> Viatio
cd Viatio
setup-nuevo-pc.bat
```

**Mac/Linux:**
```bash
git clone <URL_REPO> Viatio
cd Viatio
chmod +x setup-nuevo-pc.sh
./setup-nuevo-pc.sh
```

📖 Ver guía detallada en [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) o [GUIA_MIGRACION.md](./GUIA_MIGRACION.md)

---

### 📝 Configuración Manual

1) Prerrequisitos: Node 18+, npm, Expo CLI y dispositivos/emuladores configurados.
2) Instalar dependencias: `cd viatio-app && npm install` y `cd viatio-backend && npm install`.
3) Variables de entorno (`viatio-app/.env.template` como base). La app lee variables con prefijo `EXPO_PUBLIC_`:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps/Places/Directions, tambien referenciado en `app.config.js`)
   - `EXPO_PUBLIC_BACKEND_URL` (endpoint que expone `/api/extract-reserva` para OCR con Gemini)
4) Ejecutar backend: `cd viatio-backend && npm run dev`
5) Ejecutar app: `cd viatio-app && npm start` (luego seleccionar plataforma), o `npm run android` / `npm run ios` / `npm run web`.

## Estructura de carpetas (clave)
- `viatio-app/App.tsx`: bootstrap, init de base de datos y manejo de errores/estado de carga.
- `viatio-app/src/navigation`: stacks/tabs (AuthStack, HomeStack, RootTabs/Navigator).
- `viatio-app/src/database`: conexion SQLite, esquema, migraciones, helpers (IDs, timestamps, limpieza).
- `viatio-app/src/services`: logica de dominio (viajes, reservas, documentos, lugares, agenda), integraciones externas (Google Places/Directions, OCR Gemini, file system).
- `viatio-app/src/store`: stores de Zustand para sincronizar UI con la capa de servicios.
- `viatio-app/src/screens`: pantallas principales (login/registro, lista/detalle de viajes, agenda/calendario, reservas, documentos, mapa, escaneo OCR).
- `viatio-app/src/components`: libreria UI reutilizable (cards, headers, inputs, botones, modales, mapa, etc.).
- `viatio-app/src/config`: tema y carga de variables de entorno/Firebase.

## Integraciones y notas operativas
- Firebase Auth: necesaria para login/registro y verificacion de email. Configurar todos los valores `EXPO_PUBLIC_FIREBASE_*`.
- Google Maps/Places/Directions: requiere habilitar SDKs y restringir la API key. iOS/Android leen la key desde `app.config.js`.
- OCR con Gemini: la app solo envuelve el envio de base64 al backend (`EXPO_PUBLIC_BACKEND_URL`); el backend debe implementar el endpoint `/api/extract-reserva` usando el prompt de `src/services/ai/geminiPrompt.ts`.
- Permisos: la app solicita ubicacion en el mapa y acceso a camara/galeria/documentos para el flujo de OCR y gestion de ficheros.
- Documentos locales: se copian a `viatio_docs` mediante `expo-file-system/next`; la apertura/comparticion usa intents (Android) o Linking/Sharing (iOS).

## Scripts npm
- `npm start`: Expo dev server.
- `npm run android` / `npm run ios`: build y lanzamiento nativo via Expo.
- `npm run web`: modo web (no todas las integraciones estan habilitadas).

## Riesgos y pendientes conocidos
- Sin variables `EXPO_PUBLIC_*` la autenticacion, mapas y OCR quedaran inactivos.
- El template `.env.template` usa nombres sin prefijo; aseguralos con `EXPO_PUBLIC_` al crear tu `.env`.
- No hay suite automatizada; validar flujos criticos (auth, creacion de viaje, OCR, guardado de documentos y mapa) manualmente tras cambios.
