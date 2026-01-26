# Generar APK local para instalación en dispositivos físicos

Este proceso genera un APK de release que puedes instalar en cualquier dispositivo Android sin necesidad de estar conectado al PC. Ideal para demos y reuniones.

## Pre-requisitos
- Dispositivo Android conectado por USB (solo para instalación inicial)
- USB debugging habilitado en el dispositivo
- Variables de entorno configuradas en `.env` local

## Pasos

### 1. Prebuild del proyecto
```bash
cd viatio-app
npx expo prebuild --clean
```

### 2. Compilar APK de release
```bash
cd android
gradlew assembleRelease
```

En Windows, si da error, usar:
```bash
.\gradlew.bat assembleRelease
```

### 3. Ubicación del APK generado
```
viatio-app/android/app/build/outputs/apk/release/app-release.apk
```

### 4. Instalar en dispositivo conectado

Primero desinstalar versión anterior (evita conflictos de firma):
```bash
adb uninstall com.viatio.app
```

Luego instalar el nuevo APK:
```bash
adb install app\build\outputs\apk\release\app-release.apk
```

### 5. Distribuir el APK

**Opción A - USB:**
Ya está instalado del paso 4. Desconecta el cable y úsalo libremente.

**Opción B - Compartir archivo:**
1. Copia `app-release.apk` a Google Drive, Dropbox, etc.
2. Descarga desde el móvil
3. Habilita "Instalar apps de fuentes desconocidas" en Android
4. Instala el APK

**Opción C - Email/WhatsApp:**
Envía el APK directamente y ábrelo desde el móvil.

## Notas importantes

- Este APK usa las variables de entorno de tu `.env` local
- La firma es de debug/desarrollo, no de producción
- Para builds de producción final, usa EAS Build
- El APK es standalone: no requiere Expo Go ni conexión al PC
- Cada vez que reconstruyas, tendrás que desinstalar la versión anterior antes de instalar la nueva

## Troubleshooting

**Error: INSTALL_FAILED_UPDATE_INCOMPATIBLE**
- Solución: Desinstala primero la app anterior con `adb uninstall com.viatio.app`

**Error: adb no reconocido**
- Solución: Asegúrate de tener Android SDK instalado y en el PATH

**La app no abre después de instalar**
- Revisa logs: `adb logcat | grep -i "viatio\|error\|crash"`
- Verifica que las variables de entorno estén configuradas en `.env`
