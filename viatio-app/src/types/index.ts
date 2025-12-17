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

export type {
  PerfilUsuario,
  EstadisticasUsuario,
  PreferenciasNotificaciones,
  ConfiguracionApp,
} from './perfil';

export {
  IDIOMAS_DISPONIBLES,
  MONEDAS_DISPONIBLES,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
  DEFAULT_CONFIGURACION_APP,
} from './perfil';

export type {
  PlaceMatchResult,
  PlaceMatchType,
  AutoPlaceCreationOptions,
  PlaceMatchingConfig,
  GeoCoordinates,
  ScoredPlace,
} from './placeMatching';

export { DEFAULT_PLACE_MATCHING_CONFIG, DEFAULT_AUTO_CREATION_OPTIONS } from './placeMatching';
