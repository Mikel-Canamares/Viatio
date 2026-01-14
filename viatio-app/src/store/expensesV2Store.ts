import { create } from 'zustand';
import {
  SharedExpense,
  CreateExpenseInput,
  MemberBalance,
  SettlementSuggestion,
  ExpensesSummary,
  Settlement,
} from '@/types/shared';
import { TripMember } from '@/types/shared';
import {
  createExpense,
  getExpense,
  getTripExpenses,
  updateExpense,
  deleteExpense,
  calculateBalances,
  calculateSettlementSuggestions,
  calculateExpensesSummary,
  subscribeToExpenses,
} from '@/services/firestore/expensesService';
import {
  createSettlement,
  getTripSettlements,
  completeSettlement,
  cancelSettlement,
  subscribeToSettlements,
} from '@/services/firestore/settlementsService';

interface ExpensesV2State {
  // Estado
  expenses: SharedExpense[];
  selectedExpense: SharedExpense | null;
  balances: MemberBalance[];
  settlementSuggestions: SettlementSuggestion[];
  settlements: Settlement[];
  summary: ExpensesSummary | null;
  loading: boolean;
  error: string | null;

  // Unsubscribe
  _unsubscribe: (() => void) | null;
  _unsubscribeSettlements: (() => void) | null;

  // Acciones de gastos
  fetchExpenses: (tripId: string, members: TripMember[]) => Promise<void>;
  subscribeExpenses: (tripId: string, members: TripMember[]) => void;
  unsubscribeExpenses: () => void;
  subscribeSettlementsRealtime: (tripId: string, members: TripMember[]) => void;
  unsubscribeSettlementsRealtime: () => void;
  addExpense: (tripId: string, input: CreateExpenseInput, members: TripMember[]) => Promise<SharedExpense | null>;
  editExpense: (tripId: string, expenseId: string, updates: Partial<CreateExpenseInput>, members: TripMember[]) => Promise<boolean>;
  removeExpense: (tripId: string, expenseId: string, members: TripMember[]) => Promise<boolean>;
  selectExpense: (expense: SharedExpense | null) => void;
  getExpenseById: (tripId: string, expenseId: string) => Promise<SharedExpense | null>;

  // Recalcular balances
  recalculateBalances: (members: TripMember[]) => void;

  // Liquidaciones
  fetchSettlements: (tripId: string) => Promise<void>;
  addSettlement: (tripId: string, input: Parameters<typeof createSettlement>[1], members: TripMember[]) => Promise<Settlement | null>;
  markSettlementComplete: (tripId: string, settlementId: string, members: TripMember[]) => Promise<boolean>;
  removeSettlement: (tripId: string, settlementId: string, members: TripMember[]) => Promise<boolean>;

  // Reset
  reset: () => void;
}

export const useExpensesV2Store = create<ExpensesV2State>((set, get) => ({
  // Estado inicial
  expenses: [],
  selectedExpense: null,
  balances: [],
  settlementSuggestions: [],
  settlements: [],
  summary: null,
  loading: false,
  error: null,
  _unsubscribe: null,
  _unsubscribeSettlements: null,

  // ============================================
  // ACCIONES DE GASTOS
  // ============================================

  fetchExpenses: async (tripId, members) => {
    set({ loading: true, error: null });
    try {
      const expenses = await getTripExpenses(tripId);
      const { settlements } = get();
      const balances = calculateBalances(expenses, members, settlements);
      const settlementSuggestions = calculateSettlementSuggestions(balances, settlements);
      const summary = calculateExpensesSummary(expenses);

      set({
        expenses,
        balances,
        settlementSuggestions,
        summary,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message, loading: false });
    }
  },

  subscribeExpenses: (tripId, members) => {
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
    }

    const unsubscribe = subscribeToExpenses(
      tripId,
      (expenses) => {
        const { settlements } = get();
        const balances = calculateBalances(expenses, members, settlements);
        const settlementSuggestions = calculateSettlementSuggestions(balances, settlements);
        const summary = calculateExpensesSummary(expenses);

        set({
          expenses,
          balances,
          settlementSuggestions,
          summary,
        });
      },
      (error) => set({ error: error.message })
    );

    set({ _unsubscribe: unsubscribe });
  },

  unsubscribeExpenses: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
      set({ _unsubscribe: null });
    }
  },

  subscribeSettlementsRealtime: (tripId, members) => {
    const { _unsubscribeSettlements } = get();
    if (_unsubscribeSettlements) {
      _unsubscribeSettlements();
    }

    const unsubscribe = subscribeToSettlements(
      tripId,
      (settlements) => {
        const { expenses } = get();
        const balances = calculateBalances(expenses, members, settlements);
        const settlementSuggestions = calculateSettlementSuggestions(balances, settlements);

        set({
          settlements,
          balances,
          settlementSuggestions,
        });
      },
      (error) => set({ error: error.message })
    );

    set({ _unsubscribeSettlements: unsubscribe });
  },

  unsubscribeSettlementsRealtime: () => {
    const { _unsubscribeSettlements } = get();
    if (_unsubscribeSettlements) {
      _unsubscribeSettlements();
      set({ _unsubscribeSettlements: null });
    }
  },

  addExpense: async (tripId, input, members) => {
    set({ loading: true, error: null });
    try {
      const expense = await createExpense(tripId, input, members);
      if (expense) {
        set((state) => {
          const newExpenses = [expense, ...state.expenses];
          const balances = calculateBalances(newExpenses, members, state.settlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, state.settlements);
          const summary = calculateExpensesSummary(newExpenses);

          return {
            expenses: newExpenses,
            balances,
            settlementSuggestions,
            summary,
            loading: false,
          };
        });
      }
      return expense;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message, loading: false });
      return null;
    }
  },

  editExpense: async (tripId, expenseId, updates, members) => {
    try {
      const updated = await updateExpense(tripId, expenseId, updates, members);
      if (updated) {
        set((state) => {
          const newExpenses = state.expenses.map((e) =>
            e.id === expenseId ? updated : e
          );
          const balances = calculateBalances(newExpenses, members, state.settlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, state.settlements);
          const summary = calculateExpensesSummary(newExpenses);

          return {
            expenses: newExpenses,
            balances,
            settlementSuggestions,
            summary,
            selectedExpense: state.selectedExpense?.id === expenseId ? updated : state.selectedExpense,
          };
        });
        return true;
      }
      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
      return false;
    }
  },

  removeExpense: async (tripId, expenseId, members) => {
    try {
      const success = await deleteExpense(tripId, expenseId);
      if (success) {
        set((state) => {
          const newExpenses = state.expenses.filter((e) => e.id !== expenseId);

          // Recalcular balances y sugerencias con los gastos actualizados
          const balances = calculateBalances(newExpenses, members, state.settlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, state.settlements);
          const summary = calculateExpensesSummary(newExpenses);

          return {
            expenses: newExpenses,
            balances,
            settlementSuggestions,
            summary,
            selectedExpense: state.selectedExpense?.id === expenseId ? null : state.selectedExpense,
          };
        });
      }
      return success;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
      return false;
    }
  },

  selectExpense: (expense) => {
    set({ selectedExpense: expense });
  },

  getExpenseById: async (tripId, expenseId) => {
    try {
      return await getExpense(tripId, expenseId);
    } catch {
      return null;
    }
  },

  recalculateBalances: (members) => {
    const { expenses, settlements } = get();
    const balances = calculateBalances(expenses, members, settlements);
    const settlementSuggestions = calculateSettlementSuggestions(balances, settlements);
    set({ balances, settlementSuggestions });
  },

  // ============================================
  // LIQUIDACIONES
  // ============================================

  fetchSettlements: async (tripId) => {
    try {
      const settlements = await getTripSettlements(tripId);
      set((state) => {
        // Recalcular balances con los settlements actualizados
        // Necesitamos members para esto, pero solo recalculamos si ya hay datos cargados
        if (state.expenses.length > 0) {
          return { settlements };
        }
        return { settlements };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
    }
  },

  addSettlement: async (tripId, input, members) => {
    try {
      // Validar que no exista un settlement pendiente idéntico
      const { settlements } = get();
      const duplicatePending = settlements.find(
        s => s.status === 'pending' &&
             s.fromUid === input.fromUid &&
             s.toUid === input.toUid &&
             s.amount === input.amount
      );

      if (duplicatePending) {
        throw new Error('Ya existe un pago pendiente idéntico');
      }

      const settlement = await createSettlement(tripId, input, members);
      if (settlement) {
        set((state) => {
          const updatedSettlements = [settlement, ...state.settlements];

          // Recalcular balances con el nuevo settlement
          const balances = calculateBalances(state.expenses, members, updatedSettlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, updatedSettlements);

          return {
            settlements: updatedSettlements,
            balances,
            settlementSuggestions,
          };
        });
      }
      return settlement;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
      return null;
    }
  },

  markSettlementComplete: async (tripId, settlementId, members) => {
    try {
      const success = await completeSettlement(tripId, settlementId);
      if (success) {
        // Actualizar el settlement y recalcular balances
        set((state) => {
          const updatedSettlements = state.settlements.map((s) =>
            s.id === settlementId
              ? { ...s, status: 'completed' as const, completedAt: new Date() }
              : s
          );

          // Recalcular balances con los settlements actualizados
          const balances = calculateBalances(state.expenses, members, updatedSettlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, updatedSettlements);

          return {
            settlements: updatedSettlements,
            balances,
            settlementSuggestions,
          };
        });
      }
      return success;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
      return false;
    }
  },

  removeSettlement: async (tripId, settlementId, members) => {
    try {
      const success = await cancelSettlement(tripId, settlementId);
      if (success) {
        set((state) => {
          const updatedSettlements = state.settlements.filter((s) => s.id !== settlementId);

          // Recalcular balances y sugerencias
          const balances = calculateBalances(state.expenses, members, updatedSettlements);
          const settlementSuggestions = calculateSettlementSuggestions(balances, updatedSettlements);

          return {
            settlements: updatedSettlements,
            balances,
            settlementSuggestions,
          };
        });
      }
      return success;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: message });
      return false;
    }
  },

  // ============================================
  // RESET
  // ============================================

  reset: () => {
    const { unsubscribeExpenses, unsubscribeSettlementsRealtime } = get();
    unsubscribeExpenses();
    unsubscribeSettlementsRealtime();
    set({
      expenses: [],
      selectedExpense: null,
      balances: [],
      settlementSuggestions: [],
      settlements: [],
      summary: null,
      loading: false,
      error: null,
    });
  },
}));
