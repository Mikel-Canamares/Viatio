# Pricing — Planes y precios de Viatio

**Estado**: 🚀 **Propuesta** — Pricing sujeto a validación de mercado antes del lanzamiento.

Este documento propone una estructura de pricing basada en:
- Valor entregado por cada plan
- Comparación con competencia (TripIt, Wanderlog, Splitwise)
- Lógica de freemium y conversión
- Costes estimados de operación (IA, Firebase, Google APIs)

---

## Filosofía de pricing

**Viatio monetiza con suscripciones, no con tus datos.**

- ✅ Plan **Free** generoso para probar el valor real
- ✅ Plan **Lite** para viajeros frecuentes que quieren más límites
- ✅ Plan **Pro** para grupos y power users con IA ilimitada
- ❌ **Sin publicidad** (nunca)
- ❌ **Sin venta de datos** (nunca)

---

## Comparativa de planes

| Funcionalidad | Free | Lite | Pro |
|---------------|------|------|-----|
| **Viajes activos** | 3 | 10 | Ilimitados |
| **Viajes archivados** | Ilimitados | Ilimitados | Ilimitados |
| **Reservas por viaje** | 20 | 50 | Ilimitadas |
| **Documentos por viaje** | 10 (max 10MB total) | 30 (max 50MB total) | Ilimitados (max 500MB total) |
| **Escaneo de reservas con IA** | 5/mes | 20/mes | Ilimitado |
| **Gastos por viaje** | Ilimitados | Ilimitados | Ilimitados |
| **Conversión de divisas** | ✅ | ✅ | ✅ |
| **Viajes compartidos** | 1 activo (max 3 personas) | 3 activos (max 5 personas) | Ilimitados (personas ilimitadas) |
| **Sincronización en tiempo real** | ✅ | ✅ | ✅ |
| **Modo offline** | ✅ | ✅ | ✅ |
| **Mapas y lugares** | ✅ | ✅ | ✅ |
| **Notificaciones** | ✅ | ✅ | ✅ (+ notificaciones smart) |
| **Asistente de IA (Copilot)** | 10 consultas/mes | 50 consultas/mes | Ilimitado |
| **Exportación de gastos** | ✅ CSV básico | ✅ CSV/Excel avanzado | ✅ CSV/Excel/PDF con gráficos |
| **Exportación de itinerarios** | ❌ | ✅ PDF básico | ✅ PDF premium con mapa |
| **Backup automático en la nube** | ❌ | ✅ | ✅ |
| **Historial de versiones** | ❌ | ❌ | ✅ (recuperar cambios) |
| **Soporte** | FAQ/email (48h) | Email prioritario (24h) | Chat prioritario (4h) |
| **Widgets home screen** | ❌ | ✅ | ✅ |
| **Temas personalizados** | ❌ | ❌ | ✅ |
| **Integraciones futuras** | ❌ | ✅ Básicas | ✅ Todas |
| **Precio** | **Gratis** | **€4.99/mes** o **€49/año** | **€9.99/mes** o **€99/año** |

---

## Detalles de cada plan

### 🆓 Plan Free — Empieza sin compromiso

**Para quién**: Viajeros ocasionales (1–2 viajes/año) que quieren probar Viatio.

#### Qué incluye
- ✅ **3 viajes activos** (suficiente para viajes actuales + próximos)
- ✅ **20 reservas por viaje** (cubre viajes estándar de 7–10 días)
- ✅ **10 documentos por viaje** (billetes esenciales)
- ✅ **Gastos ilimitados** (control de presupuesto completo)
- ✅ **1 viaje compartido** con hasta 3 personas (pareja + 1 amigo)
- ✅ **5 escaneos de IA/mes** (probar el valor del escaneo inteligente)
- ✅ **10 consultas al Copilot/mes** (experimentar con el asistente)
- ✅ **Modo offline** completo
- ✅ **Mapas y lugares**
- ✅ **Exportación básica de gastos** (CSV)

#### Limitaciones
- ❌ Solo 3 viajes activos (pero archivados ilimitados)
- ❌ Viajes compartidos: solo 1 activo y máximo 3 personas
- ❌ Sin backup automático en la nube (datos solo en dispositivo para viajes privados)
- ❌ Sin exportación de itinerarios en PDF

#### Precio
**Gratis** para siempre.

#### Conversión esperada
- **Objetivo**: 60% de usuarios en Free
- **Conversión a Lite**: 25% tras 2–3 viajes
- **Conversión a Pro**: 15% (grupos grandes o power users)

---

### 💎 Plan Lite — Para viajeros frecuentes

**Para quién**: Viajeros frecuentes (3–6 viajes/año), parejas, pequeños grupos.

#### Qué añade sobre Free
- ✅ **10 viajes activos** (múltiples viajes simultáneos)
- ✅ **50 reservas por viaje** (viajes largos o multi-destino)
- ✅ **30 documentos por viaje** (toda la documentación necesaria)
- ✅ **3 viajes compartidos** activos con hasta 5 personas cada uno
- ✅ **20 escaneos de IA/mes** (automatización real)
- ✅ **50 consultas al Copilot/mes** (asistente útil)
- ✅ **Backup automático** de viajes privados en Firebase
- ✅ **Exportación de itinerarios** en PDF básico (agenda + reservas)
- ✅ **Exportación avanzada de gastos** (Excel con gráficos)
- ✅ **Widgets** para home screen (próximo viaje a un toque)
- ✅ **Soporte prioritario** (email en 24h)

#### Casos de uso típicos
- Pareja que viaja 4 veces/año (2 vacaciones + 2 escapadas)
- Familia con 2 viajes principales + escapadas de fin de semana
- Viajero de trabajo + ocio (múltiples viajes simultáneos)

#### Precio
- **€4.99/mes** (facturado mensualmente)
- **€49/año** (ahorro de **17%** vs mensual)

#### Por qué este precio
- **Comparativa mercado**:
  - TripIt Pro: $49/año (€45)
  - Wanderlog Pro: $5/mes
  - Splitwise Pro: $3/mes
- **Valor entregado**: Viatio = TripIt + Wanderlog + Splitwise + IA
- **Posicionamiento**: Precio competitivo para viajeros frecuentes

---

### 🚀 Plan Pro — Para grupos y power users

**Para quién**: Grupos grandes, viajeros muy frecuentes, power users, profesionales del viaje.

#### Qué añade sobre Lite
- ✅ **Viajes ilimitados** (activos + archivados)
- ✅ **Reservas ilimitadas** por viaje
- ✅ **Documentos ilimitados** (hasta 500MB totales)
- ✅ **Viajes compartidos ilimitados** con personas ilimitadas
- ✅ **Escaneo de IA ilimitado** (automatización total)
- ✅ **Copilot ilimitado** (asistente siempre disponible)
- ✅ **Exportación premium** de itinerarios (PDF con mapa, fotos, diseño profesional)
- ✅ **Historial de versiones** (recuperar cambios de los últimos 30 días)
- ✅ **Notificaciones inteligentes** (optimización de tiempo, alertas proactivas)
- ✅ **Temas personalizados** (dark mode, colores, fuentes)
- ✅ **Integraciones prioritarias** (Booking.com, AirBnB, etc. → 🚀 roadmap)
- ✅ **Soporte prioritario** (chat en menos de 4h)
- ✅ **Acceso anticipado** a nuevas funcionalidades (beta features)

#### Casos de uso típicos
- Grupos grandes (10+ personas) organizando viajes complejos
- Viajeros profesionales (nómadas digitales, travel bloggers)
- Organizadores de viajes frecuentes (agencias pequeñas, comunidades)
- Power users que quieren cero límites

#### Precio
- **€9.99/mes** (facturado mensualmente)
- **€99/año** (ahorro de **17%** vs mensual)

#### Por qué este precio
- **Comparativa mercado**:
  - TripIt Pro: $49/año (€45) — Viatio Pro = **2.2x** pero con **5x más valor**
  - Notion: $10/mes (similar complejidad)
  - Profesionales pagan mucho más por herramientas de organización (Asana, Monday.com)
- **Valor entregado**:
  - IA ilimitada (coste real para nosotros: ~€3–5/usuario/mes en API Gemini)
  - Sincronización ilimitada (coste Firebase: ~€1–2/usuario/mes)
  - Margen saludable para reinvertir en producto
- **Posicionamiento**: Premium pero accesible

---

## Descuentos y promociones

### 🎓 Descuento estudiantes
- **30% de descuento** en planes Lite y Pro
- Verificación con email educativo (.edu, .ac.uk, etc.)
- 🚀 **Roadmap** (no implementado aún)

### 👨‍👩‍👧‍👦 Plan familiar
- **€14.99/mes** (o €149/año) para hasta 5 cuentas Pro
- Ahorro de **50%** vs 5 suscripciones individuales
- 🚀 **Roadmap** (no implementado aún)

### 🎁 Trial gratuito
- **14 días gratis** de plan Pro al registrarte
- Sin necesidad de tarjeta de crédito
- Al terminar, puedes elegir: Free, Lite o Pro
- 🚀 **Roadmap** (no implementado aún)

### 🏷️ Promociones de lanzamiento
- **Early adopters** (primeros 1.000 usuarios): **50% de descuento** de por vida
- **Referidos**: 1 mes gratis de Pro por cada amigo que se suscriba
- 🚀 **Roadmap** (no implementado aún)

---

## Comparación con la competencia

| Producto | Precio | Qué ofrece | Viatio equivalente |
|----------|--------|------------|-------------------|
| **TripIt Pro** | $49/año (~€45) | Itinerarios + alertas + mapas | Lite (€49/año) |
| **Wanderlog Pro** | $60/año (~€55) | Itinerarios + mapas colaborativos | Lite (€49/año) |
| **Splitwise Pro** | $36/año (~€33) | Gastos compartidos avanzados | Incluido en Free |
| **Google Travel** | Gratis | Itinerarios básicos (solo Google) | Free + mucho más |
| **Notion** | $10/mes (~€120/año) | Organización flexible | Pro (€99/año) con IA específica para viajes |

**Conclusión**: Viatio ofrece **más valor** a **precio competitivo** vs herramientas individuales.

Si usas TripIt Pro + Splitwise Pro + Notion = **~€200/año** → Viatio Pro = **€99/año** (ahorro de 50%).

---

## Lógica de valor — ¿Por qué pagar por Viatio?

### ¿Qué valor recibes con Lite (€49/año)?

Comparado con el **coste de un solo viaje mal organizado**:
- ❌ Perder una reserva de hotel (€100–200 perdidos)
- ❌ Olvidar una actividad ya pagada (€30–50 perdidos)
- ❌ Descontrol de gastos → sobrepasas presupuesto (€200–500 extras)
- ❌ Tiempo perdido buscando confirmaciones (5h → valoradas en ~€100 si trabajas)

**Total de fricción en 1 viaje**: **€400–850 perdidos o mal usados**

Viatio Lite (€49/año) = **12% del coste** de un solo error grave.

Si viajas 4 veces/año → **€12/viaje** → menos que una cerveza en el aeropuerto.

### ¿Qué valor recibes con Pro (€99/año)?

Para grupos de 6 personas:
- **€99/año ÷ 6 = €16.5/persona/año**
- Si hacen 2 viajes/año juntos = **€8.25/persona/viaje**

Comparado con:
- ❌ 2 horas de WhatsApp coordinando gastos (valorado en €40–60/persona)
- ❌ Discusiones por gastos mal apuntados (fricción relacional = invaluable)
- ❌ Tiempo de un organizador haciendo Excel de gastos (3–5h = €60–100)

**ROI claro**: El plan Pro se paga solo con el **tiempo y fricción** que ahorras.

---

## Costes estimados para Viatio (transparencia)

**Por qué necesitamos cobrar**:

| Coste | Free/usuario/mes | Lite/usuario/mes | Pro/usuario/mes |
|-------|------------------|------------------|-----------------|
| Firebase (sync + storage) | ~€0.10 | ~€0.50 | ~€2.00 |
| Gemini API (IA) | ~€0.50 | ~€1.50 | ~€5.00 |
| Google Maps/Places API | ~€0.20 | ~€0.50 | ~€1.00 |
| Infraestructura (backend) | ~€0.10 | ~€0.30 | ~€0.50 |
| **Total coste variable** | **~€0.90** | **~€2.80** | **~€8.50** |
| **Ingreso** | €0 | €4.99 | €9.99 |
| **Margen bruto** | **-€0.90** | **+€2.19** | **+€1.49** |

**Conclusión**:
- **Free es subsidiado** por Lite y Pro (modelo freemium clásico)
- **Lite tiene margen saludable** (44%)
- **Pro tiene margen ajustado** (15%) porque el usuario consume mucha IA

**Sostenibilidad**: Necesitamos ~40% de usuarios en planes de pago para ser rentables.

---

## Preguntas frecuentes sobre pricing

### ¿Puedo cambiar de plan en cualquier momento?
✅ **Sí**. Upgrades son inmediatos. Downgrades se aplican al final del periodo de facturación actual.

### ¿Qué pasa si bajo de Lite a Free y tengo más de 3 viajes?
Tus viajes **no se eliminan**, pero no podrás crear nuevos hasta que archives o elimines viajes existentes.

### ¿Hay compromiso de permanencia?
❌ **No**. Cancela cuando quieras. Sin penalizaciones.

### ¿Puedo probar Pro antes de pagar?
✅ **Sí** (🚀 roadmap): 14 días de trial gratis.

### ¿Hay descuentos por pagar anual?
✅ **Sí**: 17% de descuento en planes anuales vs mensuales.

### ¿Los precios incluyen IVA?
⚠️ **Depende de tu país**:
- UE: precios + IVA aplicable (21% en España)
- Fuera UE: precios finales sin IVA

### ¿Aceptáis otras formas de pago además de tarjeta?
- ✅ **Hoy**: Tarjeta de crédito/débito (Stripe)
- 🚀 **Próximamente**: PayPal, Apple Pay, Google Pay

### Si cancelo, ¿pierdo mis datos?
❌ **No**. Tus datos se mantienen en el plan Free. Si tenías más de 3 viajes, siguen ahí (pero no puedes crear nuevos hasta que archives).

### ¿Hay reembolsos?
✅ **Sí**, durante los primeros **14 días** de cualquier suscripción (garantía de satisfacción).

---

## Roadmap de pricing

### Próximos 6 meses
- ✅ Implementar sistema de suscripciones (Stripe)
- ✅ Trial de 14 días
- ✅ Descuentos por referidos

### Próximos 12 meses
- 🚀 Plan familiar
- 🚀 Descuento estudiantes
- 🚀 Plan Business (para agencias pequeñas)
- 🚀 Lifetime deal (pago único de €299 para early adopters)

---

## Resumen — ¿Qué plan elegir?

| Perfil | Plan recomendado | Por qué |
|--------|------------------|---------|
| **Viajo 1–2 veces/año, solo o en pareja** | **Free** | Suficiente para probar y cubrir necesidades básicas |
| **Viajo 3–6 veces/año, en pareja o grupos pequeños** | **Lite** | Backup en la nube, exportación de itinerarios, más límites |
| **Viajo 6+ veces/año o en grupos grandes (6+)** | **Pro** | IA ilimitada, sin límites, soporte prioritario |
| **Organizo viajes para otros (agencias, comunidades)** | **Pro** (o Business 🚀 futuro) | Herramientas profesionales |
| **Quiero probar sin compromiso** | **Free + trial Pro 14 días** | Experimenta el valor completo antes de decidir |

---

## Call to Action

### Empieza gratis hoy
1. **Descarga Viatio** (App Store / Play Store)
2. **Crea tu cuenta** (email o Google)
3. **Organiza tu primer viaje** en 5 minutos
4. **Decide después** si quieres más funciones con Lite o Pro

**Sin tarjeta de crédito. Sin compromiso. Sin trucos.**

➡️ [Volver al overview](./01_OVERVIEW_PARA_USUARIOS.md) | [FAQ](./04_FAQ.md) | [Guía rápida](./03_GUIA_RAPIDA.md)

---

**Última actualización**: 2026-01-21
**Versión**: 1.0 (propuesta pre-lanzamiento)

⚠️ **Nota importante**: Este pricing es una **propuesta** sujeta a validación con usuarios beta. Los precios y límites finales pueden variar según feedback de mercado.

**Viatio — Invierte en tu viaje, no en el caos.**
