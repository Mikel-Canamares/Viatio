# Guía de Deploy del Backend de Viatio en Railway

## 📋 Índice
1. [Preparativos previos](#preparativos-previos)
2. [Configuración del proyecto](#configuración-del-proyecto)
3. [Configuración en Railway](#configuración-en-railway)
4. [Actualización del Frontend](#actualización-del-frontend)
5. [Verificación y Testing](#verificación-y-testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Preparativos previos

### Requisitos
- ✅ Cuenta en [Railway.app](https://railway.app)
- ✅ Repositorio GitHub con el código (asegúrate de tener push access)
- ✅ API Key de Google Gemini (para variables de entorno)
- ✅ Backend funcionando localmente

### Verificar estado actual
Antes de empezar, verifica que:
1. El backend compila sin errores: `cd viatio-backend && npm run build`
2. Los tests (si existen) pasan
3. El `.env.example` está actualizado con todas las variables necesarias
4. El `.gitignore` está correcto (no sube `.env`, `node_modules`, etc.)

---

## 🔧 Configuración del proyecto

### Paso 1: Ajustar `Dockerfile` (si es necesario)

**Dockerfile actual:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**⚠️ PROBLEMA IDENTIFICADO:** El Dockerfile copia `dist/` pero NO ejecuta el build. Railway necesita compilar TypeScript.

### Paso 2: Crear `.dockerignore`

Necesitamos un `.dockerignore` para optimizar la imagen Docker.

### Paso 3: Añadir `railway.json` (opcional pero recomendado)

Railway puede detectar automáticamente Node.js, pero un `railway.json` da más control.

### Paso 4: Actualizar scripts en `package.json`

Verificar que existan los scripts necesarios:
- `build`: compilar TypeScript
- `start`: ejecutar la app
- `dev`: desarrollo local (opcional para Railway)

### Paso 5: Crear archivo `railway.toml` para configuración avanzada

Define el comando de build y start explícitamente.

---

## 🚂 Configuración en Railway

### Opción A: Deploy con Dockerfile (Recomendado)

#### Paso 1: Crear nuevo proyecto en Railway
1. Ingresa a [railway.app](https://railway.app)
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway a acceder a tu repositorio
5. Selecciona el repositorio `Viatio`

#### Paso 2: Configurar el servicio
1. Railway detectará el `Dockerfile` automáticamente
2. En **Settings → General**:
   - **Root Directory**: `viatio-backend`
   - **Watch Paths**: `viatio-backend/**`

#### Paso 3: Configurar variables de entorno
En **Variables** tab, añade:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | `3000` | Puerto del servidor (Railway usa esto) |
| `NODE_ENV` | `production` | Entorno de producción |
| `GEMINI_API_KEY` | `tu_api_key_aqui` | API Key de Google Gemini |
| `CORS_ORIGINS` | `*` | Temporalmente permite todos los orígenes (ajustar luego) |

**Nota:** Railway asigna automáticamente el puerto público, pero internamente usa `PORT=3000`.

#### Paso 4: Configurar dominio
1. En **Settings → Networking**
2. Click en **"Generate Domain"**
3. Railway te dará una URL tipo: `https://tu-proyecto.up.railway.app`

#### Paso 5: Deploy
1. Railway iniciará el build automáticamente
2. Monitorea los logs en la pestaña **"Deployments"**
3. Verifica que el build termine sin errores

---

### Opción B: Deploy sin Dockerfile (Nixpacks)

Railway usa **Nixpacks** por defecto si no hay Dockerfile.

#### Configuración:
1. Sigue los pasos 1-4 de Opción A
2. En **Settings → Build**, asegúrate de:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `viatio-backend`

**Ventajas:** Más simple, Railway maneja todo.
**Desventajas:** Menos control sobre el entorno.

---

## 📱 Actualización del Frontend

### Paso 1: Configurar variable de entorno en Expo

**Archivo: `viatio-app/.env`**

```env
# Desarrollo local (tu IP)
# EXPO_PUBLIC_BACKEND_URL=http://192.168.0.16:3000

# Producción (Railway)
EXPO_PUBLIC_BACKEND_URL=https://tu-proyecto.up.railway.app
```

**⚠️ IMPORTANTE:** Reemplaza `tu-proyecto.up.railway.app` con la URL real de Railway.

### Paso 2: Verificar configuración en frontend

**Archivo: `viatio-app/src/config/env.ts`** (si no existe, créalo)

```typescript
export const config = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  // otras configuraciones...
};
```

### Paso 3: Actualizar servicios que usan el backend

Verifica que los servicios usen `config.backendUrl`:
- `viatio-app/src/services/ocrService.ts`
- `viatio-app/src/services/assistantService.ts`
- Cualquier otro servicio que llame al backend

### Paso 4: Actualizar CORS en Railway

Una vez tengas la app funcionando, **actualiza la variable `CORS_ORIGINS`** en Railway:

```
CORS_ORIGINS=exp://tu-app.exp.host,https://tu-app-expo.dev
```

**Para obtener los orígenes correctos:**
```bash
cd viatio-app
npx expo start
# Mira la URL que Expo muestra (ej: exp://192.168.x.x:8081)
```

---

## ✅ Verificación y Testing

### 1. Verificar health check
```bash
curl https://tu-proyecto.up.railway.app/health
```

Deberías recibir:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45
}
```

### 2. Probar OCR endpoint (opcional)
```bash
curl -X POST https://tu-proyecto.up.railway.app/api/extract-reserva \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "...test_base64...", "mimeType": "image/jpeg"}'
```

### 3. Probar desde la app móvil
1. Reinicia Expo: `cd viatio-app && npx expo start --clear`
2. Prueba una funcionalidad que use el backend
3. Monitorea los logs en Railway

---

## 🐛 Troubleshooting

### Error: "Module not found" en Railway
**Causa:** `dist/` no existe porque no se ejecutó el build.
**Solución:** Asegúrate de que Railway ejecute `npm run build` antes de `npm start`.

### Error: CORS blocked
**Causa:** `CORS_ORIGINS` no incluye el origen de tu app.
**Solución:**
1. Revisa los logs de red en Expo
2. Añade el origen exacto a `CORS_ORIGINS` en Railway

### Error: "Cannot GET /api/..."
**Causa:** El path está mal o el servidor no arrancó.
**Solución:**
1. Verifica logs en Railway
2. Confirma que la ruta existe en `src/routes/`

### El servidor se cae después de deployar
**Causa:** Error no manejado o variable de entorno faltante.
**Solución:**
1. Revisa logs en Railway → Deployments
2. Verifica que `GEMINI_API_KEY` esté configurada

### Timeout al hacer request desde la app
**Causa:** Railway en tier gratuito puede tener cold starts.
**Solución:** Primera request puede tardar 10-20s, luego será rápido.

---

## 🔄 Flujo de trabajo continuo

### Deploy automático
Railway hace **auto-deploy** en cada push a la rama configurada (main/master por defecto).

**Para cambiar la rama:**
1. Settings → Service → **Deployment Triggers**
2. Selecciona la rama deseada

### Monitoreo
- **Logs en tiempo real:** Railway Dashboard → Deployments → View Logs
- **Métricas:** Railway muestra CPU, memoria, requests

### Rollback
Si un deploy falla:
1. Railway → Deployments
2. Click en un deployment anterior funcional
3. Click en **"Redeploy"**

---

## 📦 Prompts para implementación

A continuación, los prompts para que puedas implementar cada paso:

### Prompt 1: Arreglar Dockerfile
```
El Dockerfile actual espera que dist/ ya exista, pero Railway necesita compilar TypeScript durante el build.

Actualiza viatio-backend/Dockerfile para:
1. Copiar todo el código fuente (no solo dist/)
2. Ejecutar npm install (incluyendo devDependencies para compilar)
3. Ejecutar npm run build
4. Limpiar devDependencies antes del CMD final (multi-stage build)
5. Mantener la imagen ligera

Usa un multi-stage build:
- Stage 1 (builder): compila TypeScript
- Stage 2 (production): solo runtime con dist/
```

### Prompt 2: Crear .dockerignore
```
Crea viatio-backend/.dockerignore para optimizar el build de Docker.

Debe excluir:
- node_modules (se instalarán en la imagen)
- dist (se generará en la imagen)
- .env (variables van por Railway)
- logs, archivos temporales
- archivos de IDE (.vscode, .idea)
- .git
```

### Prompt 3: Crear railway.json
```
Crea viatio-backend/railway.json para configurar Railway explícitamente.

Debe especificar:
- buildCommand: npm run build
- startCommand: npm start
- healthcheckPath: /health
- restartPolicyType: on-failure
```

### Prompt 4: Crear/verificar env.ts en frontend
```
En viatio-app/src/config/, verifica que exista env.ts y que exporte:
- backendUrl desde process.env.EXPO_PUBLIC_BACKEND_URL
- fallback a localhost:3000 si no está definida

Si no existe, créalo con TypeScript estricto.
```

### Prompt 5: Actualizar servicios del frontend
```
Revisa viatio-app/src/services/ y asegúrate de que todos los servicios que hacen fetch al backend usen:

import { config } from '@/config/env';

Y hagan requests a:
`${config.backendUrl}/api/...`

Archivos a revisar:
- ocrService.ts
- assistantService.ts
- Cualquier otro que haga HTTP requests
```

### Prompt 6: Actualizar .env.example en backend
```
Actualiza viatio-backend/.env.example para incluir todos los campos necesarios:
- PORT
- NODE_ENV
- GEMINI_API_KEY
- CORS_ORIGINS

Con comentarios explicativos para producción vs desarrollo.
```

### Prompt 7: Añadir script de health check
```
Añade un script en viatio-backend/package.json:

"healthcheck": "curl -f http://localhost:3000/health || exit 1"

Útil para verificar que el servidor esté up localmente o en CI/CD.
```

---

## 🎯 Checklist final antes de deploy

- [ ] `npm run build` funciona sin errores
- [ ] Dockerfile hace multi-stage build
- [ ] .dockerignore creado
- [ ] .env.example actualizado
- [ ] railway.json creado (opcional)
- [ ] Frontend tiene config/env.ts
- [ ] Servicios del frontend usan config.backendUrl
- [ ] .gitignore no sube .env ni node_modules
- [ ] GEMINI_API_KEY lista para poner en Railway
- [ ] Repositorio pusheado a GitHub

---

## 🚀 Siguientes pasos después del deploy

1. **Monitoreo:** Configura alertas en Railway (tier de pago)
2. **CDN:** Considera Cloudflare para cachear requests estáticos
3. **CI/CD:** Añade GitHub Actions para tests antes de deploy
4. **Logs:** Integra un servicio de logging (Logtail, Papertrail)
5. **Analytics:** Añade tracking de errores (Sentry)

---

**✅ Con esta guía, tu backend estará corriendo 24/7 en Railway y podrás probar desde cualquier dispositivo.**
