# Product Requirements

**Audiencia**: Product Managers, stakeholders, equipos de producto
**Estado**: Refleja producto implementado + roadmap propuesto

---

## Descripción del producto

Viatio es una **app móvil todo-en-uno** para organizar viajes con:
- Itinerarios y agenda diaria
- Reservas inteligentes (escaneo con IA)
- Gestión de gastos con reparto automático
- Documentos centralizados
- Colaboración en tiempo real
- Asistente de IA contextual (Copilot)

**Posicionamiento**: "Tu Travel OS personal" — reemplaza la fragmentación de múltiples apps (Gmail + Excel + WhatsApp + Maps + Splitwise).

**Referencia verificada**: Ver detalles técnicos en `/tecnicos/02_SYSTEM_OVERVIEW.md`

---

## Funcionalidades principales (implementadas)

### ✅ Gestión de viajes
- Crear, editar, archivar y eliminar viajes
- Configurar: destino, fechas, presupuesto, descripción
- Viajes privados (solo en dispositivo) vs compartidos (sincronizados en nube)

### ✅ Agenda e itinerarios
- Vista diaria: eventos organizados por día
- Vista calendario: mes completo
- Eventos personalizados con notas, ubicación y horarios

### ✅ Reservas inteligentes
- **Manual**: añadir vuelos, hoteles, restaurantes, actividades, transporte
- **Escaneo con IA**: extraer datos automáticamente desde imágenes (Gemini)
- Vinculación de gastos a reservas

**Referencia**: `viatio-app/src/screens/AddReservationScreen.tsx`, `backend/routes/assistant.ts`

### ✅ Gestión de gastos
- Registro de gastos con monto, divisa, categoría
- Conversión automática de divisas (Frankfurter API)
- Reparto entre personas en viajes compartidos
- Cálculo de balances y liquidaciones

**Referencia**: `viatio-app/src/screens/ExpensesScreen.tsx`, `shared/SharedExpensesScreen.tsx`

### ✅ Documentos
- Subir archivos (PDF, imágenes) hasta 10MB
- Organizar por categorías
- Almacenamiento local (privados) o nube (compartidos)
- Acceso offline

**Referencia**: `viatio-app/src/screens/TripDocumentsScreen.tsx`

### ✅ Mapas y lugares
- Visualización de reservas y lugares en mapa
- Marcadores personalizados
- Integración con Google Places/Maps

**Referencia**: `viatio-app/src/screens/TripMapScreen.tsx`

### ✅ Colaboración (viajes compartidos)
- Invitaciones por código
- Sincronización en tiempo real (Firebase)
- Gestión de miembros
- Modo offline con sync al reconectar

**Referencia**: `viatio-app/src/services/sync/`

### ✅ Asistente de IA (Copilot)
- Respuestas contextuales sobre el viaje
- Sugerencias de optimización
- Procesamiento con Gemini AI

**Referencia**: `viatio-app/src/services/ai/copilot.ts`, `backend/routes/copilot.ts`

### ✅ Notificaciones
- Recordatorios de reservas y eventos
- Alertas de presupuesto
- Cambios en viajes compartidos

**Referencia**: `viatio-app/src/services/notifications.ts`

---

## Reglas de negocio

### Viajes privados vs compartidos
- **Privados**: datos solo en dispositivo (SQLite), sin sincronización
- **Compartidos**: requieren `isShared=true` y `firestoreId`, sincronización en Firebase

### Gastos y reparto
- Gastos pueden vincularse a reservas específicas
- En viajes compartidos: división automática entre personas
- Balances calculados automáticamente (quién debe a quién)
- Liquidaciones registran transferencias reales

### Sincronización
- Solo aplica a viajes compartidos
- Upload de cambios locales → Firestore
- Download de cambios remotos → SQLite local
- Real-time listeners para actualizaciones instantáneas

**Referencia**: `viatio-app/src/services/sync/uploadChanges.ts`, `downloadChanges.ts`

---

## Fuera de alcance (NO implementado)

❌ **Pagos reales o integración de pasarelas de pago**
- Viatio NO procesa pagos
- Usuarios hacen transferencias externas (Bizum, PayPal, etc.)
- Solo registramos quién debe a quién

❌ **Reservas automáticas desde la app**
- Viatio NO es OTA (Online Travel Agency)
- NO vendemos vuelos, hoteles ni actividades
- Organizamos lo que el usuario ya reservó externamente

❌ **Red social o perfiles públicos**
- Sin feeds, likes, comentarios
- Sin búsqueda de usuarios
- Solo colaboración privada en viajes compartidos

❌ **Modo grupo con roles avanzados**
- Actualmente todos los miembros tienen permisos iguales
- 🚀 **Roadmap**: roles (admin, editor, viewer)

---

## Roadmap (funcionalidades propuestas)

### 🚀 Q1-Q2 2026 (corto plazo)
- **Exportación avanzada**: PDF de itinerarios completos con mapa
- **Widgets**: acceso rápido a próximos viajes desde home screen
- **Integraciones**: Apple Wallet / Google Pay para boarding passes (.pkpass)
- **Roles en viajes compartidos**: admin, editor, viewer

### 🚀 Q3-Q4 2026 (medio plazo)
- **Recomendaciones personalizadas**: sugerencias basadas en preferencias y contexto
- **Marketplace de experiencias**: descubrir y reservar actividades curadas
- **Integraciones con OTAs**: pre-fill de reservas desde Booking.com, Airbnb
- **Comunidades**: conectar con viajeros de destinos específicos (buceo, trekking)

### 🔮 2027+ (largo plazo)
- **Asistente proactivo**: Copilot que anticipa necesidades y optimiza automáticamente
- **Planificación automática**: IA que genera itinerarios completos desde preferencias
- **Integración con wearables**: Apple Watch, Google Wear

---

## Métricas clave de producto

### North Star Metric
**Viajes organizados por mes** (completos: con itinerario + documento + gasto)

### Métricas de activación
- % de usuarios que crean su primer viaje en <24h
- % de viajes con al menos 1 reserva escaneada (IA)
- % de viajes con presupuesto configurado

### Métricas de engagement
- Viajes activos por usuario (media)
- Días desde último uso
- Consultas al Copilot por viaje

### Métricas de colaboración
- % de usuarios con al menos 1 viaje compartido
- Miembros promedio por viaje compartido
- Sincronizaciones por día (engagement de grupo)

### Métricas de conversión
- Free → Lite: % tras N viajes
- Lite → Pro: % tras N miembros en viaje compartido

---

## Dependencias técnicas clave

| Servicio | Uso | Coste estimado/usuario/mes |
|----------|-----|---------------------------|
| Firebase Auth | Autenticación | ~€0.05 |
| Firestore | Sync de viajes compartidos | ~€0.50–€2 |
| Firebase Storage | Documentos compartidos | ~€0.20–€1 |
| Gemini AI | Escaneo de reservas + Copilot | ~€0.50–€5 |
| Google Maps/Places | Mapas y lugares | ~€0.20–€1 |
| Frankfurter API | Divisas | Gratis (open-source) |

**Total coste variable**: ~€1.45–€10/usuario/mes (según uso de IA)

---

## Comparación con competencia

| Producto | Qué ofrece | Precio | Ventaja de Viatio |
|----------|------------|--------|------------------|
| **TripIt Pro** | Itinerarios + alertas | $49/año | Viatio añade: gastos, colaboración, IA |
| **Wanderlog** | Itinerarios colaborativos | Gratis/Pro $60/año | Viatio añade: gastos, documentos, IA |
| **Splitwise** | Gastos compartidos | Gratis/Pro $36/año | Viatio integra gastos con itinerario |
| **Google Travel** | Itinerarios de Gmail | Gratis | Viatio añade: colaboración, documentos, IA, offline |

**Posicionamiento**: Viatio = TripIt + Wanderlog + Splitwise + IA en una sola app.

---

## Referencias y documentación relacionada

- **Documentación técnica**: `/tecnicos/02_SYSTEM_OVERVIEW.md`
- **User flows**: `61_USER_FLOWS.md`
- **Roadmap**: `62_ROADMAP.md`
- **Pricing propuesto**: `/usuarios/06_PRICING_PROPUESTO.md`

---

**Última actualización**: 2026-01-21
**Versión**: 2.0 (post-auditoría, con marcas de estado)

