# Reemplazo de Alert.alert por CustomModal en Pantallas Shared

## Resumen
Se han reemplazado todos los `Alert.alert` nativos por el componente personalizado `CustomModal` en las 5 pantallas de la carpeta `screens/shared/`.

**Total de Alert.alert reemplazados: 9**

---

## Archivos Modificados

### 1. CreateSharedTripScreen.tsx

**Alerts reemplazados: 1**

| Tipo Original | Nuevo Modal | Línea Aprox |
|---------------|-------------|-------------|
| Success alert "Viaje creado" | `CustomModal` tipo `success` | 78 |

**Cambios**:
- Eliminado import de `Alert`
- Añadido import de `CustomModal`
- Añadidos estados: `showSuccessModal`, `createdTripId`
- Convertido alert de éxito en modal con navegación al pulsar botón

**Flujo**:
1. Usuario crea viaje
2. Se muestra `CustomModal` de éxito con el nombre del viaje
3. Al cerrar modal (o pulsar "Ir al viaje"), navega a `SharedTripDetail`

---

### 2. ExpenseDetailScreen.tsx

**Alerts reemplazados: 1**

| Tipo Original | Nuevo Modal | Línea Aprox |
|---------------|-------------|-------------|
| Confirmación destructiva "Eliminar gasto" | `CustomModal` tipo `warning` con botón destructivo | 118-138 |

**Cambios**:
- Eliminado import de `Alert`
- Añadido import de `CustomModal`
- Añadido estado: `showDeleteModal`
- Creada función `confirmDelete()` separada
- Modal con botón destructivo para eliminar

**Flujo**:
1. Usuario pulsa botón eliminar
2. Se muestra `CustomModal` de advertencia
3. Si confirma, ejecuta `confirmDelete()` y vuelve atrás

---

### 3. SharedTripDetailScreen.tsx

**Alerts reemplazados: 3**

| Tipo Original | Nuevo Modal | Línea Aprox |
|---------------|-------------|-------------|
| Info "No puedes salir" (propietario) | `CustomModal` tipo `info` | 106-110 |
| Confirmación "Salir del viaje" | `CustomModal` tipo `warning` destructivo | 114-132 |
| Confirmación "Eliminar viaje" | `CustomModal` tipo `warning` destructivo | 135-153 |

**Cambios**:
- Eliminado import de `Alert`
- Añadido import de `CustomModal`
- Añadidos estados: `showOwnerWarningModal`, `showLeaveModal`, `showDeleteModal`
- Creadas funciones: `confirmLeaveTrip()`, `confirmDeleteTrip()`
- 3 modales diferentes según la acción

**Flujo Owner Warning**:
1. Propietario intenta salir del viaje
2. Se muestra `CustomModal` informativo explicando que debe transferir propiedad
3. Usuario cierra modal (sin acción destructiva)

**Flujo Leave Trip**:
1. Usuario (no propietario) intenta salir
2. Se muestra `CustomModal` de advertencia
3. Si confirma, ejecuta `confirmLeaveTrip()` y vuelve atrás

**Flujo Delete Trip**:
1. Usuario con permisos pulsa eliminar
2. Se muestra `CustomModal` de advertencia con mensaje de irreversible
3. Si confirma, ejecuta `confirmDeleteTrip()` y vuelve atrás

---

### 4. TripMembersScreen.tsx

**Alerts reemplazados: 3**

| Tipo Original | Nuevo Modal | Línea Aprox |
|---------------|-------------|-------------|
| Confirmación "Cancelar invitación" | `CustomModal` tipo `warning` destructivo | 82-96 |
| Selector de rol con múltiples opciones | `Modal` personalizado con selector de roles | 107-122 |
| Confirmación "Eliminar miembro" | `CustomModal` tipo `warning` destructivo | 131-147 |

**Cambios**:
- Eliminado import de `Alert`
- Añadido import de `CustomModal`
- Añadidos estados:
  - `showCancelInviteModal`, `inviteToCancel`
  - `showChangeRoleModal`, `memberToChangeRole`, `newRole`
  - `showRemoveMemberModal`, `memberToRemove`
- Creadas funciones: `confirmCancelInvite()`, `confirmChangeRole()`, `confirmRemoveMember()`
- Modal de cambio de rol personalizado (no usa CustomModal por tener selector)

**Flujo Cancel Invite**:
1. Admin cancela invitación pendiente
2. Se muestra `CustomModal` de advertencia con email del invitado
3. Si confirma, ejecuta `confirmCancelInvite()`

**Flujo Change Role**:
1. Admin pulsa cambiar rol de un miembro
2. Se muestra `Modal` personalizado con selector de roles (admin/member/read_only)
3. Usuario selecciona nuevo rol y confirma
4. Ejecuta `confirmChangeRole()` y muestra toast de éxito

**Flujo Remove Member**:
1. Admin pulsa eliminar miembro
2. Se muestra `CustomModal` de advertencia con nombre del miembro
3. Si confirma, ejecuta `confirmRemoveMember()` y muestra toast de éxito

---

### 5. TripSettlementsScreen.tsx

**Alerts reemplazados: 1**

| Tipo Original | Nuevo Modal | Línea Aprox |
|---------------|-------------|-------------|
| Confirmación "Completar pago" | `CustomModal` tipo `success` | 151-166 |

**Cambios**:
- Eliminado import de `Alert`
- Añadido import de `CustomModal`
- Añadidos estados: `showCompleteModal`, `settlementToComplete`
- Creada función `confirmMarkComplete()`
- Modal de confirmación para marcar pago como completado

**Flujo**:
1. Usuario marca un pago como completado
2. Se muestra `CustomModal` de confirmación (tipo success porque es acción positiva)
3. Si confirma, ejecuta `confirmMarkComplete()` y actualiza balances

---

## Patrón de Implementación Usado

### Para alerts de confirmación simple:
```typescript
// Estado
const [showModal, setShowModal] = useState(false);

// Handler
const handleAction = () => {
  setShowModal(true);
};

const confirmAction = async () => {
  // Lógica de la acción
};

// Render
<CustomModal
  visible={showModal}
  type="warning"
  title="Título"
  message="Mensaje de confirmación"
  onClose={() => setShowModal(false)}
  primaryButton={{
    text: 'Confirmar',
    onPress: confirmAction,
    destructive: true, // Si es acción destructiva
  }}
  secondaryButton={{
    text: 'Cancelar',
    onPress: () => setShowModal(false),
  }}
/>
```

### Para alerts con datos dinámicos:
```typescript
// Estados
const [showModal, setShowModal] = useState(false);
const [itemToProcess, setItemToProcess] = useState<Type | null>(null);

// Handler
const handleAction = (item: Type) => {
  setItemToProcess(item);
  setShowModal(true);
};

const confirmAction = async () => {
  if (itemToProcess) {
    // Lógica usando itemToProcess
  }
};

// Render con cleanup al cerrar
<CustomModal
  visible={showModal}
  type="warning"
  title="Título"
  message={itemToProcess ? `Mensaje con ${itemToProcess.name}` : ''}
  onClose={() => {
    setShowModal(false);
    setItemToProcess(null);
  }}
  // ... botones
/>
```

---

## Verificación

### Compilación TypeScript
```bash
cd viatio-app && npx tsc --noEmit
```
✅ Sin errores

### Búsqueda de Alert.alert restantes
```bash
grep -r "Alert.alert" src/screens/shared/
```
✅ 0 resultados

### Búsqueda de imports de Alert
```bash
grep -r "import.*Alert" src/screens/shared/
```
✅ 0 resultados

---

## Beneficios de los Cambios

1. **UX Consistente**: Todos los modales tienen el mismo estilo visual
2. **Mejor Accesibilidad**: Los modales personalizados tienen mejor área táctil (50px mínimo)
3. **Jerarquía Visual Clara**: Iconos de color según tipo de acción
4. **Mejor Tipado**: TypeScript valida tipos de modal y props
5. **Mantenibilidad**: Cambios de estilo centralizados en `CustomModal.tsx`

---

## Tipos de Modales Usados

| Tipo | Casos de Uso | Color | Icono |
|------|--------------|-------|-------|
| `success` | Viaje creado, pago completado | Verde | checkmark-circle |
| `warning` | Confirmaciones destructivas (eliminar, salir) | Amarillo | warning |
| `info` | Información al usuario (no puede salir) | Azul | information-circle |
| `error` | (No usado en estas pantallas) | Rojo | close-circle |

---

## Siguiente Paso

Las pantallas de la carpeta `shared/` ya no usan `Alert.alert`. Se recomienda:

1. ✅ Verificar manualmente cada flujo en la app
2. ✅ Probar en Android e iOS (comportamiento de modales)
3. ✅ Verificar accesibilidad (VoiceOver/TalkBack)
4. 🔄 Aplicar mismo patrón en otras pantallas de la app si es necesario
