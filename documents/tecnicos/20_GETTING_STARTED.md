# Getting Started

## Requisitos
- Node.js (ver `eas.json` y dependencias del proyecto).
- Expo CLI / EAS CLI (para desarrollo móvil).
- Android Studio / Xcode (si se ejecuta en emuladores).

## Quickstart (desarrollo local)
### 1) App móvil
```bash
cd viatio-app
npm install
npm run start
```

### 2) Backend IA
```bash
cd viatio-backend
npm install
npm run dev
```

## Configuración mínima
- Crea un archivo `.env` en la raíz del proyecto (o en la configuración de Expo) con las variables requeridas.
- Usa la plantilla: [`/documentacion/.env.example`](./.env.example).

## Verificación rápida
- App: abre Expo DevTools y lanza en emulador o dispositivo.
- Backend: revisa `http://localhost:3000/health`.


