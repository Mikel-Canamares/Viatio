# Desarrollo local

## App móvil (Expo)
- **Modo dev client**: `npm run start` (usa `expo start --dev-client`).
- **Web**: `npm run web`.
- **Android**: `npm run android`.
- **iOS**: `npm run ios`.

### Emuladores y dispositivo físico
- **Android**: requiere Android Studio y un emulador configurado.
- **iOS**: requiere macOS + Xcode (NO ENCONTRADO EN CÓDIGO si hay instrucciones específicas).
- **Dispositivo físico**: usar Expo Go o un dev client.

### Depuración
- Logs en consola Metro y en la consola del dispositivo.
- Revisar logs de sincronización (módulos `services/sync`).

## Backend IA (Express)
- Dev server: `npm run dev`.
- Endpoints principales:
  - `GET /health`
  - `POST /api/extract-reserva`
  - `POST /api/assistant`
  - `POST /api/copilot`


