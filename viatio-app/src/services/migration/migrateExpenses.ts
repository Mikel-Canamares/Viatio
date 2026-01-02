import { auth } from '@/config/firebase';
import { db as firestoreDb } from '@/config/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { getGastosByViajeId } from '@/services/gastosService';
import { createExpense } from '@/services/firestore/expensesService';
import { getSharedTrip, createSharedTrip, addMemberToTrip } from '@/services/firestore/tripsService';
import { getViajeById } from '@/services/viajesService';
import { CreateExpenseInput, TripMember, displayToCents } from '@/types/shared';
import { logError } from '@/utils/errorHandler';

export interface MigrationResult {
  success: boolean;
  tripId: string;
  firestoreTripId: string | null;
  migratedCount: number;
  totalCount: number;
  errors: string[];
}

export interface MigrationStatus {
  needsMigration: boolean;
  localExpensesCount: number;
  firestoreExpensesCount: number;
}

/**
 * Verificar si un viaje local necesita migración a Firestore
 */
export async function checkMigrationStatus(localTripId: string): Promise<MigrationStatus> {
  try {
    // Contar gastos locales
    const localExpenses = await getGastosByViajeId(localTripId);
    const localCount = localExpenses.length;

    if (localCount === 0) {
      return {
        needsMigration: false,
        localExpensesCount: 0,
        firestoreExpensesCount: 0,
      };
    }

    // Verificar si existe viaje en Firestore con gastos
    const sharedTrip = await getSharedTrip(localTripId);

    if (!sharedTrip) {
      // No existe en Firestore, necesita migración completa
      return {
        needsMigration: true,
        localExpensesCount: localCount,
        firestoreExpensesCount: 0,
      };
    }

    // Contar gastos en Firestore
    const expensesRef = collection(firestoreDb, 'trips', localTripId, 'expenses');
    const q = query(expensesRef, where('deletedAt', '==', null), limit(1));
    const snapshot = await getDocs(q);

    // Si no hay gastos en Firestore pero sí locales, necesita migración
    if (snapshot.empty && localCount > 0) {
      return {
        needsMigration: true,
        localExpensesCount: localCount,
        firestoreExpensesCount: 0,
      };
    }

    return {
      needsMigration: false,
      localExpensesCount: localCount,
      firestoreExpensesCount: snapshot.size,
    };
  } catch (error) {
    logError(error, 'checkMigrationStatus');
    return {
      needsMigration: false,
      localExpensesCount: 0,
      firestoreExpensesCount: 0,
    };
  }
}

/**
 * Migrar un viaje y sus gastos de SQLite a Firestore
 */
export async function migrateTrip(
  localTripId: string,
  onProgress?: (current: number, total: number) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    tripId: localTripId,
    firestoreTripId: null,
    migratedCount: 0,
    totalCount: 0,
    errors: [],
  };

  try {
    const user = auth.currentUser;
    if (!user) {
      result.errors.push('Usuario no autenticado');
      return result;
    }

    // 1. Obtener viaje local
    const localTrip = await getViajeById(localTripId);
    if (!localTrip) {
      result.errors.push('Viaje local no encontrado');
      return result;
    }

    // 2. Crear o obtener viaje en Firestore
    let sharedTrip = await getSharedTrip(localTripId);

    if (!sharedTrip) {
      // Crear nuevo viaje en Firestore
      sharedTrip = await createSharedTrip({
        name: localTrip.destino, // Usamos destino como nombre ya que Viaje no tiene campo 'nombre'
        description: localTrip.descripcion || '',
        destination: localTrip.destino,
        startDate: localTrip.fechaInicio,
        endDate: localTrip.fechaFin,
        currency: localTrip.moneda || 'EUR',
      });

      if (!sharedTrip) {
        result.errors.push('No se pudo crear el viaje en Firestore');
        return result;
      }
    }

    result.firestoreTripId = sharedTrip.id;

    // 3. Obtener gastos locales
    const localExpenses = await getGastosByViajeId(localTripId);
    result.totalCount = localExpenses.length;

    if (localExpenses.length === 0) {
      result.success = true;
      return result;
    }

    // 4. Crear objeto de miembro para el usuario actual
    const currentMember: TripMember = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      invitedBy: user.uid,
      updatedAt: new Date(),
    };

    // 5. Migrar cada gasto
    for (let i = 0; i < localExpenses.length; i++) {
      const localGasto = localExpenses[i];
      onProgress?.(i + 1, localExpenses.length);

      try {
        // Convertir monto a céntimos (Gasto usa 'monto', no 'importe')
        const amountInCents = displayToCents(localGasto.monto);

        const expenseInput: CreateExpenseInput = {
          description: localGasto.descripcion || localGasto.categoria,
          amount: amountInCents,
          currency: localGasto.moneda || 'EUR',
          category: localGasto.categoria,
          date: localGasto.fecha,
          paidByUid: user.uid,
          splitMethod: 'equal',
          participantUids: [user.uid],
          shares: [{
            uid: user.uid,
            displayName: currentMember.displayName,
            value: 1,
          }],
          // Gasto no tiene campo 'notas', solo descripcion
        };

        const expense = await createExpense(
          sharedTrip.id,
          expenseInput,
          [currentMember]
        );

        if (expense) {
          result.migratedCount++;
        } else {
          result.errors.push(`Error migrando: ${localGasto.descripcion}`);
        }
      } catch (error: any) {
        result.errors.push(`Error en "${localGasto.descripcion}": ${error.message}`);
      }
    }

    result.success = result.migratedCount > 0;

  } catch (error: any) {
    logError(error, 'migrateTrip');
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Verificar si hay viajes que necesitan migración
 */
export async function getTripsNeedingMigration(usuarioId: string): Promise<string[]> {
  const tripsNeedingMigration: string[] = [];

  try {
    const { getViajesByUsuario } = await import('@/services/viajesService');
    const localTrips = await getViajesByUsuario(usuarioId);

    for (const trip of localTrips) {
      const status = await checkMigrationStatus(trip.id);
      if (status.needsMigration) {
        tripsNeedingMigration.push(trip.id);
      }
    }
  } catch (error) {
    logError(error, 'getTripsNeedingMigration');
  }

  return tripsNeedingMigration;
}
