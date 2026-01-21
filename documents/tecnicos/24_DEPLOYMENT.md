# Deployment — Viatio

Guía completa de despliegue para backend y app móvil.

**Última actualización**: 2026-01-21

---

## Arquitectura de despliegue

```
┌─────────────────────────────────────────────────────┐
│                  PRODUCCIÓN                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐         ┌─────────────────┐  │
│  │   App Móvil      │         │   Backend IA    │  │
│  │   (EAS Build)    │◄───────►│   (Railway)     │  │
│  │                  │         │   + Docker      │  │
│  │  • iOS / Android │         │                 │  │
│  │  • App Store     │         │   Node/Express  │  │
│  │  • Play Store    │         │   + Gemini API  │  │
│  └──────────────────┘         └─────────────────┘  │
│         ▲                              ▲             │
│         │                              │             │
│         ▼                              ▼             │
│  ┌────────────────────────────────────────────┐    │
│  │         Firebase (Google Cloud)             │    │
│  │  • Auth (autenticación)                     │    │
│  │  • Firestore (sync viajes compartidos)     │    │
│  │  • Storage (documentos compartidos)         │    │
│  │  • Cloud Messaging (notificaciones)         │    │
│  └────────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Backend IA — Deployment en Railway

### Stack técnico
- **Runtime**: Node.js 18 (Alpine Linux)
- **Framework**: Express
- **Containerización**: Docker multi-stage
- **Hosting**: Railway (PaaS)

**Referencia de código**: `viatio-backend/Dockerfile`

---

### Dockerfile (multi-stage build)

El backend usa un Dockerfile optimizado en 2 etapas:

#### Stage 1: Builder
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY viatio-backend/package*.json ./
RUN npm install                      # Instala todas las deps (incluidas devDependencies)
COPY viatio-backend/ ./
RUN npm run build                    # Compila TypeScript → JavaScript
```

**Función**: Compilar TypeScript a JavaScript en `/app/dist`

#### Stage 2: Production Runtime
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY viatio-backend/package*.json ./
RUN npm install --omit=dev           # Solo dependencias de producción
COPY --from=builder /app/dist ./dist # Copia el build compilado
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "dist/index.js"]
```

**Optimizaciones**:
- ✅ Imagen final ligera (~150MB vs ~500MB con devDependencies)
- ✅ Solo node_modules de producción
- ✅ Health check integrado para monitoring
- ✅ Build context desde raíz del monorepo (Railway requirement)

**Referencia**: `viatio-backend/Dockerfile`

---

### Configuración en Railway

#### Variables de entorno requeridas

```bash
# Node
NODE_ENV=production
PORT=3000  # Railway lo asigna automáticamente si no se especifica

# APIs
GEMINI_API_KEY=AIzaSy...  # API key de Google Gemini
GOOGLE_MAPS_API_KEY=AIzaSy...  # API key de Google Maps

# CORS
CORS_ORIGINS=https://viatio.com,https://www.viatio.com  # Dominios permitidos

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos en ms
RATE_LIMIT_MAX=100  # Máximo de requests por ventana
```

**Referencia**: `viatio-backend/src/config/env.ts`

#### Railway CLI commands

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link <PROJECT_ID>

# Configurar variables de entorno
railway variables set GEMINI_API_KEY=your_key_here

# Desplegar manualmente (opcional, Railway hace auto-deploy desde Git)
railway up

# Ver logs en tiempo real
railway logs

# Ver estado del servicio
railway status
```

#### Auto-deployment desde Git

Railway está configurado para **auto-deploy** cuando hay push a la rama principal:

1. Push a `main` o `develop` (según configuración)
2. Railway detecta cambios
3. Ejecuta `docker build` usando `viatio-backend/Dockerfile`
4. Despliega nueva versión con zero-downtime
5. Health check valida que `/health` responde 200 OK

**Configuración recomendada**:
- ✅ Auto-deploy: ON
- ✅ Branch: `main` (producción) o `develop` (staging)
- ✅ Root directory: `/viatio-backend` (o configurar Dockerfile path)
- ✅ Health check path: `/health`
- ✅ Region: `us-west1` (Oregon, menor latencia para Gemini API)

---

### Health check endpoint

**Endpoint**: `GET /health`

**Respuesta exitosa** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T10:30:00.000Z",
  "uptime": 3600
}
```

**Referencia**: `viatio-backend/src/routes/health.ts`

---

### Rollback

#### Opción 1: Railway Dashboard (recomendado)
1. Ve a Railway Dashboard → Deployments
2. Selecciona deployment anterior que funcionaba
3. Click en "Redeploy"

#### Opción 2: Git revert
```bash
# Revertir último commit
git revert HEAD
git push origin main

# Railway auto-despliega la versión anterior
```

#### Opción 3: Railway CLI
```bash
# Ver historial de deployments
railway deployments

# Rollback a deployment específico
railway redeploy <DEPLOYMENT_ID>
```

**Tiempo estimado de rollback**: 2–5 minutos

---

## App móvil — Deployment con EAS Build

### Stack técnico
- **Framework**: Expo SDK 52 (managed workflow)
- **Build system**: EAS (Expo Application Services)
- **Distribution**: App Store (iOS) + Play Store (Android)

**Referencia de código**: `viatio-app/eas.json`, `viatio-app/app.config.js`

---

### Configuración EAS Build

#### Perfiles de build

| Perfil | Propósito | Output | Distribución |
|--------|-----------|--------|--------------|
| `development` | Desarrollo local con Expo Dev Client | APK (Android) | Internal |
| `preview` | Testing interno pre-lanzamiento | APK/IPA | Internal |
| `production` | Release a stores | AAB (Android) / IPA (iOS) | App Store / Play Store |

**Referencia**: `viatio-app/eas.json`

---

### Comandos EAS

#### Setup inicial

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Vincular proyecto
eas build:configure
```

#### Builds

**Production build**:
```bash
# Android (AAB para Play Store)
eas build --profile production --platform android

# iOS (IPA para App Store)
eas build --profile production --platform ios

# Ambos simultáneamente
eas build --profile production --platform all
```

#### Submit a stores

```bash
# Android
eas submit --platform android --latest

# iOS
eas submit --platform ios --latest
```

---

### Variables de entorno

Archivo `.env` en `viatio-app/`:

```bash
# Google APIs
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=viatio-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viatio-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=viatio-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123

# Backend
EXPO_PUBLIC_BACKEND_URL=https://viatio-backend.railway.app
```

**⚠️ IMPORTANTE**: Variables con prefijo `EXPO_PUBLIC_` son incluidas en el bundle (accesibles en cliente)

---

### Updates over-the-air (OTA)

```bash
# Publicar update
eas update --branch production --message "Fix crash on trip detail"

# Rollback
eas update:rollback --branch production
```

**Qué se puede actualizar con OTA**:
- ✅ JavaScript/TypeScript code
- ✅ Assets (imágenes, fuentes)

**Qué NO se puede actualizar**:
- ❌ Cambios en native code
- ❌ Versión de Expo SDK
- ❌ Permisos nuevos

---

## Checklist de deployment

### Backend (Railway)

- [ ] Variables de entorno configuradas
- [ ] `GEMINI_API_KEY` válida
- [ ] `CORS_ORIGINS` incluye dominio de producción
- [ ] Health check responde 200 OK en `/health`
- [ ] Rate limiting configurado

### App móvil (EAS)

- [ ] Variables `EXPO_PUBLIC_*` configuradas
- [ ] Firebase config correcta
- [ ] Google Maps API key válida
- [ ] Build production exitoso
- [ ] Metadata completa en stores
- [ ] Privacy policy publicada

---

## Referencias

- **Railway Docs**: https://docs.railway.app
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com

---

**Última actualización**: 2026-01-21
