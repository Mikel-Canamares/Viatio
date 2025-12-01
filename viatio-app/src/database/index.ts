/**
 * DATABASE
 *
 * Configuración de expo-sqlite y esquemas de base de datos.
 * Incluye migraciones, queries y modelos de persistencia offline-first.
 *
 * Ejemplos: db.ts, schema.ts, migrations.ts, tripQueries.ts, etc.
 */

export { initializeDatabase, getDatabase, closeDatabase } from './database';
export { generateId, getCurrentTimestamp, clearDatabase } from './utils';
export { CURRENT_SCHEMA_VERSION } from './schema';
