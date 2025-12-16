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

  if (currentVersion < 2) {
    await migrateToV2(db);
  }

  if (currentVersion < 3) {
    await migrateToV3(db);
  }

  if (currentVersion < 4) {
    await migrateToV4(db);
  }

  if (currentVersion < 5) {
    await migrateToV5(db);
  }

  // Futuras migraciones se añadirán aquí:
  // if (currentVersion < 6) {
  //   await migrateToV6(db);
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
    // Crear tablas (sin transacción, CREATE TABLE IF NOT EXISTS es seguro)
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

    console.log('[Migrations] Migración a v1 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v1:', error);
    throw error;
  }
}

/**
 * Migración a versión 2: Añadir campo documentoId a tabla reservas
 */
async function migrateToV2(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v2...');

  try {
    // Verificar si la columna documentoId ya existe
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(reservas);'
    );

    const columnExists = tableInfo.some(col => col.name === 'documentoId');

    if (!columnExists) {
      // Añadir campo documentoId solo si no existe
      console.log('[Migrations] Añadiendo columna documentoId a reservas...');
      await db.execAsync('ALTER TABLE reservas ADD COLUMN documentoId TEXT;');
    } else {
      console.log('[Migrations] Columna documentoId ya existe, omitiendo...');
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [2, now]
    );

    console.log('[Migrations] Migración a v2 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v2:', error);
    throw error;
  }
}

/**
 * Migración a versión 3: Añadir campo googlePlaceId a tabla lugares
 */
async function migrateToV3(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v3...');

  try {
    // Verificar si la columna googlePlaceId ya existe
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(lugares);'
    );

    const columnExists = tableInfo.some(col => col.name === 'googlePlaceId');

    if (!columnExists) {
      // Añadir campo googlePlaceId solo si no existe
      console.log('[Migrations] Añadiendo columna googlePlaceId a lugares...');
      await db.execAsync('ALTER TABLE lugares ADD COLUMN googlePlaceId TEXT;');
    } else {
      console.log('[Migrations] Columna googlePlaceId ya existe, omitiendo...');
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [3, now]
    );

    console.log('[Migrations] Migración a v3 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v3:', error);
    throw error;
  }
}

/**
 * Migración a versión 4: Añadir campo reservaId a tabla gastos
 * Permite vincular gastos con reservas para sincronización automática
 */
async function migrateToV4(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v4...');

  try {
    // Verificar si la columna reservaId ya existe
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(gastos);'
    );

    const columnExists = tableInfo.some(col => col.name === 'reservaId');

    if (!columnExists) {
      // Añadir campo reservaId solo si no existe
      console.log('[Migrations] Añadiendo columna reservaId a gastos...');
      await db.execAsync('ALTER TABLE gastos ADD COLUMN reservaId TEXT;');

      // Crear índice para reservaId
      console.log('[Migrations] Creando índice para reservaId...');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_gastos_reservaId ON gastos(reservaId);');
    } else {
      console.log('[Migrations] Columna reservaId ya existe, omitiendo...');
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [4, now]
    );

    console.log('[Migrations] Migración a v4 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v4:', error);
    throw error;
  }
}

/**
 * Migración a versión 5: Añadir campo archived a tabla viajes
 * Permite archivar viajes sin eliminarlos permanentemente
 */
async function migrateToV5(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v5...');

  try {
    // Verificar si la columna archived ya existe
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(viajes);'
    );

    const columnExists = tableInfo.some(col => col.name === 'archived');

    if (!columnExists) {
      // Añadir campo archived solo si no existe
      console.log('[Migrations] Añadiendo columna archived a viajes...');
      await db.execAsync('ALTER TABLE viajes ADD COLUMN archived INTEGER DEFAULT 0;');

      // Crear índice para archived
      console.log('[Migrations] Creando índice para archived...');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_viajes_archived ON viajes(archived);');
    } else {
      console.log('[Migrations] Columna archived ya existe, omitiendo...');
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [5, now]
    );

    console.log('[Migrations] Migración a v5 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v5:', error);
    throw error;
  }
}

// ============================================
// MIGRACIONES FUTURAS
// ============================================

/**
 * Ejemplo de migración futura (v5 -> v6)
 *
 * async function migrateToV6(db: SQLite.SQLiteDatabase): Promise<void> {
 *   console.log('[Migrations] Ejecutando migración a v6...');
 *
 *   try {
 *     // Verificar si la columna ya existe
 *     const tableInfo = await db.getAllAsync<{ name: string }>(
 *       'PRAGMA table_info(tabla);'
 *     );
 *
 *     const columnExists = tableInfo.some(col => col.name === 'nuevoCampo');
 *
 *     if (!columnExists) {
 *       await db.execAsync('ALTER TABLE tabla ADD COLUMN nuevoCampo TEXT;');
 *     }
 *
 *     // Registrar migración
 *     const now = new Date().toISOString();
 *     await db.runAsync(
 *       'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
 *       [6, now]
 *     );
 *
 *     console.log('[Migrations] Migración a v6 completada');
 *   } catch (error) {
 *     console.error('[Migrations] Error en migración a v6:', error);
 *     throw error;
 *   }
 * }
 */
