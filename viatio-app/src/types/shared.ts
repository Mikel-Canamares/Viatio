import { Timestamp } from 'firebase/firestore';

// ============================================
// TIPOS DE ROL Y ESTADO
// ============================================

export type TripRole = 'owner' | 'admin' | 'member' | 'read_only';
export type MemberStatus = 'active' | 'invited' | 'removed';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares';
export type SettlementStatus = 'pending' | 'completed';

// ============================================
// PERMISOS POR ROL
// ============================================

export const ROLE_PERMISSIONS: Record<TripRole, {
  canRead: boolean;
  canCreateExpense: boolean;
  canEditOwnExpense: boolean;
  canEditAnyExpense: boolean;
  canDeleteOwnExpense: boolean;
  canDeleteAnyExpense: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canEditTrip: boolean;
  canDeleteTrip: boolean;
}> = {
  owner: {
    canRead: true,
    canCreateExpense: true,
    canEditOwnExpense: true,
    canEditAnyExpense: true,
    canDeleteOwnExpense: true,
    canDeleteAnyExpense: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    canEditTrip: true,
    canDeleteTrip: true,
  },
  admin: {
    canRead: true,
    canCreateExpense: true,
    canEditOwnExpense: true,
    canEditAnyExpense: true,
    canDeleteOwnExpense: true,
    canDeleteAnyExpense: false,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    canEditTrip: true,
    canDeleteTrip: false,
  },
  member: {
    canRead: true,
    canCreateExpense: true,
    canEditOwnExpense: true,
    canEditAnyExpense: false,
    canDeleteOwnExpense: true,
    canDeleteAnyExpense: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canEditTrip: false,
    canDeleteTrip: false,
  },
  read_only: {
    canRead: true,
    canCreateExpense: false,
    canEditOwnExpense: false,
    canEditAnyExpense: false,
    canDeleteOwnExpense: false,
    canDeleteAnyExpense: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canEditTrip: false,
    canDeleteTrip: false,
  },
};

export const ROLE_LABELS: Record<TripRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
  read_only: 'Solo lectura',
};

// ============================================
// INTERFACES DE DATOS
// ============================================

export interface TripMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: TripRole;
  status: MemberStatus;
  joinedAt: Date;
  invitedBy: string;
  updatedAt: Date;
}

export interface SharedTrip {
  id: string;
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  currency: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Campos computados localmente
  members?: TripMember[];
  currentUserRole?: TripRole;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  email: string;
  role: TripRole;
  status: InviteStatus;
  invitedBy: string;
  invitedByName: string;
  tripName: string;
  inviteCode: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  acceptedBy: string | null;
}

export interface PendingInvite {
  tripId: string;
  tripName: string;
  inviteId: string;
  invitedBy: string;
  invitedByName: string;
  role: TripRole;
  createdAt: Date;
}

// ============================================
// GASTOS Y REPARTOS
// ============================================

export interface ExpenseShare {
  uid: string;
  displayName: string;
  value: number; // Según splitMethod: céntimos | porcentaje*100 | shares
  calculatedAmount: number; // Siempre en céntimos
}

export interface SharedExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number; // En céntimos - SIEMPRE en la moneda del viaje (normalizado)
  currency: string; // Moneda del viaje (normalizada)
  originalAmount?: number; // Monto original ingresado (céntimos) - si fue en otra moneda
  originalCurrency?: string; // Moneda original del ticket - si fue diferente a la del viaje
  exchangeRate?: number; // Tasa de cambio usada (originalCurrency → currency)
  exchangeRateDate?: string; // Fecha de la tasa de cambio (ISO)
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
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
}

export interface CreateExpenseInput {
  description: string;
  amount: number; // En céntimos
  currency: string;
  category: string;
  date: string;
  paidByUid: string;
  splitMethod: SplitMethod;
  participantUids: string[];
  shares: Omit<ExpenseShare, 'calculatedAmount'>[]; // Se calcula
  notes?: string;
}

// ============================================
// LIQUIDACIONES
// ============================================

export interface Settlement {
  id: string;
  tripId: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number; // céntimos - SIEMPRE en la moneda del viaje (normalizado)
  currency: string; // Moneda del viaje (normalizada)
  originalAmount?: number; // Monto original ingresado (céntimos) - si fue en otra moneda
  originalCurrency?: string; // Moneda original - si fue diferente a la del viaje
  exchangeRate?: number; // Tasa de cambio usada (originalCurrency → currency)
  exchangeRateDate?: string; // Fecha de la tasa de cambio (ISO)
  date: string;
  notes: string | null;
  status: SettlementStatus;
  createdBy: string;
  createdAt: Date;
  completedAt: Date | null;
}

// ============================================
// BALANCES Y RESÚMENES
// ============================================

export interface MemberBalance {
  uid: string;
  displayName: string;
  photoURL: string | null;
  totalPaid: number;      // Lo que ha pagado (céntimos)
  totalOwed: number;      // Lo que le corresponde pagar (céntimos)
  netBalance: number;     // totalPaid - totalOwed (+ = le deben, - = debe)
}

export interface SettlementSuggestion {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number; // céntimos
}

export interface ExpensesSummary {
  totalAmount: number;
  expenseCount: number;
  byCategory: Record<string, number>;
  byMember: Record<string, number>;
  byDate: Record<string, number>;
}

// ============================================
// HELPERS
// ============================================

export function hasPermission(
  role: TripRole | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.owner
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

export function canUserPerformAction(
  userRole: TripRole | undefined,
  action: keyof typeof ROLE_PERMISSIONS.owner,
  isOwnResource: boolean = false
): boolean {
  if (!userRole) return false;

  // Para acciones sobre recursos propios, verificar el permiso "Own"
  if (isOwnResource) {
    const ownPermission = action.replace('Any', 'Own') as keyof typeof ROLE_PERMISSIONS.owner;
    if (ownPermission in ROLE_PERMISSIONS[userRole]) {
      return ROLE_PERMISSIONS[userRole][ownPermission];
    }
  }

  return ROLE_PERMISSIONS[userRole][action];
}

// Convertir céntimos a formato display
export function centsToDisplay(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Convertir display a céntimos
export function displayToCents(display: number): number {
  return Math.round(display * 100);
}

// Normalizar email para búsquedas
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Generar código de invitación
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
