/**
 * DATABASE
 *
 * Configuración de expo-sqlite y esquemas de base de datos.
 * Incluye migraciones, queries y modelos de persistencia offline-first.
 *
 * Ejemplos: db.ts, schema.ts, migrations.ts, tripQueries.ts, etc.
 */

export { initializeDatabase, getDatabase, closeDatabase } from './database';
export { runMigrations, getCurrentVersion, needsMigration } from './migrations';
export { CURRENT_SCHEMA_VERSION, CREATE_TABLES_SQL, CREATE_INDEXES_SQL } from './schema';
