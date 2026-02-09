# 🔔 Notificaciones para Reservas y Eventos Personalizados

## ✅ Implementación Completada

He extendido el sistema de notificaciones Cloud Functions para enviar recordatorios automáticos de **reservas** y **eventos personalizados** según las preferencias del usuario.

---

## 📋 **Nuevas Cloud Functions**

### **1. Reservas** ([functions/src/reservations.ts](../functions/src/reservations.ts))

#### **Triggers**:
- ✅ `onReservationCreated` - Notifica cuando se crea una reserva en viaje compartido
- ✅ `onReservationUpdated` - Notifica cuando se modifica una reserva
- ✅ `checkUpcomingReservations` - Scheduler (cada 1 hora) que verifica recordatorios programados

#### **Lógica**:
1. Cuando se crea/actualiza una reserva:
   - Notifica inmediatamente a todos los miembros del viaje (excepto al creador)
   - Programa un recordatorio basado en `tiempoAvisoReserva` del usuario
2. El scheduler revisa cada hora:
   - Busca recordatorios programados que deban enviarse
   - Envía notificación push al usuario
   - Marca el recordatorio como enviado

#### **Preferencias**:
- `actualizacionesReservas` (bool) - Activar/desactivar notificaciones de reservas
- `tiempoAvisoReserva` - Cuándo enviar recordatorio:
  - `'disabled'` - No enviar recordatorios
  - `'1h'` - 1 hora antes
  - `'3h'` - 3 horas antes
  - `'1d'` - 1 día antes (por defecto)
  - `'3d'` - 3 días antes
  - `'1w'` - 1 semana antes

---

### **2. Eventos Personalizados** ([functions/src/events.ts](../functions/src/events.ts))

#### **Triggers**:
- ✅ `onEventCreated` - Notifica cuando se crea un evento en viaje compartido
- ✅ `onEventUpdated` - Notifica cuando se modifica un evento
- ✅ `checkUpcomingEvents` - Scheduler (cada 1 hora) que verifica recordatorios programados

#### **Lógica**:
1. Cuando se crea/actualiza un evento:
   - Notifica inmediatamente a todos los miembros del viaje (excepto al creador)
   - **Solo programa recordatorio** para eventos de **prioridad alta o media**
   - Usa el emoji de prioridad en el título: 🔴 (alta), 🟡 (media), 🟢 (baja)
2. El scheduler revisa cada hora:
   - Busca recordatorios programados que deban enviarse
   - Envía notificación push al usuario
   - Marca el recordatorio como enviado

#### **Preferencias**:
- `recordatoriosViaje` (bool) - Activar/desactivar notificaciones de eventos
- `tiempoAvisoViaje` - Cuándo enviar recordatorio:
  - `'disabled'` - No enviar recordatorios
  - `'1h'` - 1 hora antes
  - `'3h'` - 3 horas antes
  - `'1d'` - 1 día antes (por defecto)
  - `'3d'` - 3 días antes
  - `'1w'` - 1 semana antes

---

## 🛠️ **Utilidades Creadas**

### **1. Preferencias** ([functions/src/utils/preferences.ts](../functions/src/utils/preferences.ts))

```typescript
// Obtener preferencias de notificaciones del usuario
getUserNotificationPreferences(userId: string): Promise<UserPreferences>

// Verificar si usuario está en periodo de silencio
isInSilentPeriod(prefs: UserPreferences): boolean

// Verificar si un tipo de notificación debe enviarse
shouldSendNotificationType(prefs: UserPreferences, notificationType: string): boolean
```

**Características**:
- Lee preferencias desde `users/{userId}/settings/notifications`
- Respeta `horarioSilencio` (ej: 22:00 - 08:00)
- Respeta `modoSilencio`:
  - `'off'` - Todas las notificaciones activas
  - `'urgent_only'` - Solo recordatorios urgentes
  - `'all'` - Bloquear todas las notificaciones

### **2. Programación** ([functions/src/utils/scheduling.ts](../functions/src/utils/scheduling.ts))

```typescript
// Calcular cuándo enviar notificación
calculateNotificationTime(
  fecha: string,      // YYYY-MM-DD
  hora: string | undefined, // HH:MM
  tiempoAviso: string // '1h', '3h', '1d', '3d', '1w'
): Date | null

// Verificar si notificación debe enviarse (no está en el pasado)
shouldSendNotification(notificationTime: Date): boolean

// Formatear fecha para mostrar en notificación
formatEventDateTime(fecha: string, hora?: string): string
```

**Lógica**:
- Si el evento tiene hora: usa la hora exacta
- Si NO tiene hora: usa 09:00 por defecto
- Resta el tiempo de aviso para calcular cuándo enviar
- Valida que no esté en el pasado (margen de 5 minutos)

---

## 📊 **Estructura de Datos**

### **Notificaciones Programadas** (Firestore)

Colección: `scheduledNotifications`

```typescript
{
  userId: string;
  type: 'reservation_reminder' | 'event_reminder';
  scheduledFor: Timestamp; // Cuándo enviar
  sent: boolean; // Si ya se envió
  title: string;
  body: string;
  data: {
    tripId: string;
    reservationId?: string;
    eventId?: string;
    dayId?: string;
    type: string;
  };
  createdAt: Timestamp;
  sentAt?: Timestamp; // Cuándo se envió
}
```

### **Preferencias de Usuario** (Firestore)

Ruta: `users/{userId}/settings/notifications`

```typescript
{
  notificacionesActivas: boolean;
  recordatoriosViaje: boolean;
  tiempoAvisoViaje: '1h' | '3h' | '1d' | '3d' | '1w' | 'disabled';
  actualizacionesReservas: boolean;
  tiempoAvisoReserva: '1h' | '3h' | '1d' | '3d' | '1w' | 'disabled';
  modoSilencio: 'off' | 'urgent_only' | 'all';
  horarioSilencio: {
    activo: boolean;
    inicio: string; // "22:00"
    fin: string;    // "08:00"
  };
  gastosCompartidos: {
    nuevoGasto: boolean;
    gastoEditado: boolean;
    gastoEliminado: boolean;
    liquidacionSolicitada: boolean;
    liquidacionCompletada: boolean;
  };
}
```

---

## 🚀 **Cómo Funciona (Ejemplo)**

### **Escenario: Reserva de vuelo**

1. **Usuario A crea reserva**:
   - Vuelo: "Barcelona → Madrid"
   - Fecha: 2026-02-15
   - Hora: 10:30

2. **Notificación inmediata** (todos los miembros excepto A):
   ```
   📅 Nueva reserva: Barcelona → Madrid
   Iberia • Viaje a Madrid
   ```

3. **Sistema programa recordatorio**:
   - Usuario B tiene `tiempoAvisoReserva: '3h'`
   - Calcula: 2026-02-15 10:30 - 3h = 2026-02-15 07:30
   - Guarda en `scheduledNotifications`:
     ```json
     {
       "userId": "user-b-id",
       "type": "reservation_reminder",
       "scheduledFor": "2026-02-15T07:30:00Z",
       "sent": false,
       "title": "🔔 Recordatorio: Barcelona → Madrid",
       "body": "Tu reserva es en 3 horas • Terminal 1"
     }
     ```

4. **Scheduler ejecuta cada hora**:
   - A las 07:00 → no envía (aún no llega la hora)
   - A las 08:00 → ✅ **ENVÍA notificación** (07:30 ya pasó)
   - Marca `sent: true` y `sentAt: Timestamp`

5. **Usuario B recibe**:
   ```
   🔔 Recordatorio: Barcelona → Madrid
   Tu reserva es en 3 horas • Terminal 1
   ```

---

## 📱 **Tipos de Notificaciones**

| Tipo | Emoji | Cuándo se envía | Configurable con |
|------|-------|-----------------|------------------|
| `reservation_added` | 📅 | Al crear reserva | `actualizacionesReservas` |
| `reservation_updated` | ✏️ | Al modificar reserva | `actualizacionesReservas` |
| `reservation_reminder` | 🔔 | Antes de la reserva | `tiempoAvisoReserva` |
| `event_added` | 🔴🟡🟢 | Al crear evento | `recordatoriosViaje` |
| `event_updated` | 🔴🟡🟢 | Al modificar evento | `recordatoriosViaje` |
| `event_reminder` | 🔴🟡🟢 | Antes del evento | `tiempoAvisoViaje` |

---

## 🔧 **Desplegar Cloud Functions**

```bash
cd functions

# Compilar
npm run build

# Desplegar
firebase deploy --only functions
```

**Funciones desplegadas**:
- ✅ `onReservationCreated`
- ✅ `onReservationUpdated`
- ✅ `checkUpcomingReservations` (scheduler: every 1 hour)
- ✅ `onEventCreated`
- ✅ `onEventUpdated`
- ✅ `checkUpcomingEvents` (scheduler: every 1 hour)

---

## 🧪 **Cómo Probar**

### **1. Probar notificación inmediata (al crear)**

En la app móvil:
1. Ve a un viaje compartido
2. Crea una nueva reserva o evento
3. Los otros miembros deberían recibir notificación push inmediata

### **2. Probar recordatorio programado**

Opción A - **Tiempo de prueba corto**:
1. Configura `tiempoAvisoReserva: '1h'` en Firestore
2. Crea una reserva para dentro de 2 horas
3. Espera 1 hora
4. El scheduler debería enviar el recordatorio

Opción B - **Forzar envío manual** (para testing rápido):

```bash
# En Firebase Console → Firestore → scheduledNotifications
# Crear documento manualmente:
{
  userId: "tu-user-id",
  type: "reservation_reminder",
  scheduledFor: <Timestamp de hace 5 minutos>,
  sent: false,
  title: "🔔 Test",
  body: "Recordatorio de prueba",
  data: {
    tripId: "trip-id",
    reservationId: "reservation-id",
    type: "reservation_reminder"
  }
}

# Esperar hasta la próxima hora en punto
# El scheduler debería detectarlo y enviarlo
```

### **3. Verificar en logs**

```bash
firebase functions:log --follow
```

Deberías ver:
```
[Reservations] Scheduled reminder for res123 at 2026-02-15T07:30:00Z
[Reservations] Checking upcoming reservations...
[Reservations] ✅ Sent reminder for reservation res123
[Push] ✅ Push notification enviada exitosamente
```

---

## 📚 **Archivos Creados/Modificados**

### **Nuevos archivos**:
- ✅ [functions/src/reservations.ts](../functions/src/reservations.ts) - Notificaciones de reservas
- ✅ [functions/src/events.ts](../functions/src/events.ts) - Notificaciones de eventos
- ✅ [functions/src/utils/preferences.ts](../functions/src/utils/preferences.ts) - Utilidades de preferencias
- ✅ [functions/src/utils/scheduling.ts](../functions/src/utils/scheduling.ts) - Utilidades de programación

### **Modificados**:
- ✅ [functions/src/index.ts](../functions/src/index.ts) - Exportar nuevas funciones

---

## 🎯 **Próximos Pasos**

1. ✅ **Desplegar funciones** → `firebase deploy --only functions`
2. ✅ **Probar con reservas reales** en la app
3. ✅ **Verificar logs** para confirmar que los schedulers funcionan
4. 🔄 **Implementar deep linking** para que las notificaciones abran directamente la reserva/evento
5. 🔄 **Añadir notificaciones de documentos** (vencimiento de pasaporte, visas, etc.)
6. 🔄 **Añadir alertas de presupuesto** cuando se alcanza el umbral configurado

---

## 📊 **Comparación con Sistema Anterior**

| Característica | Antes | Ahora |
|----------------|-------|-------|
| Gastos compartidos | ✅ | ✅ |
| Liquidaciones | ✅ | ✅ |
| Reservas | ❌ | ✅ **NUEVO** |
| Eventos personalizados | ❌ | ✅ **NUEVO** |
| Recordatorios programados | ❌ | ✅ **NUEVO** |
| Respeta preferencias | Parcial | ✅ **MEJORADO** |
| Periodo de silencio | ❌ | ✅ **NUEVO** |
| Notificaciones urgentes | ❌ | ✅ **NUEVO** |
| Rate limiting | ✅ | ✅ |

---

**Última actualización:** 2026-01-26
