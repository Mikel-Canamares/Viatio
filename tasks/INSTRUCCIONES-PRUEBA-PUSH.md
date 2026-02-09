# 📲 Instrucciones: Probar Notificaciones Push

## ✅ Cambios Realizados

He creado una **pantalla de diagnóstico** que te permite:
1. Ver por qué no se está generando el push token
2. Forzar el registro manualmente con un botón
3. Ver toda la información del dispositivo y permisos

### Archivos modificados/creados:

- ✅ [viatio-app/src/screens/DiagnosticoPushScreen.tsx](../viatio-app/src/screens/DiagnosticoPushScreen.tsx) - Nueva pantalla
- ✅ [viatio-app/src/navigation/ProfileStackNavigator.tsx](../viatio-app/src/navigation/ProfileStackNavigator.tsx) - Agregada ruta
- ✅ [viatio-app/src/navigation/types.ts](../viatio-app/src/navigation/types.ts) - Agregado tipo
- ✅ [viatio-app/src/screens/SettingsScreen.tsx](../viatio-app/src/screens/SettingsScreen.tsx) - Botón de acceso
- ✅ [viatio-app/src/services/firestore/usersService.ts](../viatio-app/src/services/firestore/usersService.ts) - Ya tenía `getPushToken`
- ✅ [functions/test-notification-simple.js](../functions/test-notification-simple.js) - Script de prueba
- ✅ [functions/test-notification.js](../functions/test-notification.js) - Script avanzado
- ✅ [tasks/GUIA-NOTIFICACIONES.md](./GUIA-NOTIFICACIONES.md) - Guía completa

---

## 🚀 Pasos para Probar

### 1. Recompilar la app

```bash
cd viatio-app

# Android
npx expo run:android

# iOS
npx expo run:ios
```

### 2. Abrir pantalla de diagnóstico

1. Abre la app en tu **dispositivo físico**
2. Ve a **Perfil** (tab inferior)
3. Toca **Configuración** ⚙️
4. Scroll hacia abajo hasta **"🛠️ Desarrollo (Temporal)"**
5. Toca **"🔔 Diagnóstico Push Notifications"**

### 3. Revisar diagnóstico

Verás información sobre:
- ✅ **Usuario**: Si estás autenticado
- ✅ **Dispositivo**: Si es físico o emulador
- ✅ **Configuración**: Si tiene EAS Project ID
- ✅ **Permisos**: Estado de permisos de notificaciones
- ✅ **Push Token**: Si se obtuvo correctamente
- ✅ **Firestore**: Si está guardado en la nube

### 4. Forzar registro de token

Si el token NO está registrado:

1. En la pantalla de diagnóstico, toca el botón:
   **"🚀 Forzar Registro de Token"**

2. Si los permisos NO están otorgados:
   - Toca **"Solicitar Permisos"**
   - Acepta en el diálogo del sistema
   - Toca de nuevo **"🚀 Forzar Registro de Token"**

3. Deberías ver un mensaje: **"✅ Token registrado exitosamente"**

4. Toca **"🔄 Actualizar Diagnóstico"** para verificar

### 5. Verificar en Firebase Console

```bash
firebase open
```

1. Ve a **Firestore Database** → `users` → Tu documento
2. Busca el campo `pushToken`
3. Debería tener un valor tipo: `"ExponentPushToken[xxxxxx...]"`

---

## 🧪 Enviar Notificación de Prueba

Una vez que veas el `pushToken` en Firestore:

### Opción A: Script Simple

```bash
cd functions
node test-notification-simple.js axdmRvpyOxbCluv7DAiEcu2t8Hf1
```

### Opción B: Script Avanzado (requiere service-account.json)

```bash
cd functions

# 1. Descargar Service Account Key
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Guardar como: functions/service-account.json

# 2. Añadir a .gitignore
echo "functions/service-account.json" >> ../.gitignore

# 3. Editar test-notification.js y cambiar YOUR_USER_ID por:
# axdmRvpyOxbCluv7DAiEcu2t8Hf1

# 4. Ejecutar
node test-notification.js
```

### Opción C: Crear Gasto Compartido Real

La forma más real de probar:

1. Crea un viaje compartido
2. Invita a otro usuario (o crea otra cuenta)
3. Usuario A crea un gasto
4. Usuario B debería recibir notificación push

---

## 🔍 Ver Logs

### Logs de la app (en tiempo real):

```bash
cd viatio-app
npx expo start
# Mira la consola mientras usas la app
```

Deberías ver:
```
[PushToken] Starting push token registration...
[PushToken] Token obtained: ExponentPushToken[xxx]...
[PushToken] Token registered successfully
```

### Logs de Cloud Functions:

```bash
firebase functions:log --follow
```

Deberías ver:
```
[Push] Procesando notificación para user axdmRvpy...
[Push] Enviando push a token: ExponentPushToken[xxx]...
[Push] ✅ Push notification enviada exitosamente
```

---

## ❓ Troubleshooting

### Problema 1: "No es dispositivo físico"
- ⚠️ Las notificaciones push NO funcionan en emuladores
- Debes usar un dispositivo Android/iOS real

### Problema 2: "Permisos no otorgados"
- Toca **"Solicitar Permisos"** en la pantalla de diagnóstico
- O ve a: Ajustes → Apps → Viatio → Notificaciones → Activar

### Problema 3: "ProjectId no configurado"
- Ya está configurado en `app.config.js` ✅
- Si aparece esto, reinstala la app:
  ```bash
  # Desinstalar de dispositivo
  # Luego:
  npx expo run:android --device
  ```

### Problema 4: Token no se guarda en Firestore
- Verifica que estás autenticado (campo "Usuario" en diagnóstico)
- Toca **"🚀 Forzar Registro de Token"** manualmente
- Verifica internet en el dispositivo
- Revisa logs: `firebase functions:log`

### Problema 5: Notificación no llega
- ✅ Cierra completamente la app (las push se ven mejor en background)
- ✅ Verifica que `pushSent: true` en Firestore
- ✅ Revisa `pushTickets[0].status === 'ok'` en la notificación
- ✅ Espera ~10 segundos después de enviar

---

## 📊 Qué Esperar

### Al forzar registro exitoso:
1. Alert: **"✅ Token registrado exitosamente"**
2. En diagnóstico:
   - **Token obtenido**: ✅ Sí
   - **Token guardado (Firestore)**: ✅ Sí
3. En Firestore: Campo `pushToken` con valor

### Al enviar notificación de prueba:
1. Script muestra: **"🎉 ¡ÉXITO! Push notification enviada"**
2. En dispositivo: Aparece notificación en barra
3. En Firestore: `notifications/{userId}/notifications/{id}` creado
4. Campo `pushSent: true` en la notificación

---

## 📝 Próximos Pasos

Una vez que funcione:

1. ✅ Eliminar pantalla de diagnóstico (temporal)
2. ✅ Probar con gastos compartidos reales
3. ✅ Implementar deep linking desde notificaciones
4. ✅ Añadir preferencias de notificaciones por tipo
5. ✅ Rich notifications con imágenes

---

## 📚 Documentación Adicional

- [GUIA-NOTIFICACIONES.md](./GUIA-NOTIFICACIONES.md) - Guía completa del sistema
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

---

**Última actualización:** 2026-01-26
