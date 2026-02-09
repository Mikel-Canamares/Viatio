# 📲 Guía Completa: Sistema de Notificaciones Push en Viatio

## 🏗️ Arquitectura del Sistema

### Componentes

1. **viatio-app** (React Native + Expo)
   - Registra Expo Push Tokens en dispositivos físicos
   - Guarda tokens en Firestore: `users/{userId}.pushToken`
   - Muestra notificaciones in-app

2. **Cloud Functions** (Firebase)
   - **Triggers automáticos**:
     - `onExpenseCreated` → Nuevo gasto compartido
     - `onExpenseUpdated` → Gasto editado
     - `onExpenseDeleted` → Gasto eliminado
     - `onSettlementCreated/Updated` → Liquidaciones
   - **sendPushNotification** → Envía push via Expo SDK

3. **Firestore Collections**
   ```
   users/{userId}
   ├─ pushToken: "ExponentPushToken[xxx]"
   └─ pushTokenUpdatedAt: Timestamp

   notifications/{userId}/notifications/{notifId}
   ├─ type: "expense_added" | "expense_updated" | ...
   ├─ title: "💸 Nuevo gasto: Cena"
   ├─ body: "Juan pagó €50.00 en Viaje a Barcelona"
   ├─ data: { tripId, expenseId, ... }
   ├─ isRead: false
   ├─ createdAt: Timestamp
   ├─ expiresAt: Timestamp
   ├─ pushSent: true
   ├─ pushSentAt: Timestamp
   └─ pushTickets: [...]
   ```

---

## 🔍 Cómo Ver Notificaciones en Firebase

### 1. Ver notificaciones creadas (Firestore Console)

```bash
# Abrir Firebase Console
firebase open
```

1. Ve a **Firestore Database**
2. Navega a colección `notifications`
3. Subcarpetas por usuario: `notifications/{userId}/notifications/{notifId}`

**Campos importantes:**
- `pushSent: true` ✅ → Se envió correctamente
- `pushError` ❌ → Hubo un error
- `pushTickets` → Respuesta de Expo

### 2. Ver logs de Cloud Functions

```bash
cd functions
npm run logs

# O filtrar solo push notifications
firebase functions:log --only sendPushNotification

# Ver logs en tiempo real
firebase functions:log --follow
```

**Logs que deberías ver:**
```
[Push] Procesando notificación para user abc123...
[Push] Enviando push a token: ExponentPushToken[xxx]...
[Push] Tickets recibidos: [{ status: 'ok', id: '...' }]
[Push] ✅ Push notification enviada exitosamente

[Expenses] New expense created: exp123 in trip trip456
[Expenses] Created notification for user xyz789: expense_added
[Expenses] ✅ Notifications sent for new expense exp123
```

### 3. Verificar Cloud Functions desplegadas

```bash
firebase functions:list
```

**Deberías ver:**
- ✅ `sendPushNotification`
- ✅ `onExpenseCreated`
- ✅ `onExpenseUpdated`
- ✅ `onExpenseDeleted`
- ✅ `onSettlementCreated`
- ✅ `onSettlementUpdated`
- ✅ `onTripDeleted`
- ✅ `cleanupInactiveTokens`
- ✅ `cleanupExpiredNotifications`

---

## 📱 Cómo Probar en tu Dispositivo Físico

### ⚠️ Requisitos Previos

- ✅ **Dispositivo físico** Android/iOS (NO funciona en emuladores)
- ✅ App compilada con EAS o Expo Dev Client
- ✅ Cloud Functions desplegadas en Firebase
- ✅ Usuario autenticado en la app

### Opción 1: Prueba Automática (Crear Gasto)

Esta es la forma más real de probar:

1. **Prepara 2 dispositivos/usuarios:**
   - Dispositivo A: Tu usuario principal
   - Dispositivo B: Otro usuario o cuenta de prueba

2. **Crea un viaje compartido:**
   - Usuario A crea un viaje
   - Usuario A invita a Usuario B
   - Usuario B acepta invitación

3. **Usuario A crea un gasto compartido:**
   - Ve a la pantalla de gastos compartidos del viaje
   - Añade un gasto (ej: "Cena - €50")
   - Marca a Usuario B como participante

4. **Usuario B debería recibir notificación:**
   - Push notification en pantalla bloqueada/barra notificaciones
   - Título: "💸 Nuevo gasto: Cena"
   - Body: "Juan pagó €50.00 en Viaje a Barcelona"

5. **Verifica en Firebase Console:**
   - `notifications/{userId-B}/notifications/` → Debe aparecer nueva notificación
   - Campo `pushSent: true`
   - Revisa logs: `firebase functions:log`

### Opción 2: Prueba Manual (Script Node.js)

Si quieres enviar una notificación directamente sin crear gastos:

#### Paso 1: Descargar Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Guarda el archivo JSON como `functions/service-account.json`

⚠️ **IMPORTANTE**: Añade a `.gitignore`:
```bash
echo "functions/service-account.json" >> .gitignore
```

#### Paso 2: Obtener tu User ID

Opción A - Desde Firestore Console:
- Ve a colección `users`
- Busca tu email
- Copia el ID del documento (ej: `abc123xyz`)

Opción B - Desde logs de la app:
```typescript
// En cualquier pantalla, console.log(auth().currentUser?.uid)
```

#### Paso 3: Ejecutar script de prueba

```bash
cd functions

# Editar test-notification.js y reemplazar YOUR_USER_ID
# con tu userId real

# Ejecutar
node test-notification.js
```

**Salida esperada:**
```
🧪 Creando notificación de prueba para user: abc123

✅ Usuario encontrado
   pushToken: ExponentPushToken[xxxxxx]...

✅ Notificación creada en Firestore
   Path: notifications/abc123/notifications/xyz789

⏳ Esperando 5 segundos para que el trigger procese...

🎉 ¡ÉXITO! Push notification enviada
   pushSentAt: 2026-01-26T10:30:00
   tickets: [{ status: 'ok', id: '...' }]

📱 Revisa tu dispositivo, deberías ver la notificación
```

---

## 🐛 Troubleshooting

### ❌ "Usuario no tiene pushToken registrado"

**Causas:**
1. App corriendo en emulador (solo dispositivos físicos)
2. Usuario no abrió la app después de autenticarse
3. Permisos de notificaciones denegados

**Solución:**
1. Abre la app en dispositivo físico
2. Verifica logs: `[PushToken] Token registered successfully`
3. Chequea Firestore: `users/{userId}.pushToken` debe existir

### ❌ "Token inválido"

**Error:** `Push token xxx is not a valid Expo push token`

**Solución:**
1. Verifica que `app.config.js` tiene `extra.eas.projectId`
2. Recompila app con `eas build` o `npx expo prebuild && npx expo run:android`
3. Desinstala y reinstala app en dispositivo

### ❌ "DeviceNotRegistered"

**Error en pushTickets:** `{ status: 'error', message: 'DeviceNotRegistered' }`

**Causa:** App desinstalada o token expirado

**Solución:**
1. Reinstala app
2. Abre app para re-registrar token
3. Cloud Function `cleanupInactiveTokens` limpiará tokens inválidos automáticamente

### ❌ Notificación no llega al dispositivo

**Checklist:**
1. ✅ Dispositivo físico (no emulador)
2. ✅ Permisos de notificaciones aceptados
3. ✅ Internet activo en dispositivo
4. ✅ `pushSent: true` en Firestore
5. ✅ `pushTickets[0].status === 'ok'`
6. ✅ App en background (las notificaciones push se ven mejor cuando app está cerrada)

### ❌ Cloud Function no se ejecuta

**Verifica que está desplegada:**
```bash
firebase functions:list | grep sendPushNotification
```

**Re-desplegar:**
```bash
cd functions
npm run build
firebase deploy --only functions
```

**Ver logs en tiempo real:**
```bash
firebase functions:log --follow
```

---

## 📊 Monitorear Sistema de Notificaciones

### Firestore Queries útiles

```javascript
// En Firebase Console > Firestore > Query

// Ver todas las notificaciones de un usuario
notifications/{userId}/notifications
  .where('isRead', '==', false)
  .orderBy('createdAt', 'desc')

// Ver notificaciones no enviadas (errores)
notifications/{userId}/notifications
  .where('pushSent', '==', false)

// Ver notificaciones recientes
notifications/{userId}/notifications
  .orderBy('createdAt', 'desc')
  .limit(20)
```

### Métricas importantes

1. **Tasa de éxito:**
   - Notificaciones con `pushSent: true` vs total

2. **Errores comunes:**
   - `DeviceNotRegistered` → Limpiar tokens
   - `InvalidCredentials` → Revisar Service Account
   - `MessageTooBig` → Reducir data payload

3. **Rate limiting:**
   - Cloud Functions tienen rate limiting implementado
   - Ver `functions/src/utils/rateLimiter.ts`

---

## 🔧 Comandos Útiles

```bash
# Ver logs de todas las functions
firebase functions:log

# Ver logs solo de notificaciones
firebase functions:log --only sendPushNotification

# Ver logs en tiempo real
firebase functions:log --follow

# Desplegar solo functions (sin hosting/storage)
cd functions
npm run build
firebase deploy --only functions

# Listar functions desplegadas
firebase functions:list

# Borrar una function específica
firebase functions:delete functionName

# Ver uso/costo de functions
firebase open
# → Functions → Usage tab
```

---

## 🎯 Próximos Pasos

- [ ] Implementar panel de notificaciones in-app
- [ ] Añadir preferencias de notificaciones por tipo
- [ ] Deep linking desde notificaciones a pantallas específicas
- [ ] Rich notifications con imágenes
- [ ] Notificaciones programadas (recordatorios)

---

## 📚 Recursos

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)

---

**Última actualización:** 2026-01-26
