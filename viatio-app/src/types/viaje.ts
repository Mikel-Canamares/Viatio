/**
 * TIPOS: VIAJE
 *
 * Tipos e interfaces para la entidad Viaje.
 * Incluye tipos para crear, actualizar y estadísticas.
 */

/**
 * Viaje completo con todos los campos de la base de datos
 */
export interface Viaje {
  id: string;
  usuarioId: string;
  destino: string;
  destinoPlaceId?: string;
  tripTimeZone?: string; // Timezone IANA del destino (ej: "Asia/Manila")
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
  imagenUrl?: string;
  presupuesto?: number;
  moneda: string;
  numViajeros: number;
  archived: number;
  // Campos para viajes compartidos
  isShared: number; // 0 = individual, 1 = compartido
  firestoreId?: string; // ID del viaje en Firestore (si está migrado)
  syncedAt?: string; // Última sincronización con Firestore
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos necesarios para crear un nuevo viaje
 */
export interface CreateViajeInput {
  destino: string;
  destinoPlaceId?: string;
  tripTimeZone?: string; // Timezone IANA del destino
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
  imagenUrl?: string;
  presupuesto?: number;
  moneda?: string;
  numViajeros?: number;
}

/**
 * Datos que se pueden actualizar en un viaje existente
 */
export interface UpdateViajeInput {
  destino?: string;
  tripTimeZone?: string;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion?: string;
  imagenUrl?: string;
  presupuesto?: number;
  moneda?: string;
  numViajeros?: number;
}

/**
 * Estadísticas calculadas de un viaje
 */
export interface ViajeStats {
  diasTotales: number;
  diasRestantes: number;
  reservasCount: number;
  lugaresCount: number;
  documentosCount: number;
  gastoTotal: number;
}

/**
 * Viaje con estadísticas incluidas
 */
export interface ViajeConStats extends Viaje {
  stats: ViajeStats;
}
