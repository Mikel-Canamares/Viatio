# Privacidad y datos — Tu información, tu control

Este documento explica de forma **clara y comprensible** (no legal) cómo Viatio maneja tus datos personales.

**Filosofía de Viatio**: Tus datos son **tuyos**. No los vendemos, no mostramos publicidad y te damos control total sobre qué compartir y con quién.

---

## Resumen ejecutivo (en 30 segundos)

- 🔒 **Viajes privados** → datos solo en **tu dispositivo** (nunca salen)
- ☁️ **Viajes compartidos** → datos sincronizados en **Firebase** (nube segura de Google)
- 🚫 **Nunca vendemos** datos a terceros
- 🚫 **Sin publicidad** (monetizamos con suscripciones, no con tus datos)
- ✅ **Puedes exportar** y **eliminar** tus datos en cualquier momento
- 🔐 **Cifrado** en tránsito y en reposo (Firebase)

---

## ¿Qué datos maneja Viatio?

### Datos de cuenta y perfil
**Qué guardamos**:
- Email (para login y notificaciones)
- Nombre completo (para identificarte en viajes compartidos)
- Foto de perfil (opcional)
- UID de autenticación (Firebase Auth)

**Para qué lo usamos**:
- Autenticarte en la app
- Mostrarte en viajes compartidos
- Enviarte notificaciones importantes (olvidos de reservas, recordatorios)

**Dónde se almacena**:
- **Firebase Auth** (servicio seguro de Google)

**Referencia verificada**: `viatio-app/src/config/firebase.ts`

---

### Datos de viajes
**Qué guardamos**:
- Nombre del viaje, destino, fechas, presupuesto
- Descripción y notas

**Para qué lo usamos**:
- Mostrarte tus viajes organizados
- Calcular estadísticas (gastos, presupuesto)

**Dónde se almacena**:
- **Viajes privados**: solo en **tu dispositivo** (SQLite local)
- **Viajes compartidos**: en **Firebase/Firestore** + tu dispositivo

**Referencia verificada**: `viatio-app/src/database/schema.ts`, `services/firestore/`

---

### Datos de reservas
**Qué guardamos**:
- Tipo (vuelo, hotel, restaurante, actividad, transporte)
- Fecha, hora, origen, destino
- Número de confirmación
- Proveedor (aerolínea, hotel, etc.)
- Notas

**Para qué lo usamos**:
- Organizar tu itinerario
- Recordarte próximas reservas (notificaciones)

**Dónde se almacena**:
- **Viajes privados**: solo en **tu dispositivo**
- **Viajes compartidos**: en **Firebase/Firestore** + tu dispositivo

**Si usas escaneo de IA**:
- La imagen se envía al **backend de Viatio** (Node/Express)
- El backend la procesa con **Gemini AI** (Google)
- Los datos extraídos vuelven a la app
- **La imagen NO se almacena** en nuestros servidores (se procesa y se descarta)

**Referencia verificada**: `viatio-backend/src/routes/assistant.ts`

---

### Datos de gastos
**Qué guardamos**:
- Monto, divisa, categoría
- Descripción, fecha
- Quién pagó (en viajes compartidos)
- División entre personas (en viajes compartidos)

**Para qué lo usamos**:
- Calcular totales y presupuestos
- Mostrar balances de gastos compartidos
- Generar informes de gastos

**Dónde se almacena**:
- **Viajes privados**: solo en **tu dispositivo**
- **Viajes compartidos**: en **Firebase/Firestore** + tu dispositivo

---

### Documentos y archivos
**Qué guardamos**:
- Archivos que subes (PDFs, imágenes, documentos)
- Nombre del archivo, categoría, fecha de subida

**Para qué lo usamos**:
- Mostrarte tus documentos de viaje (billetes, seguros, confirmaciones)

**Dónde se almacena**:
- **Viajes privados**: solo en **tu dispositivo**
- **Viajes compartidos**: en **Firebase Storage** (nube de Google) + tu dispositivo

⚠️ **Importante**: No accedemos al contenido de tus documentos. Solo los almacenamos cifrados.

**Referencia verificada**: `viatio-app/src/services/firestore/storage.ts`

---

### Ubicaciones y mapas
**Qué guardamos**:
- Latitud y longitud de lugares marcados
- Nombre del lugar, notas

**Para qué lo usamos**:
- Mostrarte lugares en el mapa
- Sugerir lugares cercanos (con Google Places API)

**Dónde se almacena**:
- **Tu dispositivo** + Firebase/Firestore (si es viaje compartido)

**¿Compartimos tu ubicación con terceros?**
- Solo usamos **Google Maps/Places API** para mostrar mapas y sugerir lugares
- Google puede recibir coordenadas según su [política de privacidad](https://policies.google.com/privacy)

---

### Notificaciones
**Qué guardamos**:
- Preferencias de notificaciones (qué alertas quieres recibir)
- Tokens de push (para enviar notificaciones a tu dispositivo)

**Para qué lo usamos**:
- Recordarte reservas, eventos, presupuesto

**Dónde se almacena**:
- Preferencias: **tu dispositivo**
- Tokens: **Firebase Cloud Messaging** (servicio de Google)

**Referencia verificada**: `viatio-app/src/services/notifications.ts`

---

### Uso del asistente de IA (Copilot)
**Qué enviamos al backend**:
- Tu pregunta
- Contexto de tu viaje (reservas, gastos, itinerario) necesario para responder

**Para qué lo usamos**:
- Responder tus preguntas con información contextual

**Dónde se procesa**:
- **Backend de Viatio** (Node/Express)
- **Gemini AI** (Google) para procesamiento de lenguaje natural

**¿Se almacenan las consultas?**
- ⚠️ **NECESITA VALIDACIÓN**: Actualmente no tenemos política definida de logs
- 🚀 **Compromiso futuro**: No almacenaremos conversaciones completas, solo métricas anónimas de uso

**Referencia verificada**: `viatio-backend/src/routes/assistant.ts`

---

## ¿Con quién compartimos tus datos?

### Nunca compartimos con terceros para marketing o publicidad

❌ **No vendemos** datos a anunciantes
❌ **No mostramos** publicidad basada en tus viajes
❌ **No compartimos** con data brokers

### Servicios técnicos necesarios (procesadores de datos)

Viatio usa servicios de terceros para funcionar. Estos **solo procesan datos** según nuestras instrucciones y tienen sus propias políticas de privacidad:

| Servicio | Qué procesa | Para qué | Política de privacidad |
|----------|-------------|----------|------------------------|
| **Firebase (Google)** | Autenticación, datos de viajes compartidos, archivos | Sincronización en tiempo real | [Firebase Privacy](https://firebase.google.com/support/privacy) |
| **Google Cloud (Gemini AI)** | Imágenes de reservas, consultas al asistente | Procesamiento con IA | [Google Cloud Privacy](https://cloud.google.com/privacy) |
| **Google Maps/Places** | Coordenadas de lugares | Mapas y sugerencias | [Google Maps Privacy](https://policies.google.com/privacy) |
| **Frankfurter API** | Montos y divisas | Conversión de divisas | [Frankfurter](https://www.frankfurter.app/) (open-source, sin tracking) |

**Referencia verificada**: `viatio-app/src/services/`, `viatio-backend/src/services/`

---

## Diferencia clave: viajes privados vs compartidos

### Viajes privados
- ✅ Datos **100% en tu dispositivo** (SQLite local)
- ✅ **Nunca** salen de tu móvil
- ✅ Ni siquiera nosotros tenemos acceso
- ✅ Si desinstalar la app → datos eliminados (a menos que hagas backup)

**Conclusión**: Máxima privacidad. Ideal si viajas solo o no necesitas sincronización.

### Viajes compartidos
- ☁️ Datos sincronizados en **Firebase/Firestore** (nube de Google)
- 🔐 Cifrados en tránsito (HTTPS) y en reposo (Firebase encryption)
- 👥 Accesibles solo por **miembros invitados del viaje**
- ⚠️ Si eliminas datos → se eliminan para todos los miembros

**Conclusión**: Sincronización en tiempo real a cambio de almacenamiento en nube segura.

**Referencia verificada**: `viatio-app/src/services/sync/`

---

## Seguridad de tus datos

### Cifrado
- 🔐 **En tránsito**: todas las comunicaciones usan HTTPS/TLS
- 🔐 **En reposo**: Firebase cifra datos automáticamente en sus servidores
- 🔐 **En tu dispositivo**: SQLite almacena datos localmente (sin cifrado adicional por defecto → 🚀 roadmap)

### Autenticación
- 🔑 Contraseñas **nunca se almacenan** en texto plano (Firebase Auth usa bcrypt)
- 🔑 Social login (Google) usa **OAuth 2.0** (estándar de seguridad)

### Acceso a datos
- ❌ Viatio **no accede** a tus viajes privados (están solo en tu dispositivo)
- ⚠️ Viajes compartidos: técnicamente podríamos acceder (están en Firebase), pero **no lo hacemos** excepto:
  - **Soporte técnico** (con tu consentimiento explícito)
  - **Obligaciones legales** (orden judicial)

**Referencia verificada**: `viatio-app/src/config/firebase.ts`, `tecnicos/30_SECURITY_OVERVIEW.md`

---

## Tu control sobre tus datos

### Puedes ver qué datos tenemos
Ve a **Perfil** → **Mis datos** (🚀 próximamente)

### Puedes exportar tus datos
- ✅ **Hoy**: exportar gastos (CSV/Excel)
- 🚀 **Próximamente**: exportar viajes completos (JSON, PDF)

### Puedes corregir datos
Edita viajes, reservas, gastos, documentos en cualquier momento.

### Puedes eliminar datos
- **Un viaje**: desliza y elimina
- **Un documento**: selecciona y elimina
- **Toda tu cuenta**: **Perfil** → **Eliminar cuenta** → confirma

⚠️ **Importante**: Eliminar cuenta es **irreversible**. Todos tus datos se borran permanentemente.

### Puedes revocar acceso a viajes compartidos
1. Ve al viaje compartido
2. **Miembros** → Selecciona persona → **Eliminar**
3. O abandona el viaje tú mismo: **Abandonar viaje**

---

## Retención de datos

### ¿Cuánto tiempo guardamos tus datos?

| Tipo de dato | Retención |
|--------------|-----------|
| Cuenta activa | Mientras uses Viatio |
| Viajes activos | Mientras no los elimines |
| Viajes archivados | Mientras no los elimines |
| Cuenta eliminada | **30 días** (periodo de gracia por si cambias de opinión) |
| Después de 30 días | **Eliminación permanente** de todos los datos |

⚠️ **NECESITA VALIDACIÓN**: Política de retención en Firebase no está documentada formalmente. Será definida antes del lanzamiento.

**Referencia**: `/tecnicos/31_PRIVACY_AND_DATA_HANDLING.md` (marca PENDIENTE / TODO)

---

## Cookies y tracking

### ¿Viatio usa cookies?
❌ **No** en la app móvil (no es un sitio web).

🚀 **Si lanzamos web** (roadmap): solo cookies técnicas necesarias (sesión), no cookies de publicidad.

### ¿Viatio hace tracking de comportamiento?
⚠️ **NECESITA VALIDACIÓN**: Actualmente no tenemos analytics definido.

🚀 **Roadmap**: Métricas anónimas de uso (ej: "cuántos usuarios crearon un viaje") para mejorar el producto, **nunca** tracking individual para publicidad.

---

## Menores de edad

Viatio está diseñado para **mayores de 16 años** (o la edad mínima según tu país para consentimiento digital).

Si eres menor de 16, necesitas **permiso de tus padres o tutores** para usar Viatio.

---

## Cambios en esta política

Si cambiamos esta política de privacidad:
1. Te **notificaremos** por email o en la app
2. Te daremos **30 días** para revisar los cambios
3. Puedes **cancelar tu cuenta** si no estás de acuerdo

---

## Cumplimiento legal

### GDPR (Unión Europea)
Si estás en la UE, tienes derechos adicionales:
- ✅ Derecho de **acceso** (ver qué datos tenemos)
- ✅ Derecho de **rectificación** (corregir datos incorrectos)
- ✅ Derecho de **supresión** ("derecho al olvido")
- ✅ Derecho de **portabilidad** (exportar tus datos)
- ✅ Derecho de **oposición** (rechazar ciertos usos)

**Referencia**: `/tecnicos/31_PRIVACY_AND_DATA_HANDLING.md` (marca guidance GDPR)

### Otras jurisdicciones
⚠️ **NECESITA VALIDACIÓN**: Cumplimiento con CCPA (California), LGPD (Brasil) y otras regulaciones pendiente de documentar formalmente.

---

## Contacto y preguntas

### ¿Tienes dudas sobre privacidad?
Escríbenos a: **[privacy@viatio.com]** (🚀 por definir)

### ¿Quieres ejercer tus derechos (GDPR)?
Envía solicitud a: **[dpo@viatio.com]** (🚀 por definir)

Responderemos en **máximo 30 días**.

---

## Documento técnico completo

➡️ **Para desarrolladores y auditores**: [Privacidad técnica completa](../tecnicos/31_PRIVACY_AND_DATA_HANDLING.md)

---

## Resumen final — Tu privacidad en Viatio

| Pregunta | Respuesta |
|----------|-----------|
| ¿Viatio vende mis datos? | ❌ Nunca |
| ¿Viatio muestra publicidad? | ❌ No |
| ¿Puedo usar Viatio sin compartir datos en la nube? | ✅ Sí (viajes privados) |
| ¿Puedo exportar mis datos? | ✅ Sí (parcial hoy, completo próximamente) |
| ¿Puedo eliminar mi cuenta? | ✅ Sí, en cualquier momento |
| ¿Mis datos están cifrados? | ✅ Sí (en tránsito y en reposo) |
| ¿Quién puede ver mis viajes privados? | Solo tú |
| ¿Quién puede ver mis viajes compartidos? | Solo los miembros invitados |

---

**Última actualización**: 2026-01-21
**Versión**: 1.0 (pre-lanzamiento)

⚠️ **Nota importante**: Este documento refleja el estado actual del producto y las prácticas de privacidad previstas. Algunos aspectos marcados como **NECESITA VALIDACIÓN** serán formalizados antes del lanzamiento público.

**Viatio — Tus datos, tu viaje, tu control.**
