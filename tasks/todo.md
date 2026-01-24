# Implementación Multi-Moneda - Resumen de cambios

## ✅ Completado (2026-01-24)

### FASE 1: Base de datos y tipos
- [x] Añadido `exchangeRate: number` a `SharedExpense` y `Settlement`
- [x] Añadido `exchangeRateDate: string` a `SharedExpense` y `Settlement`
- [x] Actualizado interfaces TypeScript en `src/types/shared.ts`

### FASE 2: Servicios de Firestore

#### expensesService.ts
- [x] Añadido `exchangeRate` y `exchangeRateDate` a interfaz `ExpenseDoc`
- [x] Modificado `createExpense()` para guardar tasa de cambio cuando convierte monedas
- [x] Modificado `updateExpense()` para actualizar tasa de cambio si cambia la moneda
- [x] Actualizado `getExpense()` para devolver nuevos campos
- [x] Actualizado `getTripExpenses()` para incluir nuevos campos
- [x] Actualizado `subscribeToExpenses()` para incluir nuevos campos
- [x] Cambiado logs de ERROR a WARNING en `calculateBalances()` (no rompe flujo)

#### settlementsService.ts
- [x] Añadido `exchangeRate` y `exchangeRateDate` a interfaz `SettlementDoc`
- [x] Modificado `createSettlement()` para guardar tasa de cambio cuando convierte monedas
- [x] Actualizado `getTripSettlements()` para incluir nuevos campos
- [x] Actualizado `subscribeToSettlements()` para incluir nuevos campos

### FASE 3: Pantallas de entrada

#### RecordSettlementScreen.tsx
- [x] Cambiado para usar moneda del viaje (`tripCurrency`) en vez de moneda del usuario
- [x] Ahora guarda settlements correctamente normalizados a moneda de referencia
- [x] Preparado para futuro: variable `currency` permite elegir moneda (ahora = tripCurrency)

### Compilación
- [x] `npx tsc --noEmit` ejecutado sin errores ✓

---

## 🎯 Resultado

**Antes:**
```
Settlement creado en EUR → Viaje en PHP → ERROR en calculateBalances
Cálculos incorrectos (suma EUR + PHP)
```

**Después:**
```
Settlement creado en EUR → Conversión automática a PHP → Guardado:
  - originalAmount: EUR (para mostrar)
  - amount: PHP (para calcular)
  - exchangeRate: 69.368
  - exchangeRateDate: "2026-01-24"

Cálculos correctos (todo en PHP)
Warnings en vez de errors (no rompe app)
```

---

## 📋 Siguientes pasos (futuro)

### FASE 4: Migración de datos existentes
- [ ] Script para añadir `exchangeRate = 1` a gastos/settlements donde `currency === originalCurrency`
- [ ] Identificar settlements en EUR de viajes PHP y recalcular con tasa actual
- [ ] Opcional: Interfaz admin para revisar inconsistencias

### FASE 5: Capa de presentación (multi-moneda completa)
- [ ] Añadir `displayCurrency` a config de usuario (perfil)
- [ ] Crear hook `useUserCurrencyDisplay()` para conversiones automáticas
- [ ] Actualizar componentes de visualización:
  - ExpenseCard (mostrar original + conversión a usuario)
  - BalanceCard (convertir balances a moneda usuario)
  - Summary cards (convertir totales a moneda usuario)
- [ ] RecordSettlementScreen: Permitir elegir moneda del pago (dropdown)
- [ ] AddExpenseScreen: Validar que ya permite elegir moneda

### FASE 6: Viajes multi-moneda
- [ ] Añadir `allowedCurrencies: string[]` a SharedTrip
- [ ] UI para configurar monedas permitidas al crear/editar viaje
- [ ] Selector de moneda en AddExpense limitado a monedas permitidas

---

## 🔍 Review

### Archivos modificados
1. `viatio-app/src/types/shared.ts` - Interfaces actualizadas
2. `viatio-app/src/services/firestore/expensesService.ts` - Guardado de exchangeRate
3. `viatio-app/src/services/firestore/settlementsService.ts` - Guardado de exchangeRate
4. `viatio-app/src/screens/shared/RecordSettlementScreen.tsx` - Uso de tripCurrency

### Riesgos potenciales
1. ⚠️ **Datos antiguos sin exchangeRate**: Los gastos/settlements existentes no tienen `exchangeRate`
   - **Mitigación**: Los campos son opcionales (`?`), no rompe compatibilidad
   - **Acción futura**: Migración para añadir `exchangeRate = 1` donde corresponda

2. ⚠️ **Settlements en EUR con viaje PHP**: Pueden existir settlements incorrectos
   - **Mitigación**: Ahora los warnings alertan pero no rompen
   - **Acción futura**: Script de corrección o eliminación manual

3. ⚠️ **Conversiones en tiempo real pueden fallar**: Sin internet, `convertAmount` retorna null
   - **Mitigación**: Ya existe sistema de caché de 24h en currencyService
   - **Estado actual**: OK

### Testing recomendado
1. Crear gasto en PHP (moneda del viaje) → Verificar que NO guarda exchangeRate
2. Crear gasto en EUR (diferente a viaje PHP) → Verificar que SÍ guarda exchangeRate
3. Crear settlement en PHP → Verificar normalización correcta
4. Verificar que app no crashea con settlements antiguos (sin exchangeRate)
5. Verificar balances calculados correctamente

---

## 📝 Notas técnicas

### Formato de exchangeRateDate
- Formato: ISO date string `YYYY-MM-DD` (ej: "2026-01-24")
- Razón: Compatible con Firestore, fácil de leer, ordenable

### Cuándo se guarda exchangeRate
- **SÍ se guarda**: Cuando `input.currency !== tripCurrency`
- **NO se guarda** (null): Cuando son la misma moneda
- **Actualización**: Se recalcula si cambia la moneda del gasto/settlement

### Cálculo de balances
- **Moneda de cálculo**: Siempre `trip.currency` (moneda de referencia)
- **Validación**: Warnings si encuentra monedas mixtas (no bloquea)
- **Settlements completados**: Se suman/restan del balance neto
