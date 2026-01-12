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

// ============================================
// TIPOS INTERNOS
// ============================================

interface ExpenseDoc {
  description: string;
  amount: number;
  currency: string;
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
 */
export async function createExpense(
  tripId: string,
  input: CreateExpenseInput,
  members: TripMember[]
): Promise<SharedExpense | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const expenseId = generateId();
    const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);

    // Encontrar el pagador
    const payer = members.find(m => m.uid === input.paidByUid);
    if (!payer) throw new Error('Pagador no encontrado');

    // Calcular shares
    const calculatedShares = calculateShares(
      input.amount,
      input.splitMethod,
      input.shares
    );

    const expenseData: ExpenseDoc = {
      description: input.description,
      amount: input.amount,
      currency: input.currency,
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
 */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  updates: Partial<CreateExpenseInput>,
  members: TripMember[]
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
    if (updates.currency !== undefined) updateData.currency = updates.currency;
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
    if (updates.amount !== undefined || updates.shares !== undefined || updates.splitMethod !== undefined) {
      const newAmount = updates.amount ?? current.amount;
      const newSplitMethod = updates.splitMethod ?? current.splitMethod;
      const newShares = updates.shares ?? current.shares;

      updateData.amount = newAmount;
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
 * Considera tanto gastos como settlements completados
 */
export function calculateBalances(
  expenses: SharedExpense[],
  members: TripMember[],
  settlements: Settlement[] = []
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

  // Procesar settlements completados
  // Los settlements son PAGOS REALES que liquidan deudas
  // Cuando A paga X€ a B:
  //  - A reduce su deuda (aumenta totalPaid)
  //  - B reduce lo que le deben (aumenta totalOwed)
  // Esto hace que ambos balances se acerquen a 0
  settlements
    .filter(s => s.status === 'completed')
    .forEach(settlement => {
      const fromBalance = balances.get(settlement.fromUid);
      if (fromBalance) {
        // El que paga salda parte de su deuda
        fromBalance.totalPaid += settlement.amount;
      }

      const toBalance = balances.get(settlement.toUid);
      if (toBalance) {
        // El que recibe ya no se le debe tanto
        toBalance.totalOwed += settlement.amount;
      }
    });

  // Calcular balance neto
  balances.forEach(balance => {
    balance.netBalance = balance.totalPaid - balance.totalOwed;
  });

  return Array.from(balances.values());
}

/**
 * Calcular sugerencias de liquidación (minimizar transferencias)
 * Algoritmo: emparejar deudores con acreedores
 */
export function calculateSettlementSuggestions(
  balances: MemberBalance[]
): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = [];

  // Separar en deudores (balance negativo) y acreedores (balance positivo)
  const debtors = balances
    .filter(b => b.netBalance < 0)
    .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter(b => b.netBalance > 0)
    .map(b => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  // Emparejar deudores con acreedores
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
      suggestions.push({
        fromUid: debtor.uid,
        fromName: debtor.displayName,
        toUid: creditor.uid,
        toName: creditor.displayName,
        amount,
      });

      debtor.remaining -= amount;
      creditor.remaining -= amount;
    }

    if (debtor.remaining === 0) debtorIndex++;
    if (creditor.remaining === 0) creditorIndex++;
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
