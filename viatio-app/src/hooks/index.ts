/**
 * HOOKS
 *
 * Custom React hooks reutilizables.
 * Lógica compartida que usa hooks de React (useState, useEffect, etc.).
 *
 * Ejemplos: useAuth, useTrips, useDebounce, useKeyboard, etc.
 */

export { useAsync } from './useAsync';
export { useUnifiedTrip } from './useUnifiedTrip';
export type { UnifiedTripData } from './useUnifiedTrip';
export { useTripMembers } from './useTripMembers';
export type { TripMembersData } from './useTripMembers';
export { useRealtimeSync } from './useRealtimeSync';
export type { RealtimeSyncOptions, RealtimeSyncState } from './useRealtimeSync';
