# 🚀 Guía de Migración de Viatio a Otro PC

## 📋 PROBLEMA IDENTIFICADO

El proyecto **NO arranca** en otro PC porque falta el archivo `.env` (con las credenciales) que está en `.gitignore` y **nunca se sube a Git**.

---

## ✅ SOLUCIÓN RECOMENDADA: Git + Archivo .env Manual

Esta es la forma **más limpia y profesional** de migrar el proyecto.

### 📦 Paso 1: Preparar archivos sensibles en el PC actual

1. **Copia tu archivo `.env` de la app**
   ```bash
   # En tu PC actual (Windows):
   # El archivo está en: d:\PROYECTOS\VIATIO\Viatio\viatio-app\.env

   # Copiarlo al escritorio temporalmente
   copy "d:\PROYECTOS\VIATIO\Viatio\viatio-app\.env" "%USERPROFILE%\Desktop\viatio-app.env"
   ```

2. **Copia tu archivo `.env` del backend**
   ```bash
   # El archivo está en: d:\PROYECTOS\VIATIO\Viatio\viatio-backend\.env

   copy "d:\PROYECTOS\VIATIO\Viatio\viatio-backend\.env" "%USERPROFILE%\Desktop\viatio-backend.env"
   ```

3. **Guarda estos 2 archivos en**:
   - Un pendrive USB
   - OneDrive/Google Drive
   - Email a ti mismo
   - O cualquier método seguro

---

### 🖥️ Paso 2: En el PC nuevo

#### A) Clonar el repositorio desde Git

```bash
# 1. Abre una terminal (PowerShell o CMD)
cd C:\tu\carpeta\de\proyectos

# 2. Clona el repo (asegúrate de estar en la rama develop)
git clone <URL_DE_TU_REPO> Viatio
cd Viatio
git checkout develop

# 3. Verifica que estás en la rama correcta
git branch
# Debe mostrar: * develop
```

#### B) Instalar dependencias

**Para la APP (viatio-app):**
```bash
cd viatio-app

# 1. Instalar dependencias
npm install

# 2. Verificar que se instaló todo correctamente
npx tsc --noEmit
# No debe mostrar errores graves
```

**Para el BACKEND (viatio-backend):**
```bash
cd ../viatio-backend

# 1. Instalar dependencias
npm install

# 2. Verificar compilación
npx tsc --noEmit
```

#### C) Configurar archivos `.env`

**1. Configurar `.env` de la app:**
```bash
cd ../viatio-app

# Copiar los archivos .env que guardaste antes aquí:
# - Desde el pendrive/OneDrive/etc
# - Pegarlos en: C:\tu\carpeta\de\proyectos\Viatio\viatio-app\.env

# Verificar que existe:
dir .env
# Debe aparecer el archivo
```

**2. Configurar `.env` del backend:**
```bash
cd ../viatio-backend

# Copiar el archivo .env del backend aquí:
# - Pegarlos en: C:\tu\carpeta\de\proyectos\Viatio\viatio-backend\.env

# Verificar que existe:
dir .env
```

**⚠️ IMPORTANTE:** Si tienes que crear manualmente los archivos `.env` (porque no los guardaste), usa estas plantillas:

**`viatio-app/.env`:**
```env
# FIREBASE
EXPO_PUBLIC_FIREBASE_API_KEY=<tu_clave_firebase>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<tu_proyecto>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<tu_proyecto>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<tu_proyecto>.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<tu_app_id>

# GOOGLE MAPS
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<tu_clave_google_maps>

# BACKEND (ajusta la IP del PC nuevo)
EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:3000
```

**`viatio-backend/.env`:**
```env
PORT=3000
GEMINI_API_KEY=<tu_clave_gemini>
NODE_ENV=development

# Actualiza con la IP de tu PC nuevo (usa 'ipconfig' en Windows)
CORS_ORIGINS=http://localhost:8081,exp://192.168.X.X:8081,http://192.168.X.X:8081
```

---

### ▶️ Paso 3: Arrancar el proyecto

#### 1. Arrancar el backend (terminal 1)
```bash
cd C:\tu\carpeta\de\proyectos\Viatio\viatio-backend
npm run dev

# Debes ver:
# ✅ Server running on http://localhost:3000
```

#### 2. Arrancar la app (terminal 2)
```bash
cd C:\tu\carpeta\de\proyectos\Viatio\viatio-app
npm start

# Esto abrirá Expo Dev Tools
# Presiona:
# - 'a' para Android emulator
# - 'i' para iOS simulator
# - Escanea el QR con Expo Go en tu móvil
```

---

## 🔧 Solución de Problemas Comunes

### Error: "Module not found"
```bash
# Limpiar caché e instalar de nuevo
cd viatio-app
rm -rf node_modules package-lock.json
npm install

# Limpiar caché de Expo
npm start -- --clear
```

### Error: "Firebase configuration"
- Verifica que tu archivo `.env` tiene **TODOS** los valores con el prefijo `EXPO_PUBLIC_`
- Verifica que las claves son correctas (copia desde Firebase Console)

### Error: "Cannot connect to backend"
1. Verifica que el backend está corriendo en `http://localhost:3000`
2. Obtén la IP de tu PC nuevo:
   ```bash
   ipconfig
   # Busca "IPv4 Address" de tu conexión WiFi/Ethernet
   # Ejemplo: 192.168.1.105
   ```
3. Actualiza `EXPO_PUBLIC_BACKEND_URL` y `CORS_ORIGINS` con esa IP

### Error al arrancar en emulador Android/iOS
```bash
# Android: verifica que Android Studio y el emulador están instalados
# iOS (solo Mac): verifica que Xcode está instalado

# Si usas desarrollo con Expo Go, NO necesitas emuladores
# Solo instala "Expo Go" desde Play Store/App Store
```

---

## 📝 Checklist Final

Antes de empezar a trabajar en el PC nuevo, verifica:

- [ ] Git está instalado
- [ ] Node.js 18+ está instalado (`node --version`)
- [ ] Has clonado el repo y estás en la rama `develop`
- [ ] Has ejecutado `npm install` en `viatio-app/` y `viatio-backend/`
- [ ] Tienes los archivos `.env` en ambas carpetas
- [ ] El backend arranca sin errores (`npm run dev`)
- [ ] La app arranca sin errores (`npm start`)
- [ ] TypeScript no muestra errores (`npx tsc --noEmit`)

---

## 🎯 Resumen Ejecutivo

**¿Por qué no arranca en otro PC?**
- Falta el archivo `.env` con las credenciales (Firebase, Google Maps, Gemini)
- Las dependencias `node_modules/` no están en Git

**¿Solución más rápida?**
1. Guarda tus archivos `.env` en un lugar seguro
2. Clona el repo en el PC nuevo
3. Haz `npm install` en ambas carpetas
4. Pega los archivos `.env` guardados
5. Arranca backend y app

**Tiempo estimado:** 10-15 minutos (si tienes todo instalado)

---

## 🆘 Si algo falla

1. Verifica que Node.js está instalado: `node --version`
2. Verifica que Git está instalado: `git --version`
3. Lee los errores completos en la terminal
4. Comprueba que los archivos `.env` existen: `dir .env` (en cada carpeta)
5. Si sigue sin funcionar, comparte el error exacto

