# ⚡ Inicio Rápido - Viatio en Nuevo PC

## 🎯 Opción 1: Script Automático (RECOMENDADO)

### En Windows:
```bash
# 1. Clona el repo
git clone <URL_REPO> Viatio
cd Viatio
git checkout develop

# 2. Ejecuta el script
setup-nuevo-pc.bat

# 3. Edita los archivos .env creados con tus credenciales
# - viatio-app/.env
# - viatio-backend/.env

# 4. Arranca el proyecto (2 terminales)
# Terminal 1:
cd viatio-backend
npm run dev

# Terminal 2:
cd viatio-app
npm start
```

### En Mac/Linux:
```bash
# 1. Clona el repo
git clone <URL_REPO> Viatio
cd Viatio
git checkout develop

# 2. Ejecuta el script
chmod +x setup-nuevo-pc.sh
./setup-nuevo-pc.sh

# 3. Edita los archivos .env creados con tus credenciales
# - viatio-app/.env
# - viatio-backend/.env

# 4. Arranca el proyecto (2 terminales)
# Terminal 1:
cd viatio-backend
npm run dev

# Terminal 2:
cd viatio-app
npm start
```

---

## 🛠️ Opción 2: Manual (si el script falla)

### Paso 1: Clonar
```bash
git clone <URL_REPO> Viatio
cd Viatio
git checkout develop
```

### Paso 2: Instalar dependencias
```bash
# App
cd viatio-app
npm install

# Backend
cd ../viatio-backend
npm install
```

### Paso 3: Configurar .env

**IMPORTANTE:** Copia los archivos `.env` que guardaste del PC anterior.

Si no los tienes, crea estos archivos:

**`viatio-app/.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_clave
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_maps
EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:3000
```

**`viatio-backend/.env`:**
```env
PORT=3000
GEMINI_API_KEY=tu_clave_gemini
NODE_ENV=development
CORS_ORIGINS=http://localhost:8081,exp://192.168.X.X:8081,http://192.168.X.X:8081
```

> 💡 Para obtener tu IP: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)

### Paso 4: Arrancar
```bash
# Terminal 1 - Backend
cd viatio-backend
npm run dev

# Terminal 2 - App
cd viatio-app
npm start
```

---

## 🚨 Problemas Comunes

### "Module not found"
```bash
cd viatio-app
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### "Firebase not configured"
- Verifica que todas las variables `EXPO_PUBLIC_*` están en `.env`
- Verifica que los valores son correctos

### "Cannot connect to backend"
1. Backend debe estar corriendo: `cd viatio-backend && npm run dev`
2. Actualiza la IP en `EXPO_PUBLIC_BACKEND_URL` y `CORS_ORIGINS`

---

## ✅ Checklist

- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Repo clonado y en rama `develop`
- [ ] `npm install` ejecutado en ambas carpetas
- [ ] Archivos `.env` configurados
- [ ] Backend arrancado sin errores
- [ ] App arrancada sin errores

---

## 📚 Más información

Ver [GUIA_MIGRACION.md](./GUIA_MIGRACION.md) para detalles completos.
