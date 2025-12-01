/**
 * TYPES
 *
 * Definiciones de tipos e interfaces TypeScript.
 * Modelos de datos, tipos compartidos y type guards.
 *
 * Ejemplos: Trip, User, Booking, Expense, etc.
 */

export type {
  Viaje,
  CreateViajeInput,
  UpdateViajeInput,
  ViajeStats,
  ViajeConStats,
} from './viaje';

export type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  AuthState,
} from './auth';

export { mapFirebaseUser } from './auth';
