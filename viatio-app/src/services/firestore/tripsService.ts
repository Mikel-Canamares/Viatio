import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import {
  SharedTrip,
  TripMember,
  TripRole,
  MemberStatus,
} from '@/types/shared';
import { generateId } from '@/database';
import { logError } from '@/utils/errorHandler';

// ============================================
// TIPOS INTERNOS
// ============================================

interface TripDoc {
  name: string;
  description: string;
  destination: string;
  destinationPlaceId?: string | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  currency: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

interface MemberDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: TripRole;
  status: MemberStatus;
  joinedAt: Timestamp;
  invitedBy: string;
  updatedAt: Timestamp;
}

// ============================================
// CONVERSORES
// ============================================

function tripDocToSharedTrip(id: string, data: TripDoc): SharedTrip {
  return {
    id,
    name: data.name,
    description: data.description,
    destination: data.destination,
    destinationPlaceId: data.destinationPlaceId || null,
    startDate: data.startDate,
    endDate: data.endDate,
    coverImage: data.coverImage,
    currency: data.currency,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    deletedAt: data.deletedAt?.toDate() || null,
  };
}

function memberDocToTripMember(data: MemberDoc): TripMember {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role,
    status: data.status,
    joinedAt: data.joinedAt.toDate(),
    invitedBy: data.invitedBy,
    updatedAt: data.updatedAt.toDate(),
  };
}

// ============================================
// OPERACIONES DE VIAJE
// ============================================

/**
 * Crear un nuevo viaje compartido
 */
export async function createSharedTrip(input: {
  name: string;
  description?: string;
  destination: string;
  destinationPlaceId?: string;
  startDate: string;
  endDate: string;
  currency?: string;
}): Promise<SharedTrip | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const tripId = generateId();
    const tripRef = doc(db, 'trips', tripId);

    const tripData: TripDoc = {
      name: input.name,
      description: input.description || '',
      destination: input.destination,
      destinationPlaceId: input.destinationPlaceId || null,
      startDate: input.startDate,
      endDate: input.endDate,
      coverImage: null,
      currency: input.currency || 'EUR',
      ownerUid: user.uid,
      memberUids: [user.uid],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      deletedAt: null,
    };

    // Crear viaje y miembro owner en batch
    const batch = writeBatch(db);

    batch.set(tripRef, tripData);

    // Añadir al creador como owner
    const memberRef = doc(db, 'trips', tripId, 'members', user.uid);
    batch.set(memberRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL || null,
      role: 'owner' as TripRole,
      status: 'active' as MemberStatus,
      joinedAt: serverTimestamp(),
      invitedBy: user.uid,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Retornar el viaje creado
    const createdTrip = await getSharedTrip(tripId);
    return createdTrip;
  } catch (error) {
    logError(error, 'tripsService.createSharedTrip');
    return null;
  }
}

/**
 * Obtener un viaje por ID
 */
export async function getSharedTrip(tripId: string): Promise<SharedTrip | null> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return null;
    }

    const data = tripSnap.data() as TripDoc;
    const trip = tripDocToSharedTrip(tripId, data);

    // Cargar miembros
    const members = await getTripMembers(tripId);
    trip.members = members;

    // Determinar rol del usuario actual
    const user = auth.currentUser;
    if (user) {
      const currentMember = members.find(m => m.uid === user.uid);
      trip.currentUserRole = currentMember?.role;
    }

    return trip;
  } catch (error) {
    logError(error, 'tripsService.getSharedTrip');
    return null;
  }
}

/**
 * Obtener todos los viajes del usuario actual
 */
export async function getUserTrips(): Promise<SharedTrip[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const tripsRef = collection(db, 'trips');
    const q = query(
      tripsRef,
      where('memberUids', 'array-contains', user.uid),
      where('deletedAt', '==', null),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    const trips: SharedTrip[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as TripDoc;
      const trip = tripDocToSharedTrip(docSnap.id, data);

      // Determinar rol del usuario
      const memberRef = doc(db, 'trips', docSnap.id, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        trip.currentUserRole = (memberSnap.data() as MemberDoc).role;
      }

      trips.push(trip);
    }

    return trips;
  } catch (error) {
    logError(error, 'tripsService.getUserTrips');
    return [];
  }
}

/**
 * Actualizar viaje
 */
export async function updateSharedTrip(
  tripId: string,
  updates: Partial<Pick<SharedTrip, 'name' | 'description' | 'destination' | 'destinationPlaceId' | 'startDate' | 'endDate' | 'currency' | 'coverImage'>>
): Promise<SharedTrip | null> {
  try {
    const tripRef = doc(db, 'trips', tripId);

    await updateDoc(tripRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return await getSharedTrip(tripId);
  } catch (error) {
    logError(error, 'tripsService.updateSharedTrip');
    return null;
  }
}

/**
 * Eliminar viaje (soft delete)
 */
export async function deleteSharedTrip(tripId: string): Promise<boolean> {
  try {
    const tripRef = doc(db, 'trips', tripId);

    await updateDoc(tripRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    logError(error, 'tripsService.deleteSharedTrip');
    return false;
  }
}

// ============================================
// OPERACIONES DE MIEMBROS
// ============================================

/**
 * Obtener miembros de un viaje
 */
export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  try {
    const membersRef = collection(db, 'trips', tripId, 'members');
    const q = query(membersRef, where('status', '!=', 'removed'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap =>
      memberDocToTripMember(docSnap.data() as MemberDoc)
    );
  } catch (error) {
    logError(error, 'tripsService.getTripMembers');
    return [];
  }
}

/**
 * Añadir miembro al viaje (después de aceptar invitación)
 */
export async function addMemberToTrip(
  tripId: string,
  userData: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
  },
  role: TripRole,
  invitedBy: string
): Promise<TripMember | null> {
  try {
    const batch = writeBatch(db);

    // Añadir miembro
    const memberRef = doc(db, 'trips', tripId, 'members', userData.uid);
    const memberData: MemberDoc = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role,
      status: 'active',
      joinedAt: serverTimestamp() as Timestamp,
      invitedBy,
      updatedAt: serverTimestamp() as Timestamp,
    };
    batch.set(memberRef, memberData);

    // Actualizar array de memberUids en el viaje
    const tripRef = doc(db, 'trips', tripId);
    batch.update(tripRef, {
      memberUids: arrayUnion(userData.uid),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return memberDocToTripMember({
      ...memberData,
      joinedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logError(error, 'tripsService.addMemberToTrip');
    return null;
  }
}

/**
 * Actualizar rol de un miembro
 */
export async function updateMemberRole(
  tripId: string,
  memberUid: string,
  newRole: TripRole
): Promise<boolean> {
  try {
    // No permitir cambiar el owner a otro rol
    const trip = await getSharedTrip(tripId);
    if (!trip) return false;

    if (trip.ownerUid === memberUid && newRole !== 'owner') {
      throw new Error('No se puede cambiar el rol del propietario');
    }

    const memberRef = doc(db, 'trips', tripId, 'members', memberUid);
    await updateDoc(memberRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    logError(error, 'tripsService.updateMemberRole');
    return false;
  }
}

/**
 * Eliminar miembro del viaje
 */
export async function removeMemberFromTrip(
  tripId: string,
  memberUid: string
): Promise<boolean> {
  try {
    const trip = await getSharedTrip(tripId);
    if (!trip) return false;

    // No permitir eliminar al owner
    if (trip.ownerUid === memberUid) {
      throw new Error('No se puede eliminar al propietario');
    }

    const batch = writeBatch(db);

    // Marcar miembro como removed
    const memberRef = doc(db, 'trips', tripId, 'members', memberUid);
    batch.update(memberRef, {
      status: 'removed',
      updatedAt: serverTimestamp(),
    });

    // Quitar del array de memberUids
    const tripRef = doc(db, 'trips', tripId);
    batch.update(tripRef, {
      memberUids: arrayRemove(memberUid),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return true;
  } catch (error) {
    logError(error, 'tripsService.removeMemberFromTrip');
    return false;
  }
}

/**
 * Salir del viaje (el propio usuario)
 */
export async function leaveTrip(tripId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  return removeMemberFromTrip(tripId, user.uid);
}

// ============================================
// LISTENERS EN TIEMPO REAL
// ============================================

/**
 * Suscribirse a cambios en un viaje
 */
export function subscribeToTrip(
  tripId: string,
  onUpdate: (trip: SharedTrip | null) => void,
  onError?: (error: Error) => void
): () => void {
  const tripRef = doc(db, 'trips', tripId);

  return onSnapshot(
    tripRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }

      const trip = tripDocToSharedTrip(docSnap.id, docSnap.data() as TripDoc);
      trip.members = await getTripMembers(tripId);

      const user = auth.currentUser;
      if (user) {
        const member = trip.members?.find(m => m.uid === user.uid);
        trip.currentUserRole = member?.role;
      }

      onUpdate(trip);
    },
    (error) => {
      logError(error, 'tripsService.subscribeToTrip');
      onError?.(error);
    }
  );
}

/**
 * Suscribirse a la lista de viajes del usuario
 */
export function subscribeToUserTrips(
  onUpdate: (trips: SharedTrip[]) => void,
  onError?: (error: Error) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    onUpdate([]);
    return () => {};
  }

  const tripsRef = collection(db, 'trips');
  const q = query(
    tripsRef,
    where('memberUids', 'array-contains', user.uid),
    where('deletedAt', '==', null),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const trips: SharedTrip[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as TripDoc;
        const trip = tripDocToSharedTrip(docSnap.id, data);

        // Obtener rol del usuario
        const memberRef = doc(db, 'trips', docSnap.id, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          trip.currentUserRole = (memberSnap.data() as MemberDoc).role;
        }

        trips.push(trip);
      }

      onUpdate(trips);
    },
    (error) => {
      logError(error, 'tripsService.subscribeToUserTrips');
      onError?.(error);
    }
  );
}
