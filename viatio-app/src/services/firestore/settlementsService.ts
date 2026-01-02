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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Settlement, SettlementStatus, TripMember } from '@/types/shared';
import { generateId } from '@/database';
import { logError } from '@/utils/errorHandler';

interface SettlementDoc {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  amount: number;
  currency: string;
  date: string;
  notes: string | null;
  status: SettlementStatus;
  createdBy: string;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

/**
 * Crear una liquidación
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
  members: TripMember[]
): Promise<Settlement | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const from = members.find(m => m.uid === input.fromUid);
    const to = members.find(m => m.uid === input.toUid);

    if (!from || !to) throw new Error('Miembros no encontrados');

    const settlementId = generateId();
    const settlementRef = doc(db, 'trips', tripId, 'settlements', settlementId);

    const settlementData: SettlementDoc = {
      fromUid: input.fromUid,
      fromName: from.displayName,
      toUid: input.toUid,
      toName: to.displayName,
      amount: input.amount,
      currency: input.currency,
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
