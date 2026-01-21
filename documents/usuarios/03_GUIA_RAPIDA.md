# Guía rápida — Cómo empezar con Viatio en 10 pasos

Esta guía te lleva desde la instalación hasta tu primer viaje organizado en **menos de 15 minutos**.

---

## Antes de empezar — ¿Qué necesitas?

- 📱 **Dispositivo**: iPhone (iOS 14+) o Android (8.0+)
- 📧 **Cuenta**: email válido o cuenta de Google
- 🌐 **Internet**: solo para crear cuenta y sincronizar (después funciona offline)
- ⏱️ **Tiempo**: 10–15 minutos para setup inicial

---

## Paso 1: Descarga e instala la app

### iOS (App Store)
1. Abre **App Store**
2. Busca "Viatio"
3. Toca **Obtener** → **Instalar**
4. Abre la app

### Android (Play Store)
1. Abre **Play Store**
2. Busca "Viatio"
3. Toca **Instalar**
4. Abre la app

> **Nota**: Si la app aún no está en las tiendas (beta cerrada), recibirás un enlace de TestFlight (iOS) o APK (Android) por email.

---

## Paso 2: Crea tu cuenta

Al abrir la app por primera vez, verás la pantalla de bienvenida.

### Opción A: Registro con email
1. Toca **Crear cuenta**
2. Introduce tu **email** y **contraseña** (mínimo 8 caracteres)
3. Toca **Registrarse**
4. **Verifica tu email**: revisa tu bandeja de entrada y toca el enlace de confirmación
5. Vuelve a la app e inicia sesión

### Opción B: Registro con Google (más rápido)
1. Toca **Continuar con Google**
2. Selecciona tu cuenta de Google
3. Autoriza el acceso
4. ¡Listo! Ya estás dentro

**Referencia verificada**: `viatio-app/src/screens/RegisterScreen.tsx`, `LoginScreen.tsx`

---

## Paso 3: Completa tu perfil (opcional pero recomendado)

1. Ve a **Perfil** (icono inferior derecho)
2. Toca **Editar perfil**
3. Añade:
   - **Nombre completo** (para que otros te reconozcan en viajes compartidos)
   - **Foto de perfil** (opcional)
   - **Divisa preferida** (para conversión automática de gastos)
4. Toca **Guardar**

**Referencia verificada**: `viatio-app/src/screens/EditProfileScreen.tsx`

---

## Paso 4: Crea tu primer viaje

1. En la pantalla principal, toca el botón **+** (grande, abajo a la derecha)
2. Selecciona **Crear viaje**
3. Completa los datos básicos:
   - **Nombre del viaje**: ej. "Vacaciones Bali 2026"
   - **Destino**: ej. "Bali, Indonesia"
   - **Fechas**: fecha de inicio y fin
   - **Presupuesto** (opcional): ej. "2500 EUR"
   - **Descripción** (opcional): ej. "Viaje de relax con María"
4. Toca **Crear**

**Resultado**: Ya tienes tu primer viaje creado. Ahora verás la pantalla de detalle del viaje con 5 pestañas:
- **Agenda**: itinerario día a día
- **Reservas**: vuelos, hoteles, actividades
- **Documentos**: billetes, confirmaciones
- **Gastos**: control de presupuesto
- **Mapa**: lugares y rutas

**Referencia verificada**: `viatio-app/src/screens/CreateTripScreen.tsx`, `TripDetailScreen.tsx`

---

## Paso 5: Añade tu primera reserva

Tienes **2 opciones**: manual o inteligente (escaneo con IA).

### Opción A: Añadir reserva manualmente
1. Ve a la pestaña **Reservas**
2. Toca **+ Añadir reserva**
3. Selecciona el **tipo**: vuelo, hotel, restaurante, actividad o transporte
4. Completa los datos:
   - **Nombre**: ej. "Vuelo Madrid → Denpasar"
   - **Fecha y hora**: ej. "15/06/2026 10:30"
   - **Número de confirmación** (opcional): ej. "AB123XY"
   - **Notas** (opcional): ej. "Asiento 12A"
5. Toca **Guardar**

### Opción B: Escanear reserva con IA (recomendado)
1. Ve a la pestaña **Reservas**
2. Toca **+ Añadir reserva**
3. Toca el icono de **cámara** o **Escanear**
4. **Haz una foto** de tu confirmación (email, captura, PDF) o selecciona desde galería
5. Espera **5–10 segundos** mientras Viatio extrae los datos automáticamente
6. **Revisa y confirma** los datos extraídos
7. Toca **Guardar**

**Ejemplo de datos extraídos automáticamente**:
- Tipo: Vuelo
- Aerolínea: Iberia
- Número de vuelo: IB3742
- Origen: Madrid (MAD)
- Destino: Denpasar (DPS)
- Fecha: 15/06/2026
- Hora: 10:30
- Número de confirmación: AB123XY

**Referencia verificada**: `viatio-app/src/screens/AddReservationScreen.tsx`, `ScanReservationScreen.tsx`, backend `/api/extract-reserva`

---

## Paso 6: Sube un documento importante

1. Ve a la pestaña **Documentos**
2. Toca **+ Añadir documento**
3. Selecciona **origen**:
   - **Cámara**: haz una foto (ej: pasaporte, seguro)
   - **Galería**: selecciona archivo existente
   - **Archivos**: PDF, imagen, documento (máximo 10MB)
4. Añade un **nombre**: ej. "Seguro de viaje Bali"
5. Selecciona **categoría** (opcional): seguro, billete, confirmación, visa, otros
6. Toca **Guardar**

**Resultado**: El documento queda almacenado en tu dispositivo (offline). Si compartes el viaje, se sincroniza automáticamente en Firebase Storage.

**Referencia verificada**: `viatio-app/src/screens/AddDocumentScreen.tsx`, `TripDocumentsScreen.tsx`

---

## Paso 7: Registra tu primer gasto

1. Ve a la pestaña **Gastos**
2. Toca **+ Añadir gasto**
3. Completa:
   - **Descripción**: ej. "Vuelo Madrid → Bali"
   - **Monto**: ej. "450"
   - **Divisa**: ej. "EUR" (selecciona de la lista)
   - **Categoría**: transporte, alojamiento, comida, actividades, otros
   - **Fecha**: por defecto hoy (puedes cambiarla)
   - **Quién pagó**: tú (por defecto)
   - **Vincular a reserva** (opcional): selecciona la reserva correspondiente
4. Toca **Guardar**

**Resultado**: El gasto se registra y se suma al total. Si configuraste presupuesto, verás el progreso:
- Gastado: €450 / €2.500 (18%)

**Si es viaje compartido**, puedes dividir el gasto entre personas (ver Paso 9).

**Referencia verificada**: `viatio-app/src/screens/AddExpenseScreen.tsx`, `ExpensesScreen.tsx`

---

## Paso 8: Organiza tu agenda diaria

1. Ve a la pestaña **Agenda**
2. Verás tu viaje organizado por **días**
3. Toca un **día** (ej: "Día 1 — 15/06/2026")
4. Toca **+ Añadir evento**
5. Completa:
   - **Nombre**: ej. "Check-in hotel Ubud"
   - **Hora**: ej. "14:00"
   - **Duración**: ej. "30 min"
   - **Ubicación** (opcional): busca en Google Places o marca en mapa
   - **Notas** (opcional): ej. "Llevar pasaporte y confirmación"
6. Toca **Guardar**

**Resultado**: El evento aparece en la agenda del día. Puedes ver:
- Vista diaria: lista de eventos del día
- Vista calendario: mes completo con indicadores de días con eventos

**Referencia verificada**: `viatio-app/src/screens/TripAgendaScreen.tsx`, `AddEventoScreen.tsx`, `TripCalendarScreen.tsx`

---

## Paso 9: Comparte tu viaje con otras personas (opcional)

Si viajas con pareja, amigos o familia, puedes **compartir el viaje** para sincronizar todo en tiempo real.

### Convertir viaje privado en compartido
1. Ve al **detalle del viaje** (pantalla principal con pestañas)
2. Toca el icono de **configuración** (arriba a la derecha)
3. Toca **Compartir viaje**
4. **Confirma** que quieres convertirlo en compartido

### Invitar personas
1. La app genera un **código de invitación** (ej: "ABC123")
2. Comparte el código por WhatsApp, email o mensaje
3. Las personas invitadas:
   - Abren Viatio
   - Van a **Viajes compartidos** (pestaña inferior)
   - Tocan **Unirse con código**
   - Introducen el código
   - ¡Listo! Ya están dentro del viaje

### Qué se sincroniza
- ✅ Reservas: todos ven y pueden añadir
- ✅ Documentos: subidos a la nube, accesibles para todos
- ✅ Gastos: registro compartido con reparto automático
- ✅ Agenda: eventos visibles para todos
- ✅ Lugares: marcados en mapa compartido

**Resultado**: Cambios en tiempo real. Si María añade una reserva, Carlos la ve al instante.

**Referencia verificada**: `viatio-app/src/screens/shared/CreateSharedTripScreen.tsx`, `InviteToTripScreen.tsx`, `JoinTripByCodeScreen.tsx`, `services/sync/`

---

## Paso 10: Usa el Asistente de IA (Copilot)

El **Copilot** te ayuda con sugerencias, resúmenes y optimización de tu viaje.

1. Abre tu viaje
2. Toca el icono de **Asistente** (arriba a la derecha) o ve a la pestaña **Asistente**
3. Haz una **pregunta** o solicita ayuda:
   - "Resume mi itinerario de mañana"
   - "¿Cuánto he gastado en alojamiento?"
   - "Sugiere optimizaciones para el día 3"
   - "¿Qué lugares están cerca de mi hotel?"
4. Copilot analiza tu viaje y **responde** con información contextual y acciones sugeridas

**Ejemplo de respuesta**:
> **Resumen mañana (día 2 — 16/06/2026)**
> - 09:00 — Desayuno en hotel
> - 10:30 — Excursión templos (5h)
> - 16:00 — Free time
> - 20:00 — Cena en "Warung Bali"
>
> **Sugerencia**: Tienes 3.5h libres entre excursión y cena. ¿Quieres que te sugiera lugares cercanos?

**Referencia verificada**: `viatio-app/src/screens/AssistantScreen.tsx`, `services/ai/copilot.ts`, backend `/api/copilot`

---

## ¡Listo! Ya tienes tu primer viaje organizado

Ahora puedes:
- 📱 **Consultar todo offline** (incluso sin internet)
- 🔄 **Sincronizar** con tu grupo si es viaje compartido
- 💰 **Controlar presupuesto** en tiempo real
- 🗺️ **Ver lugares en mapa** (pestaña Mapa)
- 🔔 **Recibir notificaciones** de recordatorios (configúralas en Ajustes)

---

## Próximos pasos recomendados

### Para aprovechar al máximo Viatio

1. **Configura notificaciones**:
   - Ve a **Perfil** → **Notificaciones**
   - Activa recordatorios de reservas y eventos

2. **Añade más reservas**:
   - Escanea todas tus confirmaciones (vuelos, hoteles, actividades)
   - Viatio las organiza automáticamente por fecha

3. **Marca lugares de interés**:
   - Ve a **Mapa** → toca el icono **+**
   - Busca o marca lugares (restaurantes, miradores, tiendas)
   - Añade notas: "Recomendado por Juan"

4. **Registra gastos a medida**:
   - Cada vez que pagues algo, ábrelo en Viatio (tarda 10 segundos)
   - Mantén control en tiempo real

5. **Invita a más personas** (si aplica):
   - Cuantos más miembros, más útil es la sincronización
   - Cada uno puede aportar reservas y gastos

6. **Explora el Asistente**:
   - Prueba preguntas diferentes
   - Descubre sugerencias de optimización

---

## Consejos para un primer viaje exitoso

### ✅ Haz esto
- **Escanea reservas** en lugar de introducirlas manualmente (ahorra tiempo)
- **Registra gastos en el momento** (no al final del día → se olvidan)
- **Usa categorías** para gastos y documentos (más fácil de encontrar)
- **Activa notificaciones** de reservas (no olvides check-ins)
- **Comparte el viaje** si viajas con otros (sincronización = magia)

### ❌ Evita esto
- **No esperes al final del viaje** para registrar gastos (imposible recordar todo)
- **No uses múltiples viajes** para el mismo destino (mejor un viaje con múltiples días)
- **No ignores el presupuesto**: si lo configuras, úsalo para tomar decisiones
- **No confíes solo en tu memoria**: documenta todo en Viatio

---

## Resolución de problemas comunes

### "No recibo el email de verificación"
- Revisa **spam/promociones**
- Espera 5 minutos (a veces tarda)
- Toca **Reenviar email** en la app
- Si persiste: usa **Continuar con Google** (más rápido)

### "El escaneo de reserva no funciona bien"
- Asegúrate de que la **imagen sea nítida** (buena luz, sin reflejos)
- Incluye **toda la información** en la captura (no recortes)
- Si falla: introduce **manualmente** (igualmente rápido)

### "No veo cambios de otros miembros en tiempo real"
- Comprueba que tienes **internet activo**
- Ve a **Ajustes** → **Sincronización** → **Sincronizar ahora**
- Cierra y reabre la app

### "La app se cierra o va lenta"
- Asegúrate de tener la **última versión** (App Store / Play Store)
- Reinicia el dispositivo
- Libera espacio de almacenamiento (la app usa SQLite local)

---

## Soporte y ayuda

### ¿Tienes dudas?
➡️ **FAQ completo**: [04_FAQ.md](./04_FAQ.md)

### ¿Quieres entender mejor una funcionalidad?
➡️ **Casos de uso**: [02_CASOS_DE_USO.md](./02_CASOS_DE_USO.md)

### ¿Necesitas ayuda técnica?
➡️ Ve a **Perfil** → **Ayuda** en la app
➡️ O contacta: [email de soporte] (🚀 por definir)

---

## Resumen de tu primer viaje en Viatio

| ✅ Hecho | Resultado |
|----------|-----------|
| Cuenta creada | Acceso a Viatio desde cualquier dispositivo |
| Primer viaje creado | Hub central de toda tu información |
| Reserva añadida | Itinerario organizado automáticamente |
| Documento subido | Acceso offline a información crítica |
| Gasto registrado | Control de presupuesto en tiempo real |
| Agenda organizada | Saber qué haces cada día |
| Viaje compartido (opcional) | Sincronización con tu grupo |
| Asistente usado | Optimización inteligente de tu viaje |

---

**¡Disfruta de tu viaje con Viatio! Menos apps, menos fricción, más viaje.**

➡️ **Siguiente**: [FAQ completo](./04_FAQ.md) | [Casos de uso](./02_CASOS_DE_USO.md) | [Pricing](./06_PRICING_PROPUESTO.md)
