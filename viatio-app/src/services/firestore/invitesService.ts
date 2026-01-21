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
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import {
  TripInvitation,
  TripRole,
  InviteStatus,
  PendingInvite,
  generateInviteCode,
  normalizeEmail,
} from '@/types/shared';
import { generateId } from '@/database';
import { findUserByEmail, getUser } from './usersService';
import { addMemberToTrip, getSharedTrip } from './tripsService';
import { logError } from '@/utils/errorHandler';
import { createNotification } from './notificationsService';

// ============================================
// TIPOS INTERNOS
// ============================================

interface InviteDoc {
  email: string;
  role: TripRole;
  status: InviteStatus;
  invitedBy: string;
  invitedByName: string;
  tripName: string;
  inviteCode: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  acceptedAt: Timestamp | null;
  acceptedBy: string | null;
}

interface PendingInviteDoc {
  email: string;
  invites: Array<{
    tripId: string;
    tripName: string;
    inviteId: string;
    invitedBy: string;
    invitedByName: string;
    role: TripRole;
    createdAt: Timestamp;
  }>;
}

// ============================================
// CREAR INVITACIÓN
// ============================================

/**
 * Invitar a un usuario por email
 */
export async function inviteUserToTrip(
  tripId: string,
  email: string,
  role: TripRole = 'member'
): Promise<TripInvitation | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const normalizedEmail = normalizeEmail(email);

    // Verificar que el viaje existe
    const trip = await getSharedTrip(tripId);
    if (!trip) throw new Error('Viaje no encontrado');

    // Verificar que no se invite a sí mismo
    if (user.email?.toLowerCase() === normalizedEmail) {
      throw new Error('No puedes invitarte a ti mismo');
    }

    // Verificar si ya es miembro
    const existingMember = trip.members?.find(
      m => m.email.toLowerCase() === normalizedEmail && m.status === 'active'
    );
    if (existingMember) {
      throw new Error('Este usuario ya es miembro del viaje');
    }

    // Verificar si ya hay una invitación pendiente
    const existingInvite = await getPendingInviteForEmail(tripId, normalizedEmail);
    if (existingInvite) {
      throw new Error('Ya existe una invitación pendiente para este email');
    }

    // Verificar si el usuario ya existe en el sistema
    const existingUser = await findUserByEmail(normalizedEmail);

    const inviteId = generateId();
    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

    const batch = writeBatch(db);

    // Crear invitación en el viaje
    const inviteRef = doc(db, 'trips', tripId, 'invitations', inviteId);
    const inviteData: InviteDoc = {
      email: normalizedEmail,
      role,
      status: 'pending',
      invitedBy: user.uid,
      invitedByName: user.displayName || user.email || 'Usuario',
      tripName: trip.name,
      inviteCode,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp() as Timestamp,
      acceptedAt: null,
      acceptedBy: null,
    };
    batch.set(inviteRef, inviteData);

    // Si el usuario NO existe, añadir a pendingInvites
    if (!existingUser) {
      const pendingRef = doc(db, 'pendingInvites', normalizedEmail);
      const pendingSnap = await getDoc(pendingRef);

      const newInvite = {
        tripId,
        tripName: trip.name,
        inviteId,
        invitedBy: user.uid,
        invitedByName: user.displayName || 'Usuario',
        role,
        createdAt: Timestamp.now(), // serverTimestamp() no soportado en arrays
      };

      if (pendingSnap.exists()) {
        // Añadir a invites existentes
        const currentData = pendingSnap.data() as PendingInviteDoc;
        batch.update(pendingRef, {
          invites: [...currentData.invites, newInvite],
        });
      } else {
        // Crear nuevo documento
        batch.set(pendingRef, {
          email: normalizedEmail,
          invites: [newInvite],
        });
      }
    }

    await batch.commit();

    // Crear notificación si el usuario existe
    if (existingUser) {
      await createNotification(existingUser.uid, {
        type: 'trip_invite',
        title: 'Nueva invitación a viaje',
        body: `${user.displayName || user.email?.split('@')[0] || 'Un usuario'} te invitó a "${trip.name}"`,
        data: {
          tripId,
          inviteId,
          invitedBy: user.uid,
          invitedByName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          tripName: trip.name,
        },
        expiresInDays: 7,
      });
    }

    return {
      id: inviteId,
      tripId,
      email: normalizedEmail,
      role,
      status: 'pending',
      invitedBy: user.uid,
      invitedByName: user.displayName || 'Usuario',
      tripName: trip.name,
      inviteCode,
      expiresAt,
      createdAt: new Date(),
      acceptedAt: null,
      acceptedBy: null,
    };
  } catch (error) {
    logError(error, 'invitesService.inviteUserToTrip');
    throw error;
  }
}

// ============================================
// OBTENER INVITACIONES
// ============================================

/**
 * Obtener invitaciones pendientes para un viaje
 */
export async function getTripInvitations(tripId: string): Promise<TripInvitation[]> {
  try {
    const invitesRef = collection(db, 'trips', tripId, 'invitations');
    const q = query(invitesRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as InviteDoc;
      return {
        id: docSnap.id,
        tripId,
        email: data.email,
        role: data.role,
        status: data.status,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        tripName: data.tripName,
        inviteCode: data.inviteCode,
        expiresAt: data.expiresAt.toDate(),
        createdAt: data.createdAt.toDate(),
        acceptedAt: data.acceptedAt?.toDate() || null,
        acceptedBy: data.acceptedBy,
      };
    });
  } catch (error) {
    logError(error, 'invitesService.getTripInvitations');
    return [];
  }
}

/**
 * Obtener invitación pendiente por email
 */
async function getPendingInviteForEmail(
  tripId: string,
  email: string
): Promise<TripInvitation | null> {
  try {
    const invitesRef = collection(db, 'trips', tripId, 'invitations');
    const q = query(
      invitesRef,
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as InviteDoc;

    return {
      id: docSnap.id,
      tripId,
      email: data.email,
      role: data.role,
      status: data.status,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      tripName: data.tripName,
      inviteCode: data.inviteCode,
      expiresAt: data.expiresAt.toDate(),
      createdAt: data.createdAt.toDate(),
      acceptedAt: null,
      acceptedBy: null,
    };
  } catch (error) {
    logError(error, 'invitesService.getPendingInviteForEmail');
    return null;
  }
}

/**
 * Obtener invitaciones pendientes del usuario actual
 */
export async function getMyPendingInvites(): Promise<PendingInvite[]> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return [];

    const normalizedEmail = normalizeEmail(user.email);

    // Buscar en pendingInvites
    const pendingRef = doc(db, 'pendingInvites', normalizedEmail);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) return [];

    const data = pendingSnap.data() as PendingInviteDoc;

    return data.invites.map(inv => ({
      tripId: inv.tripId,
      tripName: inv.tripName,
      inviteId: inv.inviteId,
      invitedBy: inv.invitedBy,
      invitedByName: inv.invitedByName,
      role: inv.role,
      createdAt: inv.createdAt.toDate(),
    }));
  } catch (error) {
    logError(error, 'invitesService.getMyPendingInvites');
    return [];
  }
}

// ============================================
// ACEPTAR/RECHAZAR INVITACIÓN
// ============================================

/**
 * Aceptar una invitación
 */
export async function acceptInvitation(
  tripId: string,
  inviteId: string
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Usuario no autenticado');

    const normalizedEmail = normalizeEmail(user.email);

    // Obtener la invitación
    const inviteRef = doc(db, 'trips', tripId, 'invitations', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Invitación no encontrada');
    }

    const inviteData = inviteSnap.data() as InviteDoc;

    // Verificar que la invitación es para este email
    if (inviteData.email !== normalizedEmail) {
      throw new Error('Esta invitación no es para ti');
    }

    // Verificar que no ha expirado
    if (inviteData.expiresAt.toDate() < new Date()) {
      await updateDoc(inviteRef, { status: 'expired' });
      throw new Error('La invitación ha expirado');
    }

    // Verificar que está pendiente
    if (inviteData.status !== 'pending') {
      throw new Error('Esta invitación ya no está pendiente');
    }

    // Añadir como miembro
    await addMemberToTrip(
      tripId,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
      },
      inviteData.role,
      inviteData.invitedBy
    );

    // Actualizar estado de la invitación
    await updateDoc(inviteRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedBy: user.uid,
    });

    // Notificar al invitador
    await createNotification(inviteData.invitedBy, {
      type: 'invite_accepted',
      title: 'Invitación aceptada',
      body: `${user.displayName || user.email?.split('@')[0] || 'Un usuario'} aceptó tu invitación a "${inviteData.tripName}"`,
      data: {
        tripId,
        acceptedBy: user.uid,
        acceptedByName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        tripName: inviteData.tripName,
      },
      expiresInDays: 7,
    });

    // Limpiar de pendingInvites
    await removePendingInvite(normalizedEmail, tripId, inviteId);

    return true;
  } catch (error) {
    logError(error, 'invitesService.acceptInvitation');
    throw error;
  }
}

/**
 * Rechazar una invitación
 */
export async function rejectInvitation(
  tripId: string,
  inviteId: string
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Usuario no autenticado');

    const normalizedEmail = normalizeEmail(user.email);

    const inviteRef = doc(db, 'trips', tripId, 'invitations', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Invitación no encontrada');
    }

    const inviteData = inviteSnap.data() as InviteDoc;

    await updateDoc(inviteRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
    });

    // Notificar al invitador
    await createNotification(inviteData.invitedBy, {
      type: 'invite_rejected',
      title: 'Invitación rechazada',
      body: `${user.displayName || user.email?.split('@')[0] || 'Un usuario'} rechazó tu invitación a "${inviteData.tripName}"`,
      data: {
        tripId,
        rejectedBy: user.uid,
        tripName: inviteData.tripName,
      },
      expiresInDays: 3,
    });

    // Limpiar de pendingInvites
    await removePendingInvite(normalizedEmail, tripId, inviteId);

    return true;
  } catch (error) {
    logError(error, 'invitesService.rejectInvitation');
    return false;
  }
}

/**
 * Cancelar una invitación (el que invitó)
 */
export async function cancelInvitation(
  tripId: string,
  inviteId: string
): Promise<boolean> {
  try {
    const inviteRef = doc(db, 'trips', tripId, 'invitations', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) return false;

    const inviteData = inviteSnap.data() as InviteDoc;

    // Eliminar la invitación
    await deleteDoc(inviteRef);

    // Limpiar de pendingInvites
    await removePendingInvite(inviteData.email, tripId, inviteId);

    return true;
  } catch (error) {
    logError(error, 'invitesService.cancelInvitation');
    return false;
  }
}

/**
 * Eliminar invitación de pendingInvites
 */
async function removePendingInvite(
  email: string,
  tripId: string,
  inviteId: string
): Promise<void> {
  try {
    const pendingRef = doc(db, 'pendingInvites', email);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) return;

    const data = pendingSnap.data() as PendingInviteDoc;
    const updatedInvites = data.invites.filter(
      inv => !(inv.tripId === tripId && inv.inviteId === inviteId)
    );

    if (updatedInvites.length === 0) {
      await deleteDoc(pendingRef);
    } else {
      await updateDoc(pendingRef, { invites: updatedInvites });
    }
  } catch (error) {
    logError(error, 'invitesService.removePendingInvite');
  }
}

// ============================================
// PROCESAR INVITACIONES AL LOGIN
// ============================================

/**
 * Procesar invitaciones pendientes cuando un usuario hace login/registro
 * Llamar desde AuthContext después del login exitoso
 */
export async function processPendingInvitesOnLogin(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return 0;

    const normalizedEmail = normalizeEmail(user.email);
    const pendingRef = doc(db, 'pendingInvites', normalizedEmail);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) return 0;

    const data = pendingSnap.data() as PendingInviteDoc;

    // Las invitaciones se mantienen para que el usuario las acepte manualmente
    // Solo retornamos el conteo para mostrar notificación
    return data.invites.length;
  } catch (error) {
    logError(error, 'invitesService.processPendingInvitesOnLogin');
    return 0;
  }
}

// ============================================
// BUSCAR POR CÓDIGO
// ============================================

/**
 * Buscar invitación por código
 */
export async function findInviteByCode(
  code: string,
  userEmail?: string
): Promise<{ tripId: string; invite: TripInvitation } | null> {
  try {
    const { collectionGroup } = await import('firebase/firestore');

    const invitesQuery = query(
      collectionGroup(db, 'invitations'),
      where('inviteCode', '==', code.toUpperCase()),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(invitesQuery);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as InviteDoc;

    // Validar que el email coincida (si se proporciona)
    if (userEmail) {
      const normalizedUserEmail = normalizeEmail(userEmail);
      const normalizedInviteEmail = normalizeEmail(data.email);

      if (normalizedUserEmail !== normalizedInviteEmail) {
        throw new Error('Este código no está vinculado a tu email');
      }
    }

    // Extraer tripId del path: trips/{tripId}/invitations/{inviteId}
    const pathParts = docSnap.ref.path.split('/');
    const tripId = pathParts[1];

    return {
      tripId,
      invite: {
        id: docSnap.id,
        tripId,
        email: data.email,
        role: data.role,
        status: data.status,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        tripName: data.tripName,
        inviteCode: data.inviteCode,
        expiresAt: data.expiresAt.toDate(),
        createdAt: data.createdAt.toDate(),
        acceptedAt: data.acceptedAt?.toDate() || null,
        acceptedBy: data.acceptedBy,
      },
    };
  } catch (error) {
    logError(error, 'invitesService.findInviteByCode');
    throw error; // Propagar error para que UI lo maneje
  }
}

/**
 * Procesar invitaciones pendientes cuando un usuario se registra
 * Crea notificaciones para todas las invitaciones que estaban esperando
 */
export async function processPendingInvitations(
  email: string,
  uid: string
): Promise<number> {
  try {
    console.log('[Invites] Procesando invitaciones pendientes para:', email);

    const normalizedEmail = normalizeEmail(email);
    const pendingInvitesRef = doc(db, 'pendingInvites', normalizedEmail);
    const pendingSnap = await getDoc(pendingInvitesRef);

    if (!pendingSnap.exists()) {
      console.log('[Invites] No hay invitaciones pendientes');
      return 0;
    }

    const pendingData = pendingSnap.data();
    const invites = pendingData?.invites || [];

    if (invites.length === 0) {
      console.log('[Invites] Array de invitaciones vacío');
      return 0;
    }

    console.log(`[Invites] Encontradas ${invites.length} invitaciones pendientes`);

    // Crear notificaciones para cada invitación pendiente
    let notificationsCreated = 0;

    for (const invite of invites) {
      try {
        // Obtener información del invitador
        const inviterUser = await getUser(invite.invitedBy);

        await createNotification(uid, {
          type: 'trip_invite',
          title: 'Nueva invitación a viaje',
          body: `${inviterUser?.displayName || invite.invitedByName || 'Un usuario'} te invitó a "${invite.tripName}"`,
          data: {
            tripId: invite.tripId,
            inviteId: invite.inviteId, // CORREGIDO: usar inviteId en lugar de id
            invitedBy: invite.invitedBy,
            invitedByName: inviterUser?.displayName || invite.invitedByName || 'Usuario',
            tripName: invite.tripName,
          },
          expiresInDays: 7,
        });

        notificationsCreated++;
        console.log(`[Invites] ✅ Notificación creada para invitación de viaje: ${invite.tripName}`);
      } catch (error) {
        console.error('[Invites] Error al crear notificación:', error);
        // Continuar con las demás invitaciones
      }
    }

    console.log(`[Invites] ✅ ${notificationsCreated} notificaciones creadas de ${invites.length} invitaciones pendientes`);

    return notificationsCreated;
  } catch (error) {
    console.error('[Invites] ❌ Error al procesar invitaciones pendientes:', error);
    logError(error, 'invitesService.processPendingInvitations');
    return 0;
  }
}
