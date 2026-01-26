# 🔥 Configurar Firebase Cloud Messaging (FCM)

## ❌ Problema Actual

```
ERROR: Default FirebaseApp is not initialized in this process com.viatio.app
```

Este error significa que **falta el archivo `google-services.json`** en tu proyecto Android.

---

## ✅ Solución: Descargar y Configurar google-services.json

### **Paso 1: Abrir Firebase Console**

```bash
firebase open
```

O ve directamente a: https://console.firebase.google.com

### **Paso 2: Ir a Project Settings**

1. Click en el ⚙️ (engranaje) al lado de "Project Overview"
2. Selecciona **"Project Settings"**

### **Paso 3: Descargar google-services.json**

1. Scroll hasta la sección **"Your apps"**
2. Busca tu app Android (debería mostrar el icono de Android y el package `com.viatio.app`)
3. Si NO existe la app Android:
   - Click **"Add app"** → Android
   - Package name: `com.viatio.app`
   - App nickname: `Viatio`
   - Click **"Register app"**
4. Click en el botón **"google-services.json"** para descargar

### **Paso 4: Colocar el archivo en el proyecto**

```bash
# Copiar desde Descargas a viatio-app/
cp ~/Downloads/google-services.json viatio-app/

# O en Windows:
# copy %USERPROFILE%\Downloads\google-services.json viatio-app\
```

El archivo debe quedar en:
```
viatio-app/
├── google-services.json  ← AQUÍ
├── app.config.js
├── package.json
└── src/
```

### **Paso 5: Verificar configuración**

✅ Ya agregué la configuración en `app.config.js`:

```javascript
android: {
  googleServicesFile: './google-services.json',  // ← Agregado
  package: 'com.viatio.app',
  // ...
}
```

### **Paso 6: Añadir a .gitignore**

⚠️ **IMPORTANTE**: No subas este archivo a Git (contiene claves privadas)

```bash
# Verificar que está en .gitignore
grep -q "google-services.json" .gitignore || echo "google-services.json" >> .gitignore
```

### **Paso 7: Recompilar la app**

```bash
cd viatio-app

# Limpiar build anterior
rm -rf android/app/build

# Recompilar
npx expo run:android
```

---

## 🧪 Verificar que Funciona

### 1. Abrir la app y ver logs

Deberías ver:
```
[PushToken] Token obtained: ExponentPushToken[xxxxxx]...
[PushToken] Token registered successfully
```

En lugar de:
```
ERROR: Default FirebaseApp is not initialized ❌
```

### 2. Verificar en Firebase Console

```bash
firebase open
```

- Ve a **Firestore** → `users` → Tu documento
- Debería aparecer: `pushToken: "ExponentPushToken[...]"` ✅

### 3. Enviar notificación de prueba

```bash
cd functions
node test-notification-simple.js axdmRvpyOxbCluv7DAiEcu2t8Hf1
```

Deberías recibir la notificación en tu dispositivo 📱

---

## 🐛 Troubleshooting

### Problema 1: "google-services.json not found"

**Causa:** El archivo no está en la ruta correcta

**Solución:**
```bash
cd viatio-app
ls -la google-services.json  # Debe existir
```

Si no existe, vuelve al Paso 3 y descárgalo

### Problema 2: "App not found in Firebase Console"

**Causa:** No registraste la app Android en Firebase

**Solución:**
1. Firebase Console → Project Settings
2. Scroll a "Your apps"
3. Click **"Add app"** → Android
4. Package name: `com.viatio.app`
5. Descargar `google-services.json`

### Problema 3: Sigue sin funcionar después de recompilar

**Solución:**
```bash
cd viatio-app

# Limpiar todo
rm -rf android/app/build
rm -rf node_modules/.cache

# Recompilar desde cero
npx expo prebuild --clean
npx expo run:android
```

### Problema 4: "Package name doesn't match"

**Causa:** El package en `google-services.json` no coincide con `app.config.js`

**Solución:**
1. Abre `google-services.json`
2. Busca `"package_name": "..."`
3. Debe ser exactamente: `"com.viatio.app"`
4. Si no coincide, descarga de nuevo desde Firebase Console con el package correcto

---

## 📋 Checklist Final

Antes de recompilar, verifica:

- [ ] ✅ Archivo `google-services.json` existe en `viatio-app/`
- [ ] ✅ `app.config.js` tiene `googleServicesFile: './google-services.json'`
- [ ] ✅ Package name en `google-services.json` es `com.viatio.app`
- [ ] ✅ Archivo añadido a `.gitignore`
- [ ] ✅ Build limpiado (`rm -rf android/app/build`)
- [ ] ✅ App recompilada (`npx expo run:android`)

---

## 📱 Resultado Esperado

Después de configurar correctamente:

### Logs antes (❌):
```
ERROR: Default FirebaseApp is not initialized
[PushToken] No token to register
```

### Logs después (✅):
```
[PushToken] Starting push token registration...
[PushToken] Token obtained: ExponentPushToken[xxxxREAL_TOKEN]...
[PushToken] Token registered successfully
```

### En Firestore:
```
users/axdmRvpyOxbCluv7DAiEcu2t8Hf1
  pushToken: "ExponentPushToken[xxxxREAL_TOKEN]"
  pushTokenUpdatedAt: Timestamp(2026-01-26 12:00:00)
```

---

## 🚀 Siguiente Paso

Una vez que veas `[PushToken] Token registered successfully`:

```bash
cd functions
node test-notification-simple.js axdmRvpyOxbCluv7DAiEcu2t8Hf1
```

Deberías recibir: **"🧪 Notificación de Prueba"** en tu dispositivo 🎉

---

**Última actualización:** 2026-01-26
