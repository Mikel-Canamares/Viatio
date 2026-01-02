import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { logError } from '@/utils/errorHandler';

export interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreUserDoc {
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Obtener usuario por UID
 */
export async function getUser(uid: string): Promise<FirestoreUser | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data() as FirestoreUserDoc;
    return {
      uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } catch (error) {
    logError(error, 'usersService.getUser');
    return null;
  }
}

/**
 * Crear o actualizar usuario (llamar tras login/registro)
 */
export async function upsertUser(
  uid: string,
  data: {
    email: string;
    displayName?: string;
    photoURL?: string | null;
  }
): Promise<FirestoreUser | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Actualizar solo si hay cambios
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (data.displayName) updateData.displayName = data.displayName;
      if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;

      await updateDoc(userRef, updateData);
    } else {
      // Crear nuevo usuario
      await setDoc(userRef, {
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        photoURL: data.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return await getUser(uid);
  } catch (error) {
    logError(error, 'usersService.upsertUser');
    return null;
  }
}

/**
 * Buscar usuarios por email (para invitaciones)
 */
export async function findUserByEmail(email: string): Promise<FirestoreUser | null> {
  try {
    const { collection, query, where, getDocs, limit } = await import('firebase/firestore');

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '==', email.toLowerCase().trim()),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as FirestoreUserDoc;

    return {
      uid: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } catch (error) {
    logError(error, 'usersService.findUserByEmail');
    return null;
  }
}
