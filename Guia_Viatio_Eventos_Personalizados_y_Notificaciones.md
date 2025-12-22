# Guía Viatio - Eventos Personalizados en Agenda y Notificaciones Push

**Creado por:** Mikel C
**Fecha de creación:** 2 de diciembre de 2025
**Categoría:** Vive coding
**Última actualización:** 22 de diciembre de 2025

---

## TABLA DE CONTENIDOS

**PARTE 1: EVENTOS PERSONALIZADOS**
- [PRERREQUISITOS](#prerrequisitos)
- [VISIÓN GENERAL](#visión-general)
- [FASE A: Base de Datos](#fase-a-base-de-datos)
- [FASE B: Tipos y Constantes](#fase-b-tipos-y-constantes)
- [FASE C: Servicio de Eventos](#fase-c-servicio-de-eventos)
- [FASE D: Store de Eventos](#fase-d-store-de-eventos)
- [FASE E: Actualizar Servicio de Agenda](#fase-e-actualizar-servicio-de-agenda)
- [FASE F: Componentes de UI](#fase-f-componentes-de-ui)
- [FASE G: Pantalla de Añadir Evento](#fase-g-pantalla-de-añadir-evento)
- [FASE H: Actualizar TripAgendaScreen](#fase-h-actualizar-tripagendascreen)

**PARTE 2: NOTIFICACIONES PUSH**
- [FASE I: Setup de Notificaciones](#fase-i-setup-de-notificaciones)
- [FASE J: Tipos y Configuración](#fase-j-tipos-y-configuración)
- [FASE K: Servicio de Notificaciones](#fase-k-servicio-de-notificaciones)
- [FASE L: Actualizar Pantalla de Configuración](#fase-l-actualizar-pantalla-de-configuración)
- [FASE M: Integración con Viajes y Reservas](#fase-m-integración-con-viajes-y-reservas)

---

# PARTE 1: EVENTOS PERSONALIZADOS

---

# PRERREQUISITOS

Esta guía asume que ya tienes implementado:
- Sistema de viajes con días (diasViajeService)
- Pantalla de agenda (TripAgendaScreen) funcionando
- Sistema de reservas operativo
- agendaService que combina días con eventos

---

# VISIÓN GENERAL

## ¿Qué son los Eventos Personalizados?

Los eventos personalizados son actividades que el usuario planifica manualmente, independientes de reservas externas:
- "Paseo por el barrio judío"
- "Tiempo libre para compras"
- "Visita al museo del Prado"
- "Cena en restaurante local"
- "Descanso en el hotel"

## Diferencia con Reservas

| Reservas | Eventos Personalizados |
| --- | --- |
| Confirmación externa | Planificación interna |
| Código de reserva | Sin código |
| Proveedor/empresa | Sin proveedor |
| Precio/pago | Sin coste asociado |
| Estado de pago | Estado de completado |
| Datos específicos (vuelo, hotel) | Datos genéricos |

## Flujo de Usuario

```
Agenda del viaje
    │
    ├── Ver eventos existentes (reservas + personalizados mezclados)
    │
    └── FAB "+" → AddEventoScreen
                      │
                      ├── Seleccionar categoría
                      ├── Nombre del evento
                      ├── Día del viaje
                      ├── Hora inicio/fin
                      ├── Ubicación (opcional)
                      └── Guardar → Volver a agenda
```

---

# FASE A: Base de Datos

## A.1 Actualizar Schema

### Prompt A.1.1: Añadir tabla de eventos personalizados

```
Actualiza src/database/schema.ts:

Añade la nueva tabla después de las existentes:

-- Tabla de eventos personalizados
CREATE TABLE IF NOT EXISTS eventos_personalizados (
  id TEXT PRIMARY KEY NOT NULL,
  viaje_id TEXT NOT NULL,
  dia_id TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL DEFAULT 'other',
  hora_inicio TEXT,
  hora_fin TEXT,
  duracion_minutos INTEGER,
  ubicacion TEXT,
  direccion TEXT,
  latitud REAL,
  longitud REAL,
  notas TEXT,
  completado INTEGER NOT NULL DEFAULT 0,
  prioridad TEXT DEFAULT 'media',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
  FOREIGN KEY (dia_id) REFERENCES dias_viaje(id) ON DELETE SET NULL
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_eventos_viaje ON eventos_personalizados(viaje_id);
CREATE INDEX IF NOT EXISTS idx_eventos_dia ON eventos_personalizados(dia_id);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos_personalizados(categoria);

Añade a la versión de migración si usas migraciones.
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

---

# FASE B: Tipos y Constantes

## B.1 Crear Tipos de Evento

### Prompt B.1.1: Crear tipos para eventos personalizados

```
Crea src/types/evento.ts:

export type CategoriaEvento =
  | 'sightseeing'    // Turismo / Visitas
  | 'culture'        // Cultura / Museos
  | 'food'           // Comida / Restaurantes
  | 'shopping'       // Compras
  | 'entertainment'  // Entretenimiento
  | 'nature'         // Naturaleza / Parques
  | 'relaxation'     // Descanso / Spa
  | 'transport'      // Transporte / Traslados
  | 'nightlife'      // Vida nocturna
  | 'sports'         // Deportes / Actividades
  | 'other';         // Otros

export type PrioridadEvento = 'alta' | 'media' | 'baja';

export interface EventoPersonalizado {
  id: string;
  viajeId: string;
  diaId?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaEvento;
  horaInicio?: string; // Formato HH:MM
  horaFin?: string;    // Formato HH:MM
  duracionMinutos?: number;
  ubicacion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
  completado: boolean;
  prioridad: PrioridadEvento;
  createdAt: string;
  updatedAt: string;
}

// ... (continúa con interfaces y constantes del ejemplo)
```

---

# FASE C: Servicio de Eventos

(Contenido igual que en la guía original - eventosService.ts con CRUD completo)

---

# FASE D: Store de Eventos

(Contenido igual que en la guía original - eventosStore.ts con Zustand)

---

# FASE E: Actualizar Servicio de Agenda

(Contenido igual que en la guía original - agendaService.ts actualizado)

---

# FASE F: Componentes de UI

(Contenido igual que en la guía original - componentes EventoCategoriaSelector, TimePickerInput, AgendaEventoCard)

---

# FASE G: Pantalla de Añadir Evento

(Contenido igual que en la guía original - AddEventoScreen completa)

---

# FASE H: Actualizar TripAgendaScreen

(Contenido igual que en la guía original - integración con FAB y eventos)

---

# PARTE 2: NOTIFICACIONES PUSH

---

# FASE I: Setup de Notificaciones

## I.1 Instalar Dependencias

### Prompt I.1.1: Instalar expo-notifications

```bash
cd viatio-app
npm install expo-notifications
```

**✓ Verificación:**

```bash
# Verificar que expo-notifications está en package.json
cat package.json | grep expo-notifications
```

---

# FASE J: Tipos y Configuración

## J.1 Extender Preferencias de Notificaciones

### Prompt J.1.1: Actualizar tipos de perfil

```
Actualiza src/types/perfil.ts:

Añade después de las interfaces existentes:

// Tipos de antelación para notificaciones
export type TiempoAntelacion = 'disabled' | '1h' | '3h' | '1d' | '3d' | '1w';

export interface PreferenciasNotificaciones {
  recordatoriosViaje: boolean;
  actualizacionesReservas: boolean;
  alertasDocumentos: boolean;
  resumenSemanal: boolean;
  promociones: boolean;
  // Nuevos: Tiempos de antelación para diferentes tipos de avisos
  tiempoAvisoViaje: TiempoAntelacion; // Avisar X antes del inicio del viaje
  tiempoAvisoReserva: TiempoAntelacion; // Avisar X antes de cada reserva
}

// Actualizar defaults:
export const DEFAULT_PREFERENCIAS_NOTIFICACIONES: PreferenciasNotificaciones = {
  recordatoriosViaje: true,
  actualizacionesReservas: true,
  alertasDocumentos: true,
  resumenSemanal: false,
  promociones: false,
  tiempoAvisoViaje: '1d', // 1 día antes por defecto
  tiempoAvisoReserva: '3h', // 3 horas antes por defecto
};

// Configuración de opciones de tiempo de antelación
export const TIEMPOS_ANTELACION: Record<TiempoAntelacion, {
  label: string;
  descripcion: string;
  segundos: number | null; // null para 'disabled'
}> = {
  disabled: {
    label: 'Desactivado',
    descripcion: 'No recibir avisos',
    segundos: null,
  },
  '1h': {
    label: '1 hora antes',
    descripcion: 'Avisar 1 hora antes',
    segundos: 3600,
  },
  '3h': {
    label: '3 horas antes',
    descripcion: 'Avisar 3 horas antes',
    segundos: 10800,
  },
  '1d': {
    label: '1 día antes',
    descripcion: 'Avisar 1 día antes',
    segundos: 86400,
  },
  '3d': {
    label: '3 días antes',
    descripcion: 'Avisar 3 días antes',
    segundos: 259200,
  },
  '1w': {
    label: '1 semana antes',
    descripcion: 'Avisar 1 semana antes',
    segundos: 604800,
  },
};
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

---

# FASE K: Servicio de Notificaciones

## K.1 Crear Servicio Completo

### Prompt K.1.1: Crear notificationsService.ts

```
Crea src/services/notificationsService.ts con:

1. PERMISOS:
   - requestNotificationPermissions(): Solicitar permisos al usuario
   - hasNotificationPermissions(): Verificar si hay permisos activos

2. PROGRAMAR NOTIFICACIONES:
   - scheduleViajeNotification(viaje): Programa notificación para inicio de viaje
   - scheduleReservaNotification(reserva, viajeDestino): Programa notificación para reserva

3. CANCELAR NOTIFICACIONES:
   - cancelViajeNotifications(viajeId): Cancela todas las notificaciones de un viaje
   - cancelReservaNotifications(reservaId): Cancela todas las notificaciones de una reserva
   - cancelAllNotifications(): Cancela TODAS las notificaciones

4. GESTIÓN DE IDs:
   - saveNotificationId(): Guardar IDs en AsyncStorage
   - getNotificationIdsForEntity(): Obtener IDs de una entidad
   - removeNotificationIdsForEntity(): Eliminar IDs de una entidad

Características clave:
- Configuración de canal de notificaciones en Android
- Verificación de preferencias de usuario antes de programar
- Cálculo de fecha/hora según tiempo de antelación configurado
- No programar si la fecha ya pasó
- Emojis personalizados según tipo (🌍 viajes, ✈️ transporte, 🏨 alojamiento, etc.)
- Datos incluidos en la notificación para navegación (type, id, viajeId)
- Operaciones no bloqueantes (catch errors)
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

**Ejemplo de uso:**

```typescript
// Al crear un viaje
const viaje = await createViaje(input, userId);
await scheduleViajeNotification(viaje);

// Al crear una reserva
const reserva = await createReserva(input);
const viaje = await getViajeById(reserva.viajeId);
await scheduleReservaNotification(reserva, viaje?.destino);

// Al eliminar un viaje
await cancelViajeNotifications(viajeId);
```

---

# FASE L: Actualizar Pantalla de Configuración

## L.1 Actualizar NotificationsSettingsScreen

### Prompt L.1.1: Añadir selectores de tiempo

```
Actualiza src/screens/NotificationsSettingsScreen.tsx:

1. Añadir imports:
   - TIEMPOS_ANTELACION, TiempoAntelacion de '@/types/perfil'
   - SelectItem de '@/components/SelectItem'
   - requestNotificationPermissions, hasNotificationPermissions de '@/services/notificationsService'

2. Añadir estado para permisos:
   const [permissionsGranted, setPermissionsGranted] = useState(false);

3. Verificar permisos al montar:
   useEffect(() => {
     checkPermissions();
   }, []);

4. Añadir banner de permisos si no están activos:
   {!permissionsGranted && (
     <Card style={styles.warningCard}>
       <View style={styles.warningContent}>
         <Text style={styles.warningEmoji}>⚠️</Text>
         <View style={styles.warningTextContainer}>
           <Text style={styles.warningTitle}>Permisos necesarios</Text>
           <Text style={styles.warningDescription}>
             Activa los permisos de notificaciones para recibir recordatorios
           </Text>
         </View>
       </View>
       <Pressable style={styles.permissionButton} onPress={handleRequestPermissions}>
         <Text style={styles.permissionButtonText}>Activar permisos</Text>
       </Pressable>
     </Card>
   )}

5. Añadir selectores de tiempo después de cada switch:

   {/* Switch recordatorios de viaje */}
   <SwitchItem
     label="Recordatorios de viaje"
     value={preferencias.recordatoriosViaje}
     onValueChange={(value) => updatePreferencia('recordatoriosViaje', value)}
     disabled={loading || !permissionsGranted}
   />

   {/* Selector de tiempo SI está activado */}
   {preferencias.recordatoriosViaje && (
     <SelectItem
       label="Avisar con antelación"
       value={preferencias.tiempoAvisoViaje}
       options={Object.entries(TIEMPOS_ANTELACION).map(([key, config]) => ({
         value: key,
         label: config.label,
       }))}
       onSelect={(value) => updatePreferencia('tiempoAvisoViaje', value as TiempoAntelacion)}
       icon="time-outline"
     />
   )}

   {/* Lo mismo para actualizacionesReservas con tiempoAvisoReserva */}

6. Deshabilitar todos los switches si no hay permisos:
   disabled={loading || !permissionsGranted}
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

**✓ Probar en la app:**
1. Ir a Configuración → Notificaciones
2. Si no hay permisos, debe aparecer el banner amarillo
3. Activar permisos
4. Activar "Recordatorios de viaje"
5. Debe aparecer el selector "Avisar con antelación"
6. Seleccionar "1 día antes", "3 horas antes", etc.
7. La configuración se guarda automáticamente

---

# FASE M: Integración con Viajes y Reservas

## M.1 Integrar con viajesService

### Prompt M.1.1: Añadir notificaciones a operaciones de viajes

```
Actualiza src/services/viajesService.ts:

1. Añadir imports:
   import {
     scheduleViajeNotification,
     cancelViajeNotifications,
   } from './notificationsService';

2. En createViaje(), después de crear los días:
   // Programar notificación del viaje (no bloqueante)
   scheduleViajeNotification(viaje).catch((error) => {
     console.warn('[ViajesService] Error al programar notificación:', error);
     // No lanzamos el error para no bloquear la creación del viaje
   });

3. En updateViaje(), antes del return:
   // Reprogramar notificación si cambió la fecha o destino
   if (input.fechaInicio !== undefined || input.destino !== undefined) {
     const viajeActualizado = await getViajeById(id);
     if (viajeActualizado) {
       scheduleViajeNotification(viajeActualizado).catch((error) => {
         console.warn('[ViajesService] Error al reprogramar notificación:', error);
       });
     }
   }

4. En deleteViaje(), al inicio (después de verificar que existe):
   // Cancelar notificaciones del viaje
   await cancelViajeNotifications(id).catch((error) => {
     console.warn('[ViajesService] Error al cancelar notificaciones:', error);
   });
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

---

## M.2 Integrar con reservasService

### Prompt M.2.1: Añadir notificaciones a operaciones de reservas

```
Actualiza src/services/reservasService.ts:

1. Añadir imports:
   import { getViajeById } from './viajesService';
   import {
     scheduleReservaNotification,
     cancelReservaNotifications,
   } from './notificationsService';

2. En createReserva(), antes del return:
   // Programar notificación de la reserva (no bloqueante)
   try {
     const viaje = await getViajeById(reserva.viajeId);
     scheduleReservaNotification(reserva, viaje?.destino).catch((error) => {
       console.warn('[ReservasService] Error al programar notificación:', error);
     });
   } catch (error) {
     console.warn('[ReservasService] Error al obtener viaje para notificación:', error);
   }

3. En updateReserva(), antes del return:
   // Reprogramar notificación si cambió la fecha/hora
   if (input.fechaInicio !== undefined || input.horaInicio !== undefined) {
     try {
       const reservaActualizada = await getReservaById(id);
       if (reservaActualizada) {
         const viaje = await getViajeById(reservaActualizada.viajeId);
         scheduleReservaNotification(reservaActualizada, viaje?.destino).catch((error) => {
           console.warn('[ReservasService] Error al reprogramar notificación:', error);
         });
       }
     } catch (error) {
       console.warn('[ReservasService] Error al reprogramar notificación:', error);
     }
   }

4. En deleteReserva(), al inicio:
   // Cancelar notificaciones de la reserva
   await cancelReservaNotifications(id).catch((error) => {
     console.warn('[ReservasService] Error al cancelar notificaciones:', error);
   });
```

**✓ Verificación:**

```bash
npx tsc --noEmit
```

---

# RESUMEN DE IMPLEMENTACIÓN

## Funcionalidades Implementadas

### Sistema de Notificaciones Push

#### 1. Tipos y Configuración
- Tipos de tiempo de antelación: disabled, 1h, 3h, 1d, 3d, 1w
- Configuración separada para viajes y reservas
- Preferencias persistentes en AsyncStorage

#### 2. Servicio de Notificaciones
- **Permisos:** Solicitud y verificación de permisos nativos
- **Programación:** Notificaciones locales programadas con fecha/hora exacta
- **Cancelación:** Sistema para cancelar notificaciones por entidad
- **Gestión de IDs:** Almacenamiento de IDs en AsyncStorage para cancelación posterior
- **Canal Android:** Configuración de canal "viajes" con prioridad alta

#### 3. Pantalla de Configuración
- Banner de permisos si no están activos
- Selectores de tiempo condicionales (solo si el switch está ON)
- Todas las opciones deshabilitadas sin permisos
- Guardado automático al cambiar opciones

#### 4. Integración Automática
- Viajes: Notificación programada al crear/actualizar
- Reservas: Notificación programada al crear/actualizar
- Eliminación: Cancelación automática de notificaciones

## Estructura de Archivos

```
viatio-app/src/
├── types/
│   └── perfil.ts (modificado - TiempoAntelacion, TIEMPOS_ANTELACION)
├── services/
│   ├── notificationsService.ts (nuevo)
│   ├── viajesService.ts (modificado)
│   └── reservasService.ts (modificado)
├── screens/
│   └── NotificationsSettingsScreen.tsx (modificado)
└── components/
    └── SelectItem.tsx (ya existente, usado para selección)
```

## Dependencias Adicionales

```bash
npm install expo-notifications
```

## Flujo de Usuario Completo

### 1. Configuración Inicial

```
Usuario abre Configuración → Notificaciones
  │
  ├── Sin permisos? → Banner amarillo → "Activar permisos" → Popup del sistema
  │                                                                 │
  │                                                                 ├── Permitir → Permisos activos
  │                                                                 └── Denegar → Banner permanece
  │
  └── Con permisos → Opciones habilitadas
                      │
                      ├── Activar "Recordatorios de viaje"
                      │   └── Selector "Avisar con antelación" aparece
                      │       └── Seleccionar: 1 día antes (por defecto)
                      │
                      └── Activar "Actualizaciones de reservas"
                          └── Selector "Avisar con antelación" aparece
                              └── Seleccionar: 3 horas antes (por defecto)
```

### 2. Creación de Viaje

```
Usuario crea viaje "París" del 15 al 20 de enero
  │
  ├── viajesService.createViaje() ejecuta
  │   ├── Viaje guardado en BD
  │   ├── Días creados automáticamente
  │   └── scheduleViajeNotification(viaje) ejecuta
  │
  └── notificationsService.scheduleViajeNotification()
      ├── Verifica permisos → ✓
      ├── Lee preferencias → recordatoriosViaje: true, tiempoAvisoViaje: '1d'
      ├── Calcula fecha notificación: 14 de enero a las 00:00
      ├── Programa notificación: "🌍 ¡Tu viaje a París se acerca!"
      └── Guarda notification ID en AsyncStorage
```

### 3. Creación de Reserva

```
Usuario añade reserva de vuelo para el 15 de enero a las 10:00
  │
  ├── reservasService.createReserva() ejecuta
  │   ├── Reserva guardada en BD
  │   ├── Obtiene viaje (destino: "París")
  │   └── scheduleReservaNotification(reserva, "París") ejecuta
  │
  └── notificationsService.scheduleReservaNotification()
      ├── Verifica permisos → ✓
      ├── Lee preferencias → actualizacionesReservas: true, tiempoAvisoReserva: '3h'
      ├── Calcula fecha notificación: 15 de enero a las 07:00
      ├── Programa notificación: "✈️ Reserva próxima: Vuelo a París"
      └── Guarda notification ID en AsyncStorage
```

### 4. Recepción de Notificación

```
15 de enero, 07:00 → Notificación local aparece
  │
  ├── Android: Banner en pantalla de bloqueo + sonido + vibración
  ├── iOS: Banner + sonido
  │
  └── Usuario toca la notificación
      └── App abre (navegación automática puede implementarse)
```

### 5. Edición/Eliminación

```
Usuario edita fecha del viaje
  │
  └── updateViaje() ejecuta
      ├── Viaje actualizado en BD
      ├── scheduleViajeNotification(viajeActualizado) ejecuta
      │   ├── Cancela notificación anterior
      │   └── Programa nueva notificación con nueva fecha
      └── Notification IDs actualizados en AsyncStorage

Usuario elimina reserva
  │
  └── deleteReserva() ejecuta
      ├── cancelReservaNotifications(id) ejecuta
      │   ├── Obtiene notification IDs de AsyncStorage
      │   ├── Cancela notificaciones programadas
      │   └── Elimina IDs de AsyncStorage
      └── Reserva eliminada de BD
```

## Características Técnicas

### 1. Canales de Notificación (Android)

```typescript
await Notifications.setNotificationChannelAsync('viajes', {
  name: 'Viajes y Reservas',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250],
  enableVibrate: true,
  enableLights: true,
  lightColor: '#0066CC',
});
```

### 2. Formato de Notificación

```typescript
{
  title: "🌍 ¡Tu viaje a París se acerca!",
  body: "Tu viaje comienza el 15 de enero de 2025. ¡No olvides revisar tu agenda!",
  sound: 'default',
  priority: Notifications.AndroidNotificationPriority.HIGH,
  data: {
    type: 'viaje',
    id: 'viaje-123',
    viajeId: 'viaje-123',
  },
}
```

### 3. Cálculo de Fecha de Notificación

```typescript
// Ejemplo: Viaje el 15 de enero a las 10:00, avisar 1 día antes
const fechaInicio = new Date('2025-01-15T10:00:00');
const segundosAntelacion = TIEMPOS_ANTELACION['1d'].segundos; // 86400
const fechaNotificacion = new Date(fechaInicio.getTime() - segundosAntelacion * 1000);
// Resultado: 14 de enero a las 10:00
```

### 4. Almacenamiento de IDs

```typescript
// Estructura en AsyncStorage
{
  "@viatio:notification_ids": [
    {
      notificationId: "notif-abc-123",
      entityType: "viaje",
      entityId: "viaje-123"
    },
    {
      notificationId: "notif-def-456",
      entityType: "reserva",
      entityId: "reserva-456"
    }
  ]
}
```

## Casos Edge Manejados

1. **Fecha ya pasada:** No se programa la notificación
2. **Sin fecha/hora:** No se programa la notificación (reservas)
3. **Permisos denegados:** No se programa, pero no falla la operación
4. **Preferencia desactivada:** No se programa
5. **Tiempo disabled:** No se programa
6. **Error al programar:** Se captura y registra, no bloquea la operación
7. **App cerrada:** Notificación aparece igualmente (notificación local)

## Testing y Verificación

### 1. Verificar Permisos

```typescript
const hasPerms = await hasNotificationPermissions();
console.log('Permisos:', hasPerms);
```

### 2. Ver Notificaciones Programadas

```typescript
const notifications = await getAllScheduledNotifications();
console.log(`Total: ${notifications.length}`);
notifications.forEach(n => {
  console.log(`- ${n.content.title} (trigger: ${n.trigger})`);
});
```

### 3. Probar Notificación Inmediata (Debug)

```typescript
// En notificationsService.ts, cambiar:
const fechaNotificacion = new Date(Date.now() + 10000); // 10 segundos
```

### 4. Cancelar Todas (Cleanup)

```typescript
await cancelAllNotifications();
```

## Próximas Extensiones

1. **Navegación desde notificación:** Al tocar notificación, abrir pantalla específica
2. **Notificaciones de eventos personalizados:** Cuando se implementen
3. **Notificaciones de documentos próximos a expirar**
4. **Notificaciones de presupuesto excedido**
5. **Resumen diario del viaje en curso**
6. **Notificación el día del check-in de hotel**

---

# CHECKLIST FINAL COMPLETO

## Eventos Personalizados
- [ ] Tabla eventos_personalizados creada
- [ ] Tipos y categorías definidos
- [ ] eventosService con CRUD completo
- [ ] eventosStore con Zustand
- [ ] EventoCategoriaSelector funciona
- [ ] TimePickerInput funciona en iOS y Android
- [ ] AgendaEventoCard muestra eventos correctamente
- [ ] AddEventoScreen permite crear eventos
- [ ] EventoDetailScreen muestra detalles
- [ ] TripAgendaScreen tiene FAB
- [ ] Eventos y reservas se mezclan ordenados por hora
- [ ] Toggle completado funciona
- [ ] Navegación completa configurada
- [ ] Sin errores de TypeScript
- [ ] Probado en dispositivo/simulador

## Notificaciones Push
- [ ] expo-notifications instalado
- [ ] Tipos de tiempo de antelación definidos
- [ ] TIEMPOS_ANTELACION configurado
- [ ] notificationsService creado con todas las funciones
- [ ] Canal de notificaciones Android configurado
- [ ] NotificationsSettingsScreen actualizada
- [ ] Banner de permisos funciona
- [ ] Selectores de tiempo aparecen condicionalmente
- [ ] viajesService integrado (create, update, delete)
- [ ] reservasService integrado (create, update, delete)
- [ ] Notificaciones se programan al crear viajes
- [ ] Notificaciones se programan al crear reservas
- [ ] Notificaciones se cancelan al eliminar
- [ ] Sin errores de TypeScript
- [ ] Permisos se solicitan correctamente
- [ ] Notificaciones aparecen en el tiempo correcto
- [ ] IDs se guardan en AsyncStorage
- [ ] Probado en dispositivo real (simulador tiene limitaciones)

---

**¡Implementación completa!** 🎉

Esta guía cubre tanto el sistema de eventos personalizados como el sistema completo de notificaciones push para Viatio. Ambos sistemas están totalmente integrados y funcionando de forma automática y transparente para el usuario.
