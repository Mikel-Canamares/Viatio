# Arquitectura Multi-Moneda para Viatio

## Problema actual

El sistema tiene errores en el módulo de gastos:
```
ERROR: Settlement b41c1769-84f6-44c9-9f61-2eae0275b018 tiene moneda EUR, esperaba PHP
```

**Causa raíz:** RecordSettlementScreen permite crear settlements en la moneda del perfil del usuario (EUR) cuando el viaje está en otra moneda (PHP), causando inconsistencias en cálculos.

---

## Requisitos de negocio

1. **Moneda de perfil:** Cada usuario debe ver TODO en su moneda preferida
2. **Multi-moneda en viajes:** Un viaje puede abarcar varios países (ej: EUR en España, USD en USA)
3. **Registro flexible:** Usuarios pueden registrar gastos en la moneda real del ticket
4. **Balances correctos:** Los cálculos deben ser matemáticamente correctos independientemente de las monedas
5. **Liquidaciones consistentes:** Las liquidaciones deben reflejar deudas reales

---

## Principios de diseño

### 1. Moneda de Referencia del Viaje (Reference Currency)
- Cada viaje tiene **UNA moneda de referencia** para cálculos internos
- Todos los balances se calculan en esta moneda
- Garantiza coherencia matemática (no mezclar monedas en sumas)
- Por defecto: Primera moneda del viaje o EUR

### 2. Conversión en Capa de Presentación (Display Currency)
- Los cálculos SIEMPRE en moneda de referencia
- La conversión a moneda del usuario se hace SOLO al mostrar
- Cada usuario ve montos en su `userDisplayCurrency` (config perfil)
- No se guardan montos en múltiples monedas (solo referencia + original)

### 3. Almacenamiento con Trazabilidad
Cada gasto/settlement guarda:
- `amount` + `currency`: Normalizado a moneda de referencia del viaje
- `originalAmount` + `originalCurrency`: Monto ingresado por el usuario
- `exchangeRate`: Tasa de cambio usada en ese momento (para auditoría)
- `exchangeRateDate`: Fecha de la tasa (para transparencia)

### 4. Flujo de datos

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ENTRADA - Usuario registra gasto                             │
│    Input: 100 USD (ticket de taxi en Nueva York)                │
│    Viaje: Referencia EUR                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONVERSIÓN - Normalización a moneda de referencia            │
│    API: USD → EUR = 0.92                                        │
│    Resultado: 92 EUR                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ALMACENAMIENTO - Firestore                                   │
│    {                                                            │
│      amount: 9200,              // céntimos EUR (referencia)    │
│      currency: "EUR",           // moneda de referencia         │
│      originalAmount: 10000,     // céntimos USD (original)      │
│      originalCurrency: "USD",   // moneda original              │
│      exchangeRate: 0.92,        // tasa USD→EUR                 │
│      exchangeRateDate: "2026-01-24"                             │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CÁLCULO - Balances en moneda de referencia                   │
│    Suma: 9200 EUR (referencia) + otros gastos EUR               │
│    Balance usuario A: -5000 EUR (debe)                          │
│    Balance usuario B: +5000 EUR (le deben)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. PRESENTACIÓN - Conversión a moneda de cada usuario           │
│    Usuario español (EUR): -50,00 € ✓                            │
│    Usuario mexicano (MXN): -1.000,00 MXN (EUR→MXN en tiempo real)│
│    Usuario americano (USD): -54,35 $ (EUR→USD en tiempo real)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cambios en el modelo de datos

### SharedTrip
```typescript
export interface SharedTrip {
  // ... campos existentes ...
  currency: string; // Renombrar conceptualmente a referenceCurrency
  allowedCurrencies?: string[]; // Futuro: ['EUR', 'USD', 'GBP']
}
```

### SharedExpense (añadir campos)
```typescript
export interface SharedExpense {
  // ... campos existentes ...
  exchangeRate?: number; // Tasa usada originalCurrency → currency
  exchangeRateDate?: string; // Fecha de la tasa (ISO)
}
```

### Settlement (añadir campos)
```typescript
export interface Settlement {
  // ... campos existentes ...
  exchangeRate?: number; // Tasa usada originalCurrency → currency
  exchangeRateDate?: string; // Fecha de la tasa (ISO)
}
```

### UserConfig (configuración)
```typescript
export interface UserConfig {
  // ... campos existentes ...
  displayCurrency: string; // Moneda preferida para visualización (default: 'EUR')
}
```

---

## Cambios en servicios

### 1. expensesService.ts

**createExpense:**
- ✅ Ya convierte a moneda del viaje
- ➕ Añadir guardado de `exchangeRate` y `exchangeRateDate`

**updateExpense:**
- ✅ Ya convierte a moneda del viaje
- ➕ Actualizar `exchangeRate` si cambia la moneda

**calculateBalances:**
- ⚠️ Cambiar logs de ERROR a WARNING (no romper flujo)
- ✅ Mantener lógica actual (todo en moneda de referencia)

### 2. settlementsService.ts

**createSettlement:**
- ✅ Ya convierte a moneda del viaje
- ➕ Añadir guardado de `exchangeRate` y `exchangeRateDate`

### 3. Nuevo: currencyConversionService.ts

**Funciones utilitarias:**
```typescript
// Convertir monto de referencia a moneda de display del usuario
async function convertToUserDisplay(
  amount: number,
  referenceCurrency: string,
  userDisplayCurrency: string
): Promise<number>

// Batch para optimizar conversiones múltiples
async function convertBatchToUserDisplay(
  amounts: Array<{amount: number, currency: string}>,
  userDisplayCurrency: string
): Promise<number[]>
```

---

## Cambios en UI

### 1. Hook: useUserCurrencyDisplay.ts
```typescript
export function useUserCurrencyDisplay() {
  const { config } = useConfiguracionStore();
  const userCurrency = config.monedaDefault || 'EUR';

  const convertAmount = async (amount: number, fromCurrency: string) => {
    // Lógica de conversión con caché
  };

  const formatAmount = (amount: number, fromCurrency: string) => {
    // Formato visual
  };

  return { userCurrency, convertAmount, formatAmount };
}
```

### 2. Componentes a actualizar

**ExpenseCard / BalanceCard / SettlementCard:**
- Mostrar monto original si es diferente a referencia
- Mostrar conversión a moneda de usuario si es diferente
- Ejemplo visual:
  ```
  Taxi (Nueva York)
  $100.00 USD → 92,00 € (ref) → 1.840,00 MXN (tu moneda)
  ```

**RecordSettlementScreen:**
- Permitir al usuario elegir moneda del pago
- Mostrar conversión automática a referencia del viaje
- Guardar con normalización correcta

**AddExpenseScreen:**
- ✅ Ya permite elegir moneda
- ✅ Validar que guarde exchangeRate

---

## Plan de implementación

### FASE 1: Base de datos y tipos (1 sesión)
1. Añadir campos `exchangeRate`, `exchangeRateDate` a tipos
2. Actualizar interfaces TypeScript
3. Migrar datos existentes (exchangeRate = 1 para monedas iguales)

### FASE 2: Servicios de conversión (1 sesión)
4. Modificar `createExpense` para guardar tasa
5. Modificar `createSettlement` para guardar tasa
6. Modificar `calculateBalances` (ERROR → WARNING)
7. Crear `currencyConversionService.ts` con utilidades

### FASE 3: Capa de presentación (2 sesiones)
8. Crear hook `useUserCurrencyDisplay`
9. Actualizar componentes de visualización
10. Actualizar RecordSettlementScreen para permitir elegir moneda
11. Añadir configuración de `displayCurrency` en perfil

### FASE 4: Testing y validación (1 sesión)
12. Probar flujo completo: crear gasto USD en viaje EUR, ver en MXN
13. Probar settlements multi-moneda
14. Verificar balances correctos
15. Validar conversiones en tiempo real

### FASE 5: Documentación (opcional)
16. Actualizar CLAUDE.md con arquitectura multi-moneda
17. Crear guía de usuario sobre multi-moneda

---

## Solución INMEDIATA al bug actual

**Opción A - Quick Fix (15 min):**
- Cambiar `calculateBalances` para que los logs sean WARNING en vez de ERROR
- No rompe el flujo, solo alerta
- Los cálculos seguirán siendo incorrectos PERO la app no crashea

**Opción B - Fix Completo (2 horas):**
- Implementar FASE 1 + FASE 2
- Migrar settlements existentes en EUR a PHP usando tasa actual
- Actualizar RecordSettlementScreen para usar moneda de referencia

**Recomendación:** Opción B (fix completo) porque el quick fix deja los cálculos incorrectos.

---

## Review de riesgos

**Riesgos identificados:**
1. ⚠️ Migraciones de datos existentes (settlements en EUR con viaje en PHP)
2. ⚠️ Tasas de cambio pueden variar → usar tasa del momento del gasto
3. ⚠️ Caché de conversiones puede estar desactualizada → TTL de 24h está OK
4. ⚠️ Redondeos al convertir múltiples veces → siempre desde referencia, no en cadena

**Mitigaciones:**
1. ✅ Script de migración con validación
2. ✅ Guardar exchangeRate usado para auditoría
3. ✅ Sistema de caché ya existe en currencyService
4. ✅ Conversiones siempre desde moneda de referencia

---

## Siguientes pasos sugeridos

1. **Decidir:** ¿Quick fix o fix completo?
2. **Implementar:** Según decisión
3. **Probar:** Con datos reales del viaje en PHP
4. **Iterar:** Añadir FASE 3 (presentación) gradualmente
