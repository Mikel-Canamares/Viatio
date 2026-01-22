import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Settlement, SettlementStatus, TripMember } from '@/types/shared';
import { generateId } from '@/database';
import { logError } from '@/utils/errorHandler';
import { convertAmount } from '@/services/currencyService';

interface SettlementDoc {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number; // SIEMPRE en moneda del viaje (normalizado)
  currency: string; // Moneda del viaje
  originalAmount: number | null; // Monto original si fue en otra moneda
  originalCurrency: string | null; // Moneda original
  date: string;
  notes: string | null;
  status: SettlementStatus;
  createdBy: string;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

/**
 * Crear una liquidación
 * IMPORTANTE: Normaliza el monto a la moneda del viaje para mantener coherencia
 */
export async function createSettlement(
  tripId: string,
  input: {
    fromUid: string;
    toUid: string;
    amount: number;
    currency: string;
    date: string;
    notes?: string;
  },
  members: TripMember[],
  tripCurrency: string // Moneda del viaje para normalización
): Promise<Settlement | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const from = members.find(m => m.uid === input.fromUid);
    const to = members.find(m => m.uid === input.toUid);

    if (!from || !to) throw new Error('Miembros no encontrados');

    const settlementId = generateId();
    const settlementRef = doc(db, 'trips', tripId, 'settlements', settlementId);

    // NORMALIZACIÓN DE MONEDA: Convertir a moneda del viaje si es necesario
    let normalizedAmount = input.amount;
    let originalAmount: number | null = null;
    let originalCurrency: string | null = null;

    if (input.currency !== tripCurrency) {
      console.log(`[createSettlement] Convirtiendo ${input.amount / 100} ${input.currency} → ${tripCurrency}`);

      const amountInUnits = input.amount / 100;
      const conversion = await convertAmount(amountInUnits, input.currency, tripCurrency);

      if (!conversion) {
        throw new Error(`No se pudo convertir de ${input.currency} a ${tripCurrency}. Verifica tu conexión.`);
      }

      originalAmount = input.amount;
      originalCurrency = input.currency;
      normalizedAmount = Math.round(conversion.converted * 100);

      console.log(`[createSettlement] Resultado: ${normalizedAmount / 100} ${tripCurrency} (tasa: ${conversion.rate})`);
    }

    const settlementData: SettlementDoc = {
      fromUid: input.fromUid,
      fromName: from.displayName,
      toUid: input.toUid,
      toName: to.displayName,
      amount: normalizedAmount, // Monto normalizado
      currency: tripCurrency, // Moneda del viaje
      originalAmount, // null si no hubo conversión
      originalCurrency, // null si no hubo conversión
      date: input.date,
      notes: input.notes || null,
      status: 'pending',
      createdBy: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      completedAt: null,
    };

    await setDoc(settlementRef, settlementData);

    return {
      id: settlementId,
      tripId,
      ...settlementData,
      originalAmount: originalAmount ?? undefined,
      originalCurrency: originalCurrency ?? undefined,
      createdAt: new Date(),
      completedAt: null,
    };
  } catch (error) {
    logError(error, 'settlementsService.createSettlement');
    return null;
  }
}

/**
 * Obtener liquidaciones de un viaje
 */
export async function getTripSettlements(tripId: string): Promise<Settlement[]> {
  try {
    const settlementsRef = collection(db, 'trips', tripId, 'settlements');
    const q = query(settlementsRef, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as SettlementDoc;
      return {
        id: docSnap.id,
        tripId,
        fromUid: data.fromUid,
        fromName: data.fromName,
        toUid: data.toUid,
        toName: data.toName,
        amount: data.amount,
        currency: data.currency,
        originalAmount: data.originalAmount ?? undefined,
        originalCurrency: data.originalCurrency ?? undefined,
        date: data.date,
        notes: data.notes,
        status: data.status,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        completedAt: data.completedAt?.toDate() || null,
      };
    });
  } catch (error) {
    logError(error, 'settlementsService.getTripSettlements');
    return [];
  }
}

/**
 * Marcar liquidación como completada
 */
export async function completeSettlement(
  tripId: string,
  settlementId: string
): Promise<boolean> {
  try {
    const settlementRef = doc(db, 'trips', tripId, 'settlements', settlementId);

    await updateDoc(settlementRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    logError(error, 'settlementsService.completeSettlement');
    return false;
  }
}

/**
 * Cancelar liquidación pendiente
 */
export async function cancelSettlement(
  tripId: string,
  settlementId: string
): Promise<boolean> {
  try {
    const settlementRef = doc(db, 'trips', tripId, 'settlements', settlementId);
    const docSnap = await getDoc(settlementRef);

    if (!docSnap.exists()) return false;

    const data = docSnap.data() as SettlementDoc;
    if (data.status === 'completed') {
      throw new Error('No se puede cancelar una liquidación completada');
    }

    await deleteDoc(settlementRef);

    return true;
  } catch (error) {
    logError(error, 'settlementsService.cancelSettlement');
    return false;
  }
}

/**
 * Suscribirse a cambios en settlements de un viaje en tiempo real
 */
export function subscribeToSettlements(
  tripId: string,
  onUpdate: (settlements: Settlement[]) => void,
  onError?: (error: Error) => void
): () => void {
  const settlementsRef = collection(db, 'trips', tripId, 'settlements');
  const q = query(settlementsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const settlements: Settlement[] = snapshot.docs
        .filter(docSnap => {
          const data = docSnap.data();
          return data.createdAt !== null;
        })
        .map(docSnap => {
          const data = docSnap.data() as SettlementDoc;
          const createdAt = data.createdAt?.toDate() ?? new Date();
          const completedAt = data.completedAt?.toDate() ?? null;

          return {
            id: docSnap.id,
            tripId,
            fromUid: data.fromUid,
            fromName: data.fromName,
            toUid: data.toUid,
            toName: data.toName,
            amount: data.amount,
            currency: data.currency,
            originalAmount: data.originalAmount ?? undefined,
            originalCurrency: data.originalCurrency ?? undefined,
            date: data.date,
            notes: data.notes,
            status: data.status,
            createdBy: data.createdBy,
            createdAt,
            completedAt,
          };
        });

      onUpdate(settlements);
    },
    (error) => {
      logError(error, 'settlementsService.subscribeToSettlements');
      onError?.(error);
    }
  );
}
