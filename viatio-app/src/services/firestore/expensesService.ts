import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import {
  SharedExpense,
  ExpenseShare,
  CreateExpenseInput,
  SplitMethod,
  MemberBalance,
  SettlementSuggestion,
  ExpensesSummary,
  Settlement,
} from '@/types/shared';
import { TripMember } from '@/types/shared';
import { generateId } from '@/database';
import { logError } from '@/utils/errorHandler';
import { convertAmount } from '@/services/currencyService';

// ============================================
// TIPOS INTERNOS
// ============================================

interface ExpenseDoc {
  description: string;
  amount: number; // SIEMPRE en moneda del viaje (normalizado)
  currency: string; // Moneda del viaje
  originalAmount: number | null; // Monto original si fue en otra moneda
  originalCurrency: string | null; // Moneda original del ticket
  category: string;
  date: string;
  paidByUid: string;
  paidByName: string;
  splitMethod: SplitMethod;
  participantUids: string[];
  shares: ExpenseShare[];
  receiptUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
  deletedAt: Timestamp | null;
}

// ============================================
// CÁLCULO DE SHARES
// ============================================

/**
 * Calcular importes finales según método de reparto
 */
export function calculateShares(
  totalAmount: number, // en céntimos
  splitMethod: SplitMethod,
  shares: Omit<ExpenseShare, 'calculatedAmount'>[]
): ExpenseShare[] {
  const participantCount = shares.length;

  if (participantCount === 0) {
    return [];
  }

  switch (splitMethod) {
    case 'equal': {
      // Reparto igualitario
      const baseAmount = Math.floor(totalAmount / participantCount);
      const remainder = totalAmount - (baseAmount * participantCount);

      return shares.map((share, index) => ({
        ...share,
        value: baseAmount,
        // Añadir el resto al primer participante
        calculatedAmount: baseAmount + (index === 0 ? remainder : 0),
      }));
    }

    case 'exact': {
      // Importes exactos (value ya está en céntimos)
      return shares.map(share => ({
        ...share,
        calculatedAmount: share.value,
      }));
    }

    case 'percentage': {
      // Porcentajes (value es porcentaje * 100, ej: 50% = 5000)
      const totalPercentage = shares.reduce((sum, s) => sum + s.value, 0);

      // Normalizar si no suma 10000 (100%)
      return shares.map(share => {
        const normalizedPercentage = totalPercentage > 0
          ? (share.value / totalPercentage)
          : (1 / participantCount);

        return {
          ...share,
          calculatedAmount: Math.round(totalAmount * normalizedPercentage),
        };
      });
    }

    case 'shares': {
      // Por participaciones/pesos
      const totalShares = shares.reduce((sum, s) => sum + s.value, 0);

      if (totalShares === 0) {
        // Si no hay shares, dividir igualitario
        const baseAmount = Math.floor(totalAmount / participantCount);
        return shares.map(share => ({
          ...share,
          calculatedAmount: baseAmount,
        }));
      }

      return shares.map(share => ({
        ...share,
        calculatedAmount: Math.round((share.value / totalShares) * totalAmount),
      }));
    }

    default:
      return shares.map(share => ({
        ...share,
        calculatedAmount: Math.floor(totalAmount / participantCount),
      }));
  }
}

// ============================================
// CRUD DE GASTOS
// ============================================

/**
 * Crear un nuevo gasto
 * IMPORTANTE: Normaliza el monto a la moneda del viaje para mantener coherencia en cálculos
 */
export async function createExpense(
  tripId: string,
  input: CreateExpenseInput,
  members: TripMember[],
  tripCurrency: string // Moneda del viaje para normalización
): Promise<SharedExpense | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const expenseId = generateId();
    const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);

    // Encontrar el pagador
    const payer = members.find(m => m.uid === input.paidByUid);
    if (!payer) throw new Error('Pagador no encontrado');

    // NORMALIZACIÓN DE MONEDA: Convertir a moneda del viaje si es necesario
    let normalizedAmount = input.amount;
    let originalAmount: number | null = null;
    let originalCurrency: string | null = null;

    if (input.currency !== tripCurrency) {
      console.log(`[createExpense] Convirtiendo ${input.amount / 100} ${input.currency} → ${tripCurrency}`);

      // Convertir de céntimos a unidades para la conversión
      const amountInUnits = input.amount / 100;
      const conversion = await convertAmount(amountInUnits, input.currency, tripCurrency);

      if (!conversion) {
        throw new Error(`No se pudo convertir de ${input.currency} a ${tripCurrency}. Verifica tu conexión.`);
      }

      // Guardar valores originales
      originalAmount = input.amount;
      originalCurrency = input.currency;

      // Usar valor convertido (volver a céntimos)
      normalizedAmount = Math.round(conversion.converted * 100);

      console.log(`[createExpense] Resultado: ${normalizedAmount / 100} ${tripCurrency} (tasa: ${conversion.rate})`);
    }

    // Calcular shares sobre el monto NORMALIZADO
    const calculatedShares = calculateShares(
      normalizedAmount,
      input.splitMethod,
      input.shares
    );

    const expenseData: ExpenseDoc = {
      description: input.description,
      amount: normalizedAmount, // Monto normalizado en moneda del viaje
      currency: tripCurrency, // Moneda del viaje (normalizada)
      originalAmount, // null si no hubo conversión
      originalCurrency, // null si no hubo conversión
      category: input.category,
      date: input.date,
      paidByUid: input.paidByUid,
      paidByName: payer.displayName,
      splitMethod: input.splitMethod,
      participantUids: input.participantUids,
      shares: calculatedShares,
      receiptUrl: null,
      notes: input.notes || null,
      createdBy: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      updatedBy: user.uid,
      deletedAt: null,
    };

    await setDoc(expenseRef, expenseData);

    return {
      id: expenseId,
      tripId,
      ...expenseData,
      originalAmount: originalAmount ?? undefined,
      originalCurrency: originalCurrency ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  } catch (error) {
    logError(error, 'expensesService.createExpense');
    return null;
  }
}

/**
 * Obtener un gasto por ID
 */
export async function getExpense(
  tripId: string,
  expenseId: string
): Promise<SharedExpense | null> {
  try {
    const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);
    const expenseSnap = await getDoc(expenseRef);

    if (!expenseSnap.exists()) return null;

    const data = expenseSnap.data() as ExpenseDoc;

    return {
      id: expenseId,
      tripId,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      originalAmount: data.originalAmount ?? undefined,
      originalCurrency: data.originalCurrency ?? undefined,
      category: data.category,
      date: data.date,
      paidByUid: data.paidByUid,
      paidByName: data.paidByName,
      splitMethod: data.splitMethod,
      participantUids: data.participantUids,
      shares: data.shares,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      updatedBy: data.updatedBy,
      deletedAt: data.deletedAt?.toDate() || null,
    };
  } catch (error) {
    logError(error, 'expensesService.getExpense');
    return null;
  }
}

/**
 * Obtener todos los gastos de un viaje
 */
export async function getTripExpenses(tripId: string): Promise<SharedExpense[]> {
  try {
    const expensesRef = collection(db, 'trips', tripId, 'expenses');
    const q = query(
      expensesRef,
      where('deletedAt', '==', null),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as ExpenseDoc;
      return {
        id: docSnap.id,
        tripId,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        originalAmount: data.originalAmount ?? undefined,
        originalCurrency: data.originalCurrency ?? undefined,
        category: data.category,
        date: data.date,
        paidByUid: data.paidByUid,
        paidByName: data.paidByName,
        splitMethod: data.splitMethod,
        participantUids: data.participantUids,
        shares: data.shares,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        updatedBy: data.updatedBy,
        deletedAt: null,
      };
    });
  } catch (error) {
    logError(error, 'expensesService.getTripExpenses');
    return [];
  }
}

/**
 * Actualizar un gasto
 * IMPORTANTE: Si cambia el monto o moneda, normaliza a la moneda del viaje
 */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  updates: Partial<CreateExpenseInput>,
  members: TripMember[],
  tripCurrency: string // Moneda del viaje para normalización
): Promise<SharedExpense | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);
    const current = await getExpense(tripId, expenseId);

    if (!current) throw new Error('Gasto no encontrado');

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    };

    // Actualizar campos simples
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // Si cambia el pagador
    if (updates.paidByUid !== undefined) {
      const payer = members.find(m => m.uid === updates.paidByUid);
      if (payer) {
        updateData.paidByUid = updates.paidByUid;
        updateData.paidByName = payer.displayName;
      }
    }

    // Si cambia el importe o el reparto, recalcular
    if (updates.amount !== undefined || updates.currency !== undefined || updates.shares !== undefined || updates.splitMethod !== undefined) {
      let newAmount = updates.amount ?? current.amount;
      const newCurrency = updates.currency ?? current.originalCurrency ?? current.currency;
      const newSplitMethod = updates.splitMethod ?? current.splitMethod;
      const newShares = updates.shares ?? current.shares;

      // NORMALIZACIÓN: Si la moneda es diferente a la del viaje, convertir
      if (newCurrency !== tripCurrency) {
        console.log(`[updateExpense] Convirtiendo ${newAmount / 100} ${newCurrency} → ${tripCurrency}`);

        const amountInUnits = newAmount / 100;
        const conversion = await convertAmount(amountInUnits, newCurrency, tripCurrency);

        if (!conversion) {
          throw new Error(`No se pudo convertir de ${newCurrency} a ${tripCurrency}`);
        }

        updateData.originalAmount = newAmount;
        updateData.originalCurrency = newCurrency;
        newAmount = Math.round(conversion.converted * 100);

        console.log(`[updateExpense] Resultado: ${newAmount / 100} ${tripCurrency}`);
      } else {
        // Si es la misma moneda, limpiar campos originales
        updateData.originalAmount = null;
        updateData.originalCurrency = null;
      }

      updateData.amount = newAmount;
      updateData.currency = tripCurrency; // Siempre en moneda del viaje
      updateData.splitMethod = newSplitMethod;
      updateData.participantUids = updates.participantUids ?? current.participantUids;
      updateData.shares = calculateShares(newAmount, newSplitMethod, newShares);
    }

    await updateDoc(expenseRef, updateData);

    return await getExpense(tripId, expenseId);
  } catch (error) {
    logError(error, 'expensesService.updateExpense');
    return null;
  }
}

/**
 * Eliminar gasto (soft delete)
 */
export async function deleteExpense(
  tripId: string,
  expenseId: string
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);

    await updateDoc(expenseRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });

    return true;
  } catch (error) {
    logError(error, 'expensesService.deleteExpense');
    return false;
  }
}

// ============================================
// CÁLCULOS DE BALANCE
// ============================================

/**
 * Calcular balances de todos los miembros
 *
 * IMPORTANTE: Esta función asume que TODOS los gastos y settlements están en la MISMA MONEDA
 * (la moneda del viaje). Los servicios createExpense y createSettlement ya normalizan
 * automáticamente a la moneda del viaje antes de guardar.
 *
 * @param expenses - Gastos del viaje (ya normalizados a moneda del viaje)
 * @param members - Miembros del viaje
 * @param settlements - Settlements del viaje (ya normalizados a moneda del viaje)
 * @param tripCurrency - Moneda del viaje (para validación)
 * @returns Balances en moneda del viaje
 */
export function calculateBalances(
  expenses: SharedExpense[],
  members: TripMember[],
  settlements: Settlement[] = [],
  tripCurrency?: string // Opcional para validación
): MemberBalance[] {
  // Inicializar balances
  const balances: Map<string, MemberBalance> = new Map();

  members.forEach(member => {
    balances.set(member.uid, {
      uid: member.uid,
      displayName: member.displayName,
      photoURL: member.photoURL,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    });
  });

  // VALIDACIÓN: Verificar que todos los gastos están en la misma moneda
  if (tripCurrency) {
    expenses.forEach(expense => {
      if (expense.currency !== tripCurrency) {
        console.error(
          `[calculateBalances] ERROR: Gasto ${expense.id} tiene moneda ${expense.currency}, ` +
          `esperaba ${tripCurrency}. Los cálculos serán incorrectos.`
        );
      }
    });

    settlements.forEach(settlement => {
      if (settlement.currency !== tripCurrency) {
        console.error(
          `[calculateBalances] ERROR: Settlement ${settlement.id} tiene moneda ${settlement.currency}, ` +
          `esperaba ${tripCurrency}. Los cálculos serán incorrectos.`
        );
      }
    });
  }

  // Procesar cada gasto
  expenses.forEach(expense => {
    // Sumar lo que pagó cada persona
    const payerBalance = balances.get(expense.paidByUid);
    if (payerBalance) {
      payerBalance.totalPaid += expense.amount;
    }

    // Sumar lo que debe cada persona
    expense.shares.forEach(share => {
      const memberBalance = balances.get(share.uid);
      if (memberBalance) {
        memberBalance.totalOwed += share.calculatedAmount;
      }
    });

  });

  // Calcular balance neto
  balances.forEach(balance => {
    balance.netBalance = balance.totalPaid - balance.totalOwed;
  });

  // Ajustar balances por settlements completados
  // Cuando alguien paga un settlement, su deuda disminuye (o su crédito aumenta)
  // Cuando alguien recibe un settlement, lo que le deben disminuye
  settlements
    .filter(s => s.status === 'completed')
    .forEach(settlement => {
      const fromBalance = balances.get(settlement.fromUid);
      const toBalance = balances.get(settlement.toUid);

      if (fromBalance) {
        // La persona que pagó aumenta su balance (reduce su deuda o aumenta su crédito)
        fromBalance.netBalance += settlement.amount;
      }

      if (toBalance) {
        // La persona que recibió disminuye su balance (reduce lo que le deben)
        toBalance.netBalance -= settlement.amount;
      }
    });

  return Array.from(balances.values());
}

/**
 * Calcular sugerencias de liquidación (minimizar transferencias)
 * Algoritmo: emparejar deudores con acreedores
 *
 * IMPORTANTE: Considera settlements completados para no sugerir pagos ya realizados
 */
export function calculateSettlementSuggestions(
  balances: MemberBalance[],
  settlements: Settlement[] = []
): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = [];

  // Threshold: Considerar balances menores a 10 céntimos como 0
  // Aumentado de 1 a 10 para evitar sugerencias casi vacías
  const BALANCE_THRESHOLD = 10; // 10 céntimos

  // Filtrar settlements por estado
  const completedSettlements = settlements.filter(s => s.status === 'completed');
  const pendingSettlements = settlements.filter(s => s.status === 'pending');

  // Los balances ya vienen ajustados por settlements completados desde calculateBalances
  // No necesitamos re-ajustar aquí

  // Ajustar balances por settlements PENDIENTES para evitar sugerencias duplicadas
  const adjustedBalances = balances.map(b => ({ ...b }));
  pendingSettlements.forEach(settlement => {
    const fromBalance = adjustedBalances.find(b => b.uid === settlement.fromUid);
    const toBalance = adjustedBalances.find(b => b.uid === settlement.toUid);

    if (fromBalance && toBalance) {
      // El settlement pendiente ya "cubre" esta deuda
      fromBalance.netBalance += settlement.amount;
      toBalance.netBalance -= settlement.amount;
    }
  });

  // Separar en deudores (balance negativo) y acreedores (balance positivo)
  // Aplicar threshold para evitar diferencias por redondeo
  const debtors = adjustedBalances
    .filter(b => b.netBalance < -BALANCE_THRESHOLD)
    .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = adjustedBalances
    .filter(b => b.netBalance > BALANCE_THRESHOLD)
    .map(b => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  // Emparejar deudores con acreedores
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = Math.min(debtor.remaining, creditor.remaining);

    // Solo agregar sugerencias si el monto es significativo (> threshold)
    if (amount > BALANCE_THRESHOLD) {
      suggestions.push({
        fromUid: debtor.uid,
        fromName: debtor.displayName,
        toUid: creditor.uid,
        toName: creditor.displayName,
        amount: Math.round(amount), // Redondear para evitar fracciones de céntimo
      });

      debtor.remaining -= amount;
      creditor.remaining -= amount;
    }

    if (debtor.remaining <= BALANCE_THRESHOLD) debtorIndex++;
    if (creditor.remaining <= BALANCE_THRESHOLD) creditorIndex++;
  }

  return suggestions;
}

/**
 * Calcular resumen de gastos
 */
export function calculateExpensesSummary(expenses: SharedExpense[]): ExpensesSummary {
  const summary: ExpensesSummary = {
    totalAmount: 0,
    expenseCount: expenses.length,
    byCategory: {},
    byMember: {},
    byDate: {},
  };

  expenses.forEach(expense => {
    summary.totalAmount += expense.amount;

    // Por categoría
    summary.byCategory[expense.category] =
      (summary.byCategory[expense.category] || 0) + expense.amount;

    // Por miembro (quien pagó)
    summary.byMember[expense.paidByUid] =
      (summary.byMember[expense.paidByUid] || 0) + expense.amount;

    // Por fecha
    summary.byDate[expense.date] =
      (summary.byDate[expense.date] || 0) + expense.amount;
  });

  return summary;
}

// ============================================
// LISTENERS EN TIEMPO REAL
// ============================================

/**
 * Suscribirse a cambios en gastos de un viaje
 */
export function subscribeToExpenses(
  tripId: string,
  onUpdate: (expenses: SharedExpense[]) => void,
  onError?: (error: Error) => void
): () => void {
  const expensesRef = collection(db, 'trips', tripId, 'expenses');
  const q = query(
    expensesRef,
    where('deletedAt', '==', null),
    orderBy('date', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // Filtrar documentos con timestamp pendiente (serverTimestamp emite 2 veces:
      // primero con null, luego con el valor real - esto causa keys duplicadas)
      const expenses: SharedExpense[] = snapshot.docs
        .filter(docSnap => {
          const data = docSnap.data();
          return data.createdAt !== null;
        })
        .map(docSnap => {
        const data = docSnap.data() as ExpenseDoc;
        // serverTimestamp() puede ser null temporalmente hasta que el servidor lo resuelva
        const createdAt = data.createdAt?.toDate() ?? new Date();
        const updatedAt = data.updatedAt?.toDate() ?? new Date();
        return {
          id: docSnap.id,
          tripId,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          originalAmount: data.originalAmount ?? undefined,
          originalCurrency: data.originalCurrency ?? undefined,
          category: data.category,
          date: data.date,
          paidByUid: data.paidByUid,
          paidByName: data.paidByName,
          splitMethod: data.splitMethod,
          participantUids: data.participantUids,
          shares: data.shares,
          receiptUrl: data.receiptUrl,
          notes: data.notes,
          createdBy: data.createdBy,
          createdAt,
          updatedAt,
          updatedBy: data.updatedBy,
          deletedAt: null,
        };
      });

      onUpdate(expenses);
    },
    (error) => {
      logError(error, 'expensesService.subscribeToExpenses');
      onError?.(error);
    }
  );
}
