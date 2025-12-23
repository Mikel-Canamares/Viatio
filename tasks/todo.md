# Sistema de Categorías Centralizado

## ✅ Implementación completada

Se ha creado un sistema centralizado de categorías, colores e iconos para mantener coherencia visual en toda la aplicación.

### 📋 Archivos modificados

#### 1. **Nuevo archivo centralizado**
- `src/config/categories.ts` - Sistema maestro de categorías

#### 2. **Types actualizados**
- `src/types/reserva.ts` - Ahora importa del sistema centralizado
- `src/types/evento.ts` - Colores unificados para eventos
- `src/types/lugar.ts` - Marcadores de mapa con colores consistentes
- `src/types/gasto.ts` - Categorías de gastos alineadas
- `src/types/documento.ts` - Incluye categorías especiales (identidad, seguro)

#### 3. **Componentes actualizados**
- `src/components/CategoryBadge.tsx` - Usa sistema centralizado
- `src/components/EventoCategoriaSelector.tsx` - Comentario actualizado

### 🎨 Paleta de colores unificada

| Categoría | Color | Uso |
|-----------|-------|-----|
| **Transporte** | `#0066CC` (Azul) | Vuelos, trenes, autobuses, taxis |
| **Alojamiento** | `#16A34A` (Verde) | Hoteles, apartamentos, camping |
| **Comida** | `#EA580C` (Naranja) | Restaurantes, comida |
| **Actividades** | `#8B5CF6` (Púrpura) | Turismo, cultura, deportes, naturaleza |
| **Compras** | `#EC4899` (Rosa) | Compras |
| **Otros** | `#6B7280` (Gris) | Categoría genérica |
| **Identidad** | `#3B82F6` (Azul claro) | Solo documentos |
| **Seguro** | `#7C3AED` (Púrpura oscuro) | Solo documentos |

### 🏗️ Estructura jerárquica

```
CATEGORÍAS BASE
├─ transport (Transporte)
│  ├─ plane (Avión)
│  ├─ train (Tren)
│  ├─ bus (Autobús)
│  ├─ ferry (Ferry)
│  ├─ taxi (Taxi)
│  └─ car (Coche)
│
├─ accommodation (Alojamiento)
│  ├─ hotel (Hotel)
│  ├─ aparthotel (Apartahotel)
│  ├─ apartment (Apartamento)
│  ├─ room (Habitación)
│  └─ camping (Camping)
│
├─ food (Comida)
│  └─ restaurant (Restaurante)
│
├─ activity (Actividades)
│  ├─ sightseeing (Turismo)
│  ├─ culture (Cultura)
│  ├─ sports (Deportes)
│  ├─ nature (Naturaleza)
│  ├─ entertainment (Ocio)
│  ├─ nightlife (Noche)
│  └─ relaxation (Descanso)
│
├─ shopping (Compras)
└─ other (Otros)
```

### 🔧 Funciones helper disponibles

```typescript
// Obtener configuración completa
getCategoryConfig(category: CategoryBase): CategoryConfig

// Obtener solo el color
getCategoryColor(category: CategoryBase): string

// Obtener solo el icono
getCategoryIcon(category: CategoryBase): keyof typeof Ionicons.glyphMap

// Subcategorías
getTransportSubtypeConfig(subtype: TransportSubtype)
getAccommodationSubtypeConfig(subtype: AccommodationSubtype)
getActivitySubtypeConfig(subtype: ActivitySubtype)

// Mapeo entre formatos
mapCategoryToSpanish(category: CategoryBase): CategoriaGasto
mapSpanishToCategory(category: CategoriaGasto): CategoryBase
mapLugarToCategory(lugarCat: CategoriaLugar): CategoryBase
mapDocumentoToCategory(docCat: CategoriaDocumento): CategoryBase | 'identity' | 'insurance'
```

### ✨ Beneficios

1. ✅ **Coherencia visual** - Mismo color para cada categoría en todos los módulos
2. ✅ **Mantenimiento simple** - Cambiar un color/icono en un solo lugar
3. ✅ **Escalabilidad** - Fácil añadir nuevas categorías o subcategorías
4. ✅ **Tipado fuerte** - TypeScript garantiza uso correcto
5. ✅ **Subcategorías preservadas** - Mantiene granularidad donde se necesita
6. ✅ **Experiencia de usuario** - Usuarios identifican categorías visualmente

### 📝 Cómo usar

```typescript
// Ejemplo: Obtener color de una categoría
import { getCategoryColor } from '@/config/categories';

const color = getCategoryColor('transport'); // '#0066CC'

// Ejemplo: Obtener configuración completa
import { BASE_CATEGORIES } from '@/config/categories';

const config = BASE_CATEGORIES.food;
// { label: 'Comida', labelShort: 'Comida', icon: 'restaurant',
//   color: '#EA580C', bgColor: 'rgba(...)', lightBg: '#FFEDD5' }

// Ejemplo: Usar en un componente
import { EVENTO_CATEGORIAS } from '@/types/evento';

const eventoConfig = EVENTO_CATEGORIAS['sightseeing'];
// Usa automáticamente el color de 'activity' (#8B5CF6)
```

### 🎯 Próximos pasos sugeridos

- [ ] Revisar visualmente en la app que los colores se vean bien
- [ ] Verificar que todos los iconos sean coherentes
- [ ] Considerar añadir más subcategorías si se necesitan
- [ ] Documentar en README principal si es necesario

---

## Review

### Resumen de cambios
- ✅ Creado sistema centralizado en `src/config/categories.ts`
- ✅ Actualizados todos los archivos de tipos para usar el sistema central
- ✅ Componentes principales actualizados (CategoryBadge, EventoCategoriaSelector)
- ✅ Compilación TypeScript exitosa sin errores
- ✅ Preservadas todas las subcategorías existentes
- ✅ Añadida categoría "shopping" que faltaba en algunos módulos

### Riesgos potenciales
- ⚠️ **Cambio visual**: Algunos colores pueden haber cambiado ligeramente (ej: eventos en calendario)
- ⚠️ **Testing**: Recomendable probar visualmente todas las pantallas que usan categorías
- ⚠️ **Migraciones**: Si hay datos antiguos con categorías, seguirán funcionando

### Impacto en la base de datos
- ✅ **Sin cambios en schema** - Los tipos de datos en SQLite siguen siendo los mismos
- ✅ **Compatible con datos existentes** - No se requiere migración

### 🔧 Correcciones de coherencia visual (23 dic 2025)

**Problema detectado:** Tras pruebas visuales, se encontraron inconsistencias en colores e iconos en varios componentes.

#### Archivos corregidos:

1. **[src/components/ReservationCard.tsx](../viatio-app/src/components/ReservationCard.tsx)**
   - ❌ Antes: `CATEGORIA_COLORS` hardcodeado con accommodation en rojo `#EF4444`
   - ✅ Ahora: Importa de `BASE_CATEGORIES`, accommodation en verde `#16A34A`

2. **[src/services/agendaService.ts](../viatio-app/src/services/agendaService.ts)**
   - ❌ Antes: `CATEGORIA_COLORS` hardcodeado con colores incorrectos
   - ✅ Ahora: Importa de `BASE_CATEGORIES` del sistema centralizado
   - **Impacto:** Corrige colores en Agenda y Calendario (dots de eventos)

3. **[src/components/CalendarDay.tsx](../viatio-app/src/components/CalendarDay.tsx)**
   - ❌ Antes: Importaba `CATEGORY_COLORS` de CategoryBadge
   - ✅ Ahora: Usa directamente `event.iconColor` (ya viene del sistema centralizado)

4. **[src/components/MapMarker.tsx](../viatio-app/src/components/MapMarker.tsx)**
   - ⚠️ Antes: Colores correctos pero hardcodeados
   - ✅ Ahora: Importa de `LUGAR_MARKER_COLORS` para centralización

#### Resultado final - Coherencia visual por pantalla:

| Pantalla | Estado Antes | Estado Ahora |
|----------|--------------|--------------|
| **Agenda** | ❌ Hotel en rojo | ✅ Hotel en verde #16A34A |
| **Reservas (lista)** | ❌ Alojamiento en rojo | ✅ Alojamiento en verde #16A34A |
| **Reservas (detalle)** | ❌ Badge rojo | ✅ Badge verde #16A34A |
| **Calendario (dots)** | ❌ Colores incorrectos | ✅ Verde para alojamiento |
| **Mapa** | ✅ Verde (correcto) | ✅ Verde (ahora centralizado) |
| **Gastos** | ✅ Verde (correcto) | ✅ Verde (mantiene centralizado) |

### Siguientes pasos recomendados
1. **Probar visualmente** todas las pantallas:
   - ✅ Pantalla de reservas
   - ✅ Calendario de eventos
   - ✅ Mapa con marcadores de lugares
   - ✅ Resumen de gastos
   - ✅ Lista de documentos

2. ✅ **Verificar** que los colores sean distinguibles entre sí

3. **Considerar** si algún icono necesita ajuste para mayor claridad

---

## 🔧 Correcciones finales - Formulario de edición y validaciones (23 dic 2025)

### Archivos corregidos:

1. **[EditReservationScreen.tsx](../viatio-app/src/screens/EditReservationScreen.tsx:136)**
   - ❌ Antes: Al cargar una reserva existente, NO se incluían los `metadatos`
   - ✅ Ahora: Línea 136 - Se incluye `metadatos: reservaData.metadatos`
   - **Impacto:** Ahora el formulario de edición pre-selecciona correctamente el subtipo (hotel, apartamento, avión, tren, etc.)

2. **[DocumentCard.tsx](../viatio-app/src/components/DocumentCard.tsx)**
   - ✅ Verificado: Ya usaba correctamente `DOCUMENTO_CATEGORIAS` del sistema centralizado (línea 80)
   - ✅ Los iconos de documentos son correctos desde el inicio

3. **[SavedPlacesAccordion.tsx](../viatio-app/src/components/SavedPlacesAccordion.tsx)**
   - ✅ Verificado: Usa `LUGAR_CATEGORIAS[categoria]` correctamente (línea 114)
   - ℹ️ **Nota arquitectural:** Los lugares (`Lugar`) no tienen subtipos como las reservas
   - ℹ️ Muestran el icono de categoría general (restaurant, hotel, attraction, shopping, transport, other)
   - ℹ️ Si un lugar está vinculado a una reserva, la reserva mostrará el icono específico del subtipo

### Resultado final - Estado del sistema:

| Módulo | Colores | Iconos | Subtipo en formulario |
|--------|---------|--------|----------------------|
| **Reservas (lista)** | ✅ Verde #16A34A | ✅ Específicos (business, home, etc.) | ✅ Se carga correctamente |
| **Reservas (detalle)** | ✅ Verde #16A34A | ✅ Específicos | N/A |
| **Agenda** | ✅ Verde #16A34A | ✅ Específicos | N/A |
| **Calendario (dots)** | ✅ Verde #16A34A | N/A | N/A |
| **Calendario (modal)** | ✅ Verde #16A34A | ✅ Específicos | N/A |
| **Mapa (marcadores)** | ✅ Verde #16A34A | ✅ Genéricos por diseño | N/A |
| **Mapa (lista lugares)** | ✅ Verde #16A34A | ✅ Genéricos (lugares no tienen subtipo) | N/A |
| **Gastos** | ✅ Verde #16A34A | ✅ Correcto | N/A |
| **Documentos** | ✅ Verde #16A34A | ✅ Correcto | N/A |
| **Formulario edición** | ✅ Correcto | ✅ Correcto | ✅ **CORREGIDO** |

### ✅ Problemas resueltos

1. ✅ Alojamiento en verde (#16A34A) en todos los módulos
2. ✅ Iconos específicos de subtipo en reservas (hotel → business, apartamento → home)
3. ✅ Iconos específicos en agenda y calendario
4. ✅ Formulario de edición ahora carga el subtipo seleccionado previamente
5. ✅ Sistema centralizado de colores e iconos funcionando en toda la app
6. ✅ TypeScript compilando sin errores

### 📝 Notas importantes

- **Lugares vs Reservas:** Los lugares (`Lugar`) son entidades independientes sin subtipo. Muestran iconos genéricos de categoría (restaurant, hotel, attraction, etc.). Las reservas vinculadas a esos lugares SÍ muestran el icono específico del subtipo.
- **Coherencia visual:** Todos los módulos ahora usan el mismo color para cada categoría, garantizando que el usuario identifique visualmente las categorías de forma consistente.

### 🎯 Sistema completamente funcional

El sistema de categorías centralizado está completamente implementado y funcionando correctamente en todos los módulos de la aplicación.

---

## 🔧 Correcciones FINALES - Iconos específicos en TODA la app (23 dic 2025)

**Problema:** Los iconos de subtipo (hotel → `business`, apartamento → `home`, etc.) NO se mostraban en lugares del mapa ni en gastos vinculados a reservas.

### Archivos corregidos:

1. **[TripMapScreen.tsx](../viatio-app/src/screens/TripMapScreen.tsx)**
   - Añadido estado `reservas` y carga con `getReservasByViajeId()`
   - Renombrado `loadLugares()` → `loadLugaresAndReservas()` para cargar ambos
   - Pasa `reservas` a `SavedPlacesAccordion`

2. **[SavedPlacesAccordion.tsx](../viatio-app/src/components/SavedPlacesAccordion.tsx)**
   - ✅ Ahora recibe `reservas: Reserva[]` como prop
   - ✅ Nueva función `getIconForLugar()` que busca si el lugar está vinculado a una reserva
   - ✅ Si está vinculado, usa el icono del **subtipo** de la reserva (hotel → `business`)
   - ✅ Si no está vinculado, usa el icono genérico de la categoría del lugar
   - ✅ Añadido icono circular individual a cada lugar en la lista

3. **[ExpensesScreen.tsx](../viatio-app/src/screens/ExpensesScreen.tsx)**
   - Añadido estado `reservas` y carga con `getReservasByViajeId()`
   - Pasa `reservas` a `ExpenseCategoryGroup`

4. **[ExpenseCategoryGroup.tsx](../viatio-app/src/components/ExpenseCategoryGroup.tsx)**
   - ✅ Ahora recibe `reservas: Reserva[]` como prop
   - ✅ Nueva función `getIconForGasto()` que busca si el gasto está vinculado a una reserva
   - ✅ Si está vinculado, usa el icono del **subtipo** de la reserva
   - ✅ Si no está vinculado, usa el icono genérico de la categoría del gasto
   - ✅ Añadido icono circular individual a cada gasto en la lista expandida

### Resultado FINAL - Coherencia de iconos en TODA la app:

| Módulo | Iconos | Lógica |
|--------|--------|--------|
| **Reservas (lista)** | ✅ Específicos | Usa subtipo de reserva |
| **Reservas (detalle)** | ✅ Específicos | Usa subtipo de reserva |
| **Agenda** | ✅ Específicos | Usa subtipo de reserva |
| **Calendario (modal)** | ✅ Específicos | Usa event.iconName (del subtipo) |
| **Mapa (lista lugares)** | ✅ **CORREGIDO** | Si lugar vinculado a reserva → icono del subtipo |
| **Gastos (lista expandida)** | ✅ **CORREGIDO** | Si gasto vinculado a reserva → icono del subtipo |
| **Documentos** | ✅ Correcto | Usa DOCUMENTO_CATEGORIAS |

### ✅ Problema COMPLETAMENTE resuelto

Ahora **TODOS** los componentes de la app:
1. ✅ Usan el **mismo color** para cada categoría (alojamiento → verde #16A34A)
2. ✅ Usan el **mismo icono específico** del subtipo en TODA la aplicación
3. ✅ Hotel Mediodía con subtipo "hotel" muestra el icono `business` en:
   - Lista de reservas
   - Detalle de reserva
   - Agenda
   - Calendario
   - **Mapa - lista de lugares guardados** ← CORREGIDO
   - **Gastos vinculados** ← CORREGIDO

### 📝 Arquitectura de la solución

**Patrón usado:**
1. Componentes que muestran entidades vinculadas a reservas (lugares, gastos) cargan las reservas
2. Función helper `getIconFor[Entity]()` busca la reserva vinculada
3. Si hay reserva vinculada → extrae el subtipo de `metadatos` → usa su icono específico
4. Si NO hay vinculación → usa icono genérico de categoría

**Ejemplo:**
```typescript
function getIconForLugar(lugar: Lugar, reservas: Reserva[]): string {
  const reservaVinculada = reservas.find(r => r.lugarId === lugar.id);

  if (reservaVinculada?.categoria === 'accommodation' &&
      reservaVinculada.metadatos?.subtipoAlojamiento) {
    return SUBTIPOS_ALOJAMIENTO[reservaVinculada.metadatos.subtipoAlojamiento].icon;
    // hotel → 'business', apartment → 'home', etc.
  }

  return LUGAR_CATEGORIAS[lugar.categoria].icon; // Fallback genérico
}
```

### 🎯 Compilación exitosa

✅ TypeScript compiló sin errores
✅ Todos los tipos correctos
✅ Sistema completamente coherente
