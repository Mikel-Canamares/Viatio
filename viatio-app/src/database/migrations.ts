/**
 * DATABASE MIGRATIONS
 *
 * Gestiona las migraciones y versionado de la base de datos.
 * Asegura que el esquema esté actualizado.
 */

import * as SQLite from 'expo-sqlite';
import {
  CREATE_TABLES_SQL,
  CREATE_INDEXES_SQL,
  CURRENT_SCHEMA_VERSION,
} from './schema';

// ============================================
// VERSIÓN DE LA BASE DE DATOS
// ============================================

/**
 * Obtiene la versión actual de la base de datos
 */
export async function getCurrentVersion(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    const result = await db.getAllAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM _migrations'
    );

    if (result && result.length > 0 && result[0].version !== null) {
      return result[0].version;
    }

    return 0;
  } catch (error) {
    // Si la tabla no existe, retornar 0
    console.log('Tabla _migrations no existe aún, versión = 0');
    return 0;
  }
}

/**
 * Verifica si se necesita ejecutar migraciones
 */
export async function needsMigration(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  const currentVersion = await getCurrentVersion(db);
  return currentVersion < CURRENT_SCHEMA_VERSION;
}

// ============================================
// EJECUCIÓN DE MIGRACIONES
// ============================================

/**
 * Ejecuta las migraciones necesarias para actualizar la base de datos
 */
export async function runMigrations(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const currentVersion = await getCurrentVersion(db);

  console.log(`[Migrations] Versión actual: ${currentVersion}`);
  console.log(`[Migrations] Versión objetivo: ${CURRENT_SCHEMA_VERSION}`);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    console.log('[Migrations] Base de datos actualizada, no se requieren migraciones');
    return;
  }

  // Ejecutar migraciones según la versión
  if (currentVersion === 0) {
    await migrateToV1(db);
  }

  // Futuras migraciones se añadirán aquí:
  // if (currentVersion < 2) {
  //   await migrateToV2(db);
  // }
  // if (currentVersion < 3) {
  //   await migrateToV3(db);
  // }

  console.log('[Migrations] Migraciones completadas exitosamente');
}

// ============================================
// MIGRACIONES INDIVIDUALES
// ============================================

/**
 * Migración a versión 1: Creación inicial de la base de datos
 */
async function migrateToV1(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v1...');

  try {
    // Iniciar transacción
    await db.execAsync('BEGIN TRANSACTION;');

    // Crear tablas
    console.log('[Migrations] Creando tablas...');
    for (const sql of CREATE_TABLES_SQL) {
      await db.execAsync(sql);
    }

    // Crear índices
    console.log('[Migrations] Creando índices...');
    for (const sql of CREATE_INDEXES_SQL) {
      await db.execAsync(sql);
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [1, now]
    );

    // Commit transacción
    await db.execAsync('COMMIT;');

    console.log('[Migrations] Migración a v1 completada');
  } catch (error) {
    // Rollback en caso de error
    await db.execAsync('ROLLBACK;');
    console.error('[Migrations] Error en migración a v1:', error);
    throw error;
  }
}

// ============================================
// MIGRACIONES FUTURAS
// ============================================

/**
 * Ejemplo de migración futura (v1 -> v2)
 *
 * async function migrateToV2(db: SQLite.SQLiteDatabase): Promise<void> {
 *   console.log('[Migrations] Ejecutando migración a v2...');
 *
 *   try {
 *     await db.execAsync('BEGIN TRANSACTION;');
 *
 *     // ALTER TABLE o nuevas tablas aquí
 *     await db.execAsync('ALTER TABLE viajes ADD COLUMN nuevoCampo TEXT;');
 *
 *     // Registrar migración
 *     const now = new Date().toISOString();
 *     await db.runAsync(
 *       'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
 *       [2, now]
 *     );
 *
 *     await db.execAsync('COMMIT;');
 *     console.log('[Migrations] Migración a v2 completada');
 *   } catch (error) {
 *     await db.execAsync('ROLLBACK;');
 *     console.error('[Migrations] Error en migración a v2:', error);
 *     throw error;
 *   }
 * }
 */
