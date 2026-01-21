# FAQ — Preguntas frecuentes

Respuestas rápidas y claras a las dudas más comunes sobre Viatio.

**Índice rápido** (haz clic para ir directo):
- [General y producto](#general-y-producto)
- [Cuenta y perfil](#cuenta-y-perfil)
- [Viajes y organización](#viajes-y-organización)
- [Reservas](#reservas)
- [Documentos](#documentos)
- [Gastos y presupuesto](#gastos-y-presupuesto)
- [Viajes compartidos](#viajes-compartidos)
- [Mapas y lugares](#mapas-y-lugares)
- [Asistente de IA](#asistente-de-ia)
- [Modo offline y sincronización](#modo-offline-y-sincronización)
- [Privacidad y datos](#privacidad-y-datos)
- [Pricing y planes](#pricing-y-planes)
- [Soporte técnico](#soporte-técnico)

---

## General y producto

### ¿Qué es Viatio?
Viatio es una app móvil que centraliza **todo tu viaje en un solo lugar**: itinerarios, reservas, documentos, gastos, mapas y colaboración con tu grupo. Funciona offline y usa inteligencia artificial para automatizar tareas repetitivas.

### ¿Para quién es Viatio?
Para cualquier persona que viaje 2 o más veces al año (trabajo, ocio, aventura), especialmente si:
- Viajas con pareja, amigos o familia
- Te gusta tener todo organizado
- Quieres menos apps y más control

### ¿Qué plataformas soporta?
- **iOS**: iPhone con iOS 14 o superior
- **Android**: dispositivos con Android 8.0 o superior

### ¿Cuánto cuesta?
Viatio tiene un **plan gratuito** con funcionalidades core y **planes de pago** con funciones avanzadas. ➡️ [Ver pricing completo](./06_PRICING_PROPUESTO.md)

### ¿Necesito internet para usar Viatio?
**No** para la mayoría de funciones. Viatio funciona **offline-first**:
- ✅ Consultar itinerarios, documentos y gastos: **sin internet**
- ✅ Añadir reservas y eventos: **sin internet**
- ⚠️ Sincronizar viajes compartidos: **necesitas internet**
- ⚠️ Usar el asistente de IA: **necesitas internet**
- ⚠️ Escanear reservas con IA: **necesitas internet**

### ¿En qué idiomas está disponible?
**Actualmente**: Español
**🚀 Próximamente**: Inglés, Francés, Alemán, Portugués (roadmap)

---

## Cuenta y perfil

### ¿Cómo creo una cuenta?
Tienes 2 opciones:
1. **Email + contraseña**: registro manual con verificación de email
2. **Google**: registro rápido con tu cuenta de Google (recomendado)

➡️ [Ver guía de registro](./03_GUIA_RAPIDA.md#paso-2-crea-tu-cuenta)

### ¿Puedo usar Viatio sin crear cuenta?
**No**. Necesitas una cuenta para:
- Guardar tus viajes en la nube (backup automático)
- Sincronizar en varios dispositivos
- Compartir viajes con otras personas

### ¿Puedo cambiar mi email?
✅ **Sí** (implementado). Ve a **Perfil** → **Editar perfil** → Cambia tu email → Verifica el nuevo email.

### ¿Qué hago si olvidé mi contraseña?
1. En la pantalla de login, toca **¿Olvidaste tu contraseña?**
2. Introduce tu email
3. Revisa tu correo y sigue el enlace de recuperación
4. Crea una nueva contraseña

### ¿Puedo eliminar mi cuenta?
✅ **Sí**. Ve a **Perfil** → **Ajustes** → **Eliminar cuenta**.

⚠️ **Importante**: Esto eliminará **todos tus datos** de forma permanente (viajes, documentos, gastos). No es reversible.

### ¿Puedo usar Viatio en varios dispositivos?
✅ **Sí**. Inicia sesión con la misma cuenta en varios dispositivos:
- Viajes **privados**: se almacenan localmente en cada dispositivo (no se sincronizan automáticamente)
- Viajes **compartidos**: se sincronizan automáticamente entre dispositivos

---

## Viajes y organización

### ¿Cuántos viajes puedo crear?
- **Plan Free**: 🚀 por definir (ej: 5 viajes activos)
- **Plan Premium**: ilimitados

### ¿Qué es un "viaje activo" vs "archivado"?
- **Activo**: viaje actual o futuro (visible en pantalla principal)
- **Archivado**: viaje pasado (guardado pero no visible en lista principal)

Puedes archivar viajes manualmente o automáticamente tras finalizar.

### ¿Puedo crear viajes pasados (para registro)?
✅ **Sí**. Puedes crear un viaje con fechas pasadas para documentar viajes anteriores.

### ¿Puedo duplicar un viaje?
🚀 **Roadmap**. Próximamente podrás duplicar viajes para reutilizar plantillas (ej: "Viaje a Madrid" anual).

### ¿Qué pasa si cambio las fechas de mi viaje?
Puedes editar las fechas en cualquier momento:
1. Ve al viaje
2. Toca **Editar viaje**
3. Cambia las fechas
4. Toca **Guardar**

Las reservas y eventos se mantienen. Si quieres reorganizar automáticamente, el Asistente puede ayudarte.

### ¿Puedo exportar mi viaje completo?
- ✅ **Hoy**: exportación de gastos (CSV/Excel)
- 🚀 **Próximamente**: exportación de itinerario completo en PDF con mapa, reservas y agenda

---

## Reservas

### ¿Qué tipos de reservas puedo añadir?
- ✈️ **Vuelos**
- 🏨 **Hoteles / Alojamientos**
- 🍽️ **Restaurantes**
- 🎭 **Actividades** (tours, entradas, experiencias)
- 🚗 **Transporte** (trenes, buses, coches de alquiler)

### ¿Cómo funciona el escaneo de reservas con IA?
1. Haces una **foto o captura** de tu confirmación (email, PDF, boarding pass)
2. La IA de Viatio (Gemini) **analiza la imagen** y extrae datos clave:
   - Tipo de reserva
   - Fecha y hora
   - Origen y destino (si aplica)
   - Número de confirmación
   - Proveedor (aerolínea, hotel, etc.)
3. **Revisas** los datos extraídos
4. **Guardas** con un clic

**Precisión**: ~90% en confirmaciones estándar. Siempre puedes corregir manualmente.

**Referencia verificada**: backend `/api/extract-reserva`

### ¿El escaneo funciona con cualquier idioma?
✅ **Sí**, Gemini soporta múltiples idiomas. Hemos probado con:
- Español, Inglés, Francés, Alemán, Italiano, Portugués

### ¿Puedo editar una reserva después de crearla?
✅ **Sí**. Toca la reserva → **Editar** → Modifica lo que necesites → **Guardar**.

### ¿Puedo vincular un gasto a una reserva?
✅ **Sí**. Al crear un gasto, puedes seleccionar **Vincular a reserva**. Esto te ayuda a:
- Ver cuánto costó cada reserva
- Generar informes de gastos por categoría

### ¿Las reservas se ordenan automáticamente?
✅ **Sí**, por fecha y hora. Viatio organiza tu itinerario cronológicamente.

---

## Documentos

### ¿Qué documentos puedo subir?
- 📄 **PDFs**: billetes, confirmaciones, seguros, visas
- 🖼️ **Imágenes**: JPG, PNG (capturas, fotos de pasaporte)
- 📎 **Otros**: cualquier archivo hasta **10MB por documento**

### ¿Hay límite de documentos por viaje?
- **Plan Free**: 🚀 por definir (ej: 20 documentos por viaje)
- **Plan Premium**: ilimitados

### ¿Los documentos se guardan en la nube?
- **Viajes privados**: documentos almacenados **solo en tu dispositivo** (offline)
- **Viajes compartidos**: documentos subidos a **Firebase Storage** (nube) y sincronizados con todos los miembros

### ¿Puedo acceder a documentos sin internet?
✅ **Sí**, siempre. Los documentos se descargan automáticamente a tu dispositivo y están disponibles offline.

### ¿Qué pasa si elimino un documento?
- **Viaje privado**: se elimina de tu dispositivo
- **Viaje compartido**: se elimina de la nube y de todos los dispositivos del grupo

⚠️ **No es reversible**. Asegúrate antes de eliminar.

### ¿Puedo organizar documentos por categorías?
✅ **Sí**. Al subir un documento, puedes asignarlo a una categoría:
- Billetes
- Confirmaciones
- Seguros
- Visas
- Otros

---

## Gastos y presupuesto

### ¿Cómo registro un gasto?
1. Ve a **Gastos** → **+ Añadir gasto**
2. Introduce monto, divisa y categoría
3. Opcionalmente: vincula a reserva, añade notas
4. **Guardar**

Tarda **10 segundos**.

### ¿Puedo usar diferentes divisas?
✅ **Sí**. Viatio soporta **150+ divisas** con conversión automática a tu divisa preferida.

Usa la API de Frankfurter para tasas de cambio actualizadas diariamente.

**Referencia verificada**: `viatio-app/src/services/currency.ts`

### ¿Cómo funciona la conversión de divisas?
1. Registras un gasto en **USD** (ej: $100)
2. Tu divisa preferida es **EUR**
3. Viatio convierte automáticamente: $100 = €92 (tasa del día)
4. Todos los totales se muestran en EUR

### ¿Puedo configurar un presupuesto para mi viaje?
✅ **Sí**. Al crear o editar un viaje, introduce el presupuesto total (ej: €2.500).

Viatio te muestra:
- **Gastado**: €1.200 / €2.500 (48%)
- **Restante**: €1.300
- **Alerta** si superas el 75% del presupuesto

### ¿Puedo ver gastos por categoría?
✅ **Sí**. En **Gastos**, toca **Ver por categoría** para ver:
- Alojamiento: €800 (32%)
- Comida: €400 (16%)
- Transporte: €300 (12%)
- Actividades: €200 (8%)

### ¿Puedo exportar mis gastos?
✅ **Sí** (implementado). Ve a **Gastos** → **Exportar** → Selecciona formato:
- **CSV**: para Excel / Google Sheets
- **PDF**: informe visual

**Referencia verificada**: `viatio-app/src/screens/ExpensesScreen.tsx`

### ¿Cómo funciona el reparto de gastos en viajes compartidos?
1. Al añadir un gasto, selecciona **Dividir entre** → Selecciona personas
2. Viatio calcula automáticamente quién debe a quién
3. Ve a **Liquidaciones** para ver balances:
   - María debe €150 a Carlos
   - Carlos debe €50 a Ana
4. Cuando alguien paga, registra la **liquidación** → balances actualizados

**Referencia verificada**: `viatio-app/src/screens/shared/SharedExpensesScreen.tsx`, `RecordSettlementScreen.tsx`

---

## Viajes compartidos

### ¿Qué es un viaje compartido?
Un viaje sincronizado en tiempo real entre varias personas. Todos los miembros ven lo mismo y pueden:
- Añadir/editar reservas
- Subir documentos
- Registrar gastos
- Organizar la agenda

### ¿Cómo comparto un viaje?
1. Ve al viaje → **Compartir viaje**
2. La app genera un **código de invitación** (ej: ABC123)
3. Comparte el código con tu grupo (WhatsApp, email, etc.)
4. Los invitados:
   - Abren Viatio
   - **Unirse con código** → Introducen ABC123
   - ¡Dentro!

➡️ [Ver guía detallada](./03_GUIA_RAPIDA.md#paso-9-comparte-tu-viaje)

### ¿Cuántas personas pueden unirse a un viaje compartido?
- **Plan Free**: 🚀 por definir (ej: 5 personas)
- **Plan Premium**: ilimitadas

### ¿Puedo expulsar a alguien de un viaje compartido?
✅ **Sí** (si eres el creador del viaje). Ve a **Miembros** → Selecciona la persona → **Eliminar**.

### ¿Qué pasa si alguien elimina algo en un viaje compartido?
Se elimina para **todos** (sincronización en tiempo real). Usa con cuidado.

### ¿Puedo convertir un viaje compartido en privado?
🚀 **Roadmap**. Actualmente, una vez compartido, no puedes revertirlo. Próximamente añadiremos esta opción.

### ¿Necesito que todos tengan Viatio para compartir?
✅ **Sí**. Los miembros deben tener la app instalada y una cuenta creada.

### ¿Los cambios se sincronizan en tiempo real?
✅ **Sí**, si tienes internet. Si estás offline:
- Los cambios se guardan **localmente**
- Cuando recuperes conexión, se **sincronizan automáticamente**

---

## Mapas y lugares

### ¿Cómo funciona el mapa?
El mapa muestra:
- 📍 **Reservas** (hoteles, restaurantes, actividades)
- 📍 **Lugares guardados** (puntos de interés personalizados)
- 🗺️ **Rutas diarias** (conectando lugares del mismo día)

### ¿Puedo marcar lugares personalizados?
✅ **Sí**. En **Mapa** → **+ Añadir lugar** → Busca o marca en el mapa → Añade nombre y notas.

### ¿El mapa funciona offline?
⚠️ **Parcialmente**:
- ✅ Marcadores y lugares: visibles offline
- ❌ Mapa base: necesitas internet (usa cache de Google Maps)
- 🚀 **Próximamente**: mapas offline completos

### ¿Puedo obtener direcciones desde el mapa?
✅ **Sí**. Toca un lugar → **Cómo llegar** → Se abre Google Maps con direcciones.

### ¿Las rutas diarias se crean automáticamente?
🚀 **Roadmap**. Actualmente debes marcar lugares manualmente. Próximamente, Viatio creará rutas optimizadas automáticamente según tu itinerario.

---

## Asistente de IA

### ¿Qué es el Copilot?
El **Copilot** es tu asistente inteligente que analiza tu viaje y te ayuda con:
- ✅ Resúmenes del itinerario
- ✅ Optimización de rutas
- ✅ Sugerencias de actividades
- ✅ Respuestas a preguntas sobre tu viaje

**Referencia verificada**: `viatio-app/src/services/ai/copilot.ts`

### ¿Qué puedo preguntarle al Copilot?
Ejemplos:
- "Resume mi itinerario de mañana"
- "¿Cuánto he gastado en alojamiento?"
- "Sugiere optimizaciones para el día 3"
- "¿Qué lugares están cerca de mi hotel?"
- "¿Voy dentro de presupuesto?"

### ¿El Copilot funciona offline?
❌ **No**. Necesitas internet para usar el asistente (se conecta al backend de IA).

### ¿El Copilot ve mis datos privados?
✅ **Sí**, pero **solo para procesar tu solicitud**. Los datos no se almacenan ni se usan para entrenar modelos.

➡️ [Ver privacidad completa](./05_PRIVACIDAD_RESUMEN.md)

### ¿Cuántas consultas puedo hacer al Copilot?
- **Plan Free**: 🚀 por definir (ej: 10 consultas/mes)
- **Plan Premium**: ilimitadas

---

## Modo offline y sincronización

### ¿Cómo funciona el modo offline?
Viatio es **offline-first**:
- Todos tus datos se almacenan en **SQLite local** (en tu dispositivo)
- Puedes consultar, añadir y editar **sin internet**
- Cuando recuperes conexión, los cambios se **sincronizan automáticamente** (solo en viajes compartidos)

**Referencia verificada**: `viatio-app/src/database/`

### ¿Qué funciona offline?
✅ Consultar viajes, reservas, documentos, gastos, agenda
✅ Añadir/editar reservas, gastos, eventos
✅ Ver mapas (si están en cache)

### ¿Qué NO funciona offline?
❌ Sincronizar viajes compartidos
❌ Usar el asistente de IA
❌ Escanear reservas con IA
❌ Conversión de divisas en tiempo real (usa última tasa conocida)

### ¿Cómo sé si estoy sincronizado?
En **Viajes compartidos**, verás un icono:
- ✅ **Verde**: sincronizado
- ⏳ **Amarillo**: sincronizando
- ❌ **Rojo**: sin conexión (cambios pendientes)

### ¿Qué pasa si 2 personas editan lo mismo offline?
Viatio usa **resolución de conflictos**:
- Prioridad: última modificación gana
- 🚀 **Próximamente**: resolución inteligente con merge de cambios

---

## Privacidad y datos

### ¿Dónde se almacenan mis datos?
- **Viajes privados**: solo en **tu dispositivo** (SQLite local)
- **Viajes compartidos**: sincronizados con **Firebase/Firestore** (nube segura de Google)

### ¿Viatio vende mis datos?
❌ **No**. Nunca vendemos datos personales ni de viaje a terceros.

### ¿Viatio muestra publicidad?
❌ **No**. Viatio no tiene publicidad.

### ¿Quién puede ver mis viajes?
- **Viajes privados**: solo tú
- **Viajes compartidos**: solo los miembros invitados

Viatio **no tiene perfiles públicos ni redes sociales**.

### ¿Puedo exportar todos mis datos?
✅ **Sí** (implementado parcialmente):
- Hoy: exportación de gastos
- 🚀 Próximamente: exportación completa de viajes (GDPR compliance)

### ¿Puedo eliminar todos mis datos?
✅ **Sí**. Eliminar cuenta → elimina **todos tus datos** de Viatio (viajes, documentos, gastos).

➡️ **Más detalles**: [Privacidad completa](./05_PRIVACIDAD_RESUMEN.md)

---

## Pricing y planes

### ¿Cuánto cuesta Viatio?
Viatio tiene **3 planes**:
1. **Free**: funcionalidades core gratuitas
2. **Lite** (🚀 propuesto: €4.99/mes): exportación, backup, sin límites
3. **Pro** (🚀 propuesto: €9.99/mes): colaboración ilimitada, IA avanzada, soporte prioritario

➡️ **Ver comparativa completa**: [Pricing detallado](./06_PRICING_PROPUESTO.md)

### ¿Hay trial gratuito del plan Premium?
🚀 **Próximamente**: 14 días de prueba gratuita del plan Pro.

### ¿Puedo cancelar mi suscripción en cualquier momento?
✅ **Sí**, sin compromiso. Cancela desde **Perfil** → **Suscripción** → **Cancelar**.

Seguirás teniendo acceso hasta el final del periodo pagado.

### ¿Hay descuentos para estudiantes o familias?
🚀 **En roadmap**. Planes familiares y descuentos educativos próximamente.

---

## Soporte técnico

### ¿Dónde encuentro ayuda?
1. **Esta FAQ** (la mayoría de dudas están aquí)
2. **Ayuda en app**: Ve a **Perfil** → **Ayuda**
3. **Email de soporte**: [por definir]

### ¿Viatio tiene chat de soporte?
🚀 **Próximamente** en planes Premium.

### ¿Cómo reporto un bug?
Ve a **Perfil** → **Ayuda** → **Reportar problema** → Describe el bug con capturas si es posible.

### ¿Cómo sugiero una nueva funcionalidad?
Igual que bugs: **Perfil** → **Ayuda** → **Sugerir funcionalidad**.

### ¿Hay comunidad de usuarios?
🚀 **Próximamente**: Discord/Telegram para usuarios avanzados y early adopters.

---

## Más preguntas

**¿No encuentras lo que buscas?**

➡️ [Guía rápida](./03_GUIA_RAPIDA.md) — Tutorial paso a paso
➡️ [Casos de uso](./02_CASOS_DE_USO.md) — Ejemplos reales
➡️ [Privacidad](./05_PRIVACIDAD_RESUMEN.md) — Datos y seguridad
➡️ [Pricing](./06_PRICING_PROPUESTO.md) — Planes y precios

O contacta con soporte: **Perfil** → **Ayuda** en la app.

---

**Viatio — Menos apps, menos fricción, más viaje.**
