# Viatio — Tu Travel OS personal

## Qué es Viatio (en 30 segundos)

**Viatio** es la app móvil que reúne todo tu viaje en un solo lugar: planificación, itinerarios, reservas, documentos, gastos, mapas y coordinación con tu grupo.

Olvídate de tener tus vuelos en Gmail, los gastos en Excel, las fotos de confirmaciones en WhatsApp y el itinerario en notas. **Viatio centraliza todo** y te ayuda con inteligencia artificial a organizarlo mejor y más rápido.

**En una frase:** Viatio es tu sistema operativo personal para viajar.

---

## El problema que resuelve

Organizar un viaje hoy es un caos:
- ✉️ **Confirmaciones perdidas** entre correos, capturas y PDFs
- 💰 **Gastos dispersos** sin control claro de quién pagó qué
- 📝 **Itinerarios en notas** que nadie actualiza
- 🗺️ **Lugares guardados** en Maps que se olvidan
- 💬 **Coordinación en WhatsApp** donde la información se pierde

Si viajas con más personas, **el caos se multiplica**.

Viatio elimina la fricción y te devuelve tiempo para disfrutar del viaje.

---

## Para quién es Viatio

### Eres el usuario ideal de Viatio si...
- ✅ Viajas **2 o más veces al año** (trabajo, ocio, aventura)
- ✅ Organizas viajes **con pareja, amigos o familia**
- ✅ Te gusta tener todo **controlado y organizado**
- ✅ Valoras apps **simples, bonitas y útiles**
- ✅ Quieres **menos apps y más viaje**

### Casos de uso reales
- 🏖️ **Pareja de vacaciones**: planificar un viaje de 7 días con reservas, documentos y presupuesto compartido
- 🤿 **Grupo de buceo**: coordinar centro, horarios, certificaciones y gastos entre 6 personas
- 🏔️ **Trekking con amigos**: itinerario día a día, refugios, equipaje y reparto de costes
- 🌍 **Viaje multi-destino**: 3 países, 5 ciudades, 12 reservas, todo sincronizado y accesible offline
- 💼 **Trabajo remoto + viaje**: combinar reuniones, vuelos y tiempo libre en un solo calendario

➡️ **Ver más casos de uso detallados**: [Casos de uso](./02_CASOS_DE_USO.md)

---

## Beneficios clave (verificados en la app)

### 1. 📋 Todo tu viaje en un solo lugar
- Crea viajes con destino, fechas y presupuesto
- Organiza tu agenda día a día
- Guarda reservas de vuelos, hoteles, actividades, restaurantes
- Almacena documentos (billetes, confirmaciones, seguros) hasta 10MB
- Marca lugares en el mapa y visualiza rutas diarias

**Referencia verificada**: `viatio-app/src/screens/TripDetailScreen.tsx`, `database/schema.ts`

### 2. 🤖 Inteligencia artificial que te ayuda
- **Escanea reservas desde imágenes**: sube una captura de tu vuelo o hotel y Viatio extrae los datos automáticamente (fecha, hora, número de confirmación, etc.)
- **Asistente contextual (Copilot)**: pregunta sobre tu viaje y recibe sugerencias, resúmenes y acciones útiles
- **Automatización inteligente**: ahorra tiempo en tareas repetitivas

**Referencia verificada**: `viatio-backend/src/routes/assistant.ts`, `viatio-app/src/screens/ScanReservationScreen.tsx`, `services/ai/copilot.ts`

### 3. 💰 Gestión de gastos simplificada
- Registra gastos vinculados a reservas o eventos
- Divide gastos entre personas en viajes compartidos
- Visualiza quién debe a quién y registra liquidaciones
- Exporta informes de gastos

**Referencia verificada**: `viatio-app/src/screens/ExpensesScreen.tsx`, `screens/shared/SharedExpensesScreen.tsx`, `screens/shared/RecordSettlementScreen.tsx`

### 4. 👥 Colaboración real para viajes compartidos
- Comparte viajes con amigos, pareja o familia
- Invita miembros por código o enlace
- Sincronización automática en tiempo real (todos ven lo mismo)
- Cada persona puede añadir reservas, gastos y documentos
- Modo offline: trabajas local y sincronizas cuando tengas red

**Referencia verificada**: `viatio-app/src/services/sync/`, `screens/shared/InviteToTripScreen.tsx`, `screens/shared/TripMembersScreen.tsx`

### 5. 🗺️ Mapas y rutas integradas
- Visualiza todos tus lugares en un mapa interactivo
- Crea rutas diarias con tus reservas y eventos
- Integración con Google Maps para direcciones

**Referencia verificada**: `viatio-app/src/screens/TripMapScreen.tsx`, `services/googlePlaces.ts`

### 6. 📱 Funciona offline
- Todos tus datos se almacenan localmente en el dispositivo
- No necesitas internet para consultar itinerarios, documentos o gastos
- Sincronización automática cuando recuperas conexión (solo en viajes compartidos)

**Referencia verificada**: `viatio-app/src/database/`, arquitectura offline-first con SQLite

### 7. 🔒 Privacidad y control total
- Tus datos son tuyos: viajes privados quedan solo en tu dispositivo
- Viajes compartidos se sincronizan de forma segura con Firebase
- Puedes exportar o eliminar tus datos en cualquier momento
- Sin publicidad ni venta de datos

**Referencia verificada**: `viatio-app/src/services/firestore/`, autenticación Firebase

---

## Qué incluye hoy (✅ Implementado)

### ✅ Gestión de viajes
- Crear, editar, archivar y eliminar viajes
- Configurar destino, fechas, presupuesto y descripción
- Marcar viajes como compartidos o privados

### ✅ Agenda e itinerarios
- Agenda diaria con eventos personalizados
- Visualización por día o calendario mensual
- Añadir notas, horarios y recordatorios

### ✅ Reservas inteligentes
- Añadir reservas manualmente (vuelos, hoteles, restaurantes, actividades, transporte)
- Escanear reservas desde imágenes con IA (extracción automática de datos)
- Editar, duplicar y eliminar reservas
- Vincular gastos a reservas

### ✅ Documentos
- Subir archivos (PDF, imágenes, documentos) hasta 10MB
- Organizar por categorías
- Sincronización en viajes compartidos
- Acceso offline

### ✅ Gastos y reparto
- Registrar gastos con categoría, monto y divisa
- Conversión automática de divisas (Frankfurter API)
- Dividir gastos entre miembros del viaje
- Calcular balances y liquidaciones
- Historial de liquidaciones

### ✅ Mapas y lugares
- Visualizar reservas y lugares en mapa interactivo
- Añadir lugares personalizados
- Sugerencias de lugares con Google Places
- Rutas diarias

### ✅ Asistente de IA (Copilot)
- Pregunta sobre tu viaje y recibe respuestas contextuales
- Sugerencias de optimización de itinerario
- Acciones inteligentes basadas en tu planificación

### ✅ Colaboración
- Compartir viajes con otras personas
- Invitaciones por código
- Sincronización en tiempo real
- Gestión de miembros y permisos

### ✅ Notificaciones
- Recordatorios de reservas y eventos
- Alertas de presupuesto
- Notificaciones de cambios en viajes compartidos

### ✅ Perfil y configuración
- Autenticación con email/contraseña
- Autenticación con Google (social login)
- Gestión de perfil y preferencias
- Configuración de notificaciones

---

## Qué está en el roadmap (🚀 Futuro)

### 🚀 Próximamente (planificado)
- **Recomendaciones personalizadas**: sugerencias de actividades y lugares basadas en tus preferencias
- **Integraciones de reservas**: booking directo desde la app con partners
- **Exportación avanzada**: PDF de itinerarios completos para compartir
- **Modo grupo mejorado**: roles (admin, miembro), permisos granulares
- **Widgets**: acceso rápido a próximos viajes desde home screen
- **Apple Wallet / Google Pay**: integración con .pkpass para boarding passes

### 🔮 Visión a largo plazo
- **Marketplace de experiencias**: descubre y reserva actividades curadas
- **Comunidades de viajeros**: conecta con otros viajeros de destinos específicos (buceo, trekking, etc.)
- **Asistente proactivo**: Copilot que anticipa necesidades y optimiza tu viaje automáticamente

> **Nota**: Las funcionalidades marcadas como 🚀 **no están implementadas** aún. Son propuestas sujetas a validación de mercado y priorización de roadmap.

---

## Qué NO hace Viatio (fuera de alcance)

❌ **No vende vuelos ni hoteles**: Viatio no es una OTA (Online Travel Agency). Organiza lo que ya has reservado o planeas reservar.

❌ **No procesa pagos reales**: puedes registrar gastos y calcular quién debe a quién, pero las transferencias las haces tú (Bizum, PayPal, etc.)

❌ **No es una red social**: no hay perfiles públicos, likes ni feeds. Es una herramienta de organización personal y colaborativa.

❌ **No reemplaza Maps o Google Flights**: usa esas apps para buscar y decidir; Viatio organiza lo que ya decidiste.

---

## Cómo funciona (en resumen)

1. **Crea tu viaje**: destino, fechas, presupuesto
2. **Organiza tu itinerario**: añade reservas (manualmente o escaneando), eventos y lugares
3. **Sube documentos**: billetes, confirmaciones, seguros
4. **Registra gastos**: para control personal o reparto en grupo
5. **Comparte con tu grupo** (opcional): invita personas y sincroniza todo en tiempo real
6. **Consulta todo desde un solo lugar**: agenda, mapa, documentos, gastos
7. **Viaja tranquilo**: todo offline, siempre disponible

➡️ **Guía detallada paso a paso**: [Guía rápida](./03_GUIA_RAPIDA.md)

---

## Por qué Viatio es diferente

| Otras apps | Viatio |
|------------|--------|
| 📧 Reservas en email | 📱 Reservas centralizadas y escaneables con IA |
| 📊 Gastos en Excel o Splitwise | 💰 Gastos integrados con itinerario y divisas |
| 📝 Itinerario en Google Docs | 🗓️ Agenda visual con mapa y calendario |
| ☁️ Todo en la nube (necesitas internet) | 📱 Offline-first (funciona sin internet) |
| 🔀 Múltiples apps desconectadas | 🎯 Una sola app con todo integrado |
| 🤖 Sin automatización | ✨ IA que escanea, sugiere y optimiza |

---

## Preguntas frecuentes (resumen)

**¿Es gratis?**
Sí, Viatio tiene un plan Free con funcionalidades core. También hay planes de pago con funciones avanzadas. ➡️ [Ver pricing](./06_PRICING_PROPUESTO.md)

**¿Funciona sin internet?**
Sí, todos tus datos están en tu dispositivo. Solo necesitas conexión para sincronizar viajes compartidos o usar el asistente de IA.

**¿Mis datos están seguros?**
Sí. Viajes privados quedan solo en tu dispositivo. Viajes compartidos se sincronizan de forma segura con Firebase. ➡️ [Ver privacidad](./05_PRIVACIDAD_RESUMEN.md)

**¿Cuántas personas pueden compartir un viaje?**
Ilimitadas (en la arquitectura actual). En el plan Free puede haber límites a futuro.

**¿Puedo exportar mis datos?**
✅ Sí (implementado): puedes exportar gastos. 🚀 Próximamente: exportación completa de itinerarios en PDF.

➡️ **Ver todas las preguntas**: [FAQ completo](./04_FAQ.md)

---

## Empieza ahora

1. **Descarga la app** (próximamente en App Store y Play Store)
2. **Crea tu cuenta** (email o Google)
3. **Crea tu primer viaje** en menos de 30 segundos
4. **Añade una reserva** (manual o escaneada)
5. **Invita a tu grupo** (opcional)

➡️ **Guía completa de inicio**: [Guía rápida](./03_GUIA_RAPIDA.md)

---

## Más información

- 📚 [Casos de uso detallados](./02_CASOS_DE_USO.md)
- ❓ [FAQ completo](./04_FAQ.md)
- 🔒 [Privacidad y datos](./05_PRIVACIDAD_RESUMEN.md)
- 💎 [Planes y pricing](./06_PRICING_PROPUESTO.md)

---

**Viatio — Menos apps, menos fricción, más viaje.**
