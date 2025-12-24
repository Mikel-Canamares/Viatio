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

  if (currentVersion < 6) {
    await migrateToV6(db);
  }

  if (currentVersion < 7) {
    await migrateToV7(db);
  }

  if (currentVersion < 8) {
    await migrateToV8(db);
  }

  if (currentVersion < 9) {
    await migrateToV9(db);
  }

  if (currentVersion < 10) {
    await migrateToV10(db);
  }

  if (currentVersion < 11) {
    await migrateToV11(db);
  }

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

/**
 * Migración a versión 6: Añadir campo lugarId a tabla reservas e índices para matching
 * Permite vincular reservas con lugares automáticamente usando Google Places API
 */
async function migrateToV6(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v6...');

  try {
    // Verificar si la columna lugarId ya existe en reservas
    const reservasInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(reservas);'
    );

    const lugarIdExists = reservasInfo.some(col => col.name === 'lugarId');

    if (!lugarIdExists) {
      console.log('[Migrations] Añadiendo columna lugarId a reservas...');
      await db.execAsync('ALTER TABLE reservas ADD COLUMN lugarId TEXT;');
    } else {
      console.log('[Migrations] Columna lugarId ya existe, omitiendo...');
    }

    // Crear índices para optimizar búsquedas de matching
    console.log('[Migrations] Creando índices para place matching...');

    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_reservas_lugarId ON reservas(lugarId);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_reservas_coords ON reservas(latitud, longitud);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_lugares_googlePlaceId ON lugares(googlePlaceId);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_lugares_coords ON lugares(latitud, longitud);');

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [6, now]
    );

    console.log('[Migrations] Migración a v6 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v6:', error);
    throw error;
  }
}

/**
 * Migración a versión 7: Añadir campo destinoPlaceId a tabla viajes
 * Permite almacenar el Google Place ID del destino para obtener fotos
 */
async function migrateToV7(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v7...');

  try {
    // Verificar si la columna destinoPlaceId ya existe en viajes
    const viajesInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(viajes);'
    );

    const columnExists = viajesInfo.some(col => col.name === 'destinoPlaceId');

    if (!columnExists) {
      console.log('[Migrations] Añadiendo columna destinoPlaceId a viajes...');
      await db.execAsync('ALTER TABLE viajes ADD COLUMN destinoPlaceId TEXT;');
    } else {
      console.log('[Migrations] Columna destinoPlaceId ya existe, omitiendo...');
    }

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [7, now]
    );

    console.log('[Migrations] Migración a v7 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v7:', error);
    throw error;
  }
}

/**
 * Migración a versión 8: Placeholder para mantener compatibilidad
 */
async function migrateToV8(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v8...');

  try {
    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [8, now]
    );

    console.log('[Migrations] Migración a v8 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v8:', error);
    throw error;
  }
}

/**
 * Migración a versión 9: Añadir tabla eventos_personalizados
 * Permite a los usuarios crear actividades personalizadas en la agenda
 */
async function migrateToV9(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v9...');

  try {
    // Crear tabla eventos_personalizados
    console.log('[Migrations] Creando tabla eventos_personalizados...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS eventos_personalizados (
        id TEXT PRIMARY KEY NOT NULL,
        viajeId TEXT NOT NULL,
        diaId TEXT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT NOT NULL DEFAULT 'other',
        horaInicio TEXT,
        horaFin TEXT,
        duracionMinutos INTEGER,
        ubicacion TEXT,
        direccion TEXT,
        latitud REAL,
        longitud REAL,
        notas TEXT,
        completado INTEGER NOT NULL DEFAULT 0,
        prioridad TEXT DEFAULT 'media',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE,
        FOREIGN KEY (diaId) REFERENCES dias_viaje(id) ON DELETE SET NULL
      );
    `);

    // Crear índices
    console.log('[Migrations] Creando índices para eventos_personalizados...');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_eventos_viajeId ON eventos_personalizados(viajeId);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_eventos_diaId ON eventos_personalizados(diaId);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos_personalizados(categoria);');

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [9, now]
    );

    console.log('[Migrations] Migración a v9 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v9:', error);
    throw error;
  }
}

/**
 * Migración a versión 10: Añadir campo lugarId a tabla eventos_personalizados
 * Permite vincular eventos personalizados con lugares usando Google Places API
 */
async function migrateToV10(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v10...');

  try {
    // Verificar si la columna lugarId ya existe en eventos_personalizados
    const eventosInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(eventos_personalizados);'
    );

    const lugarIdExists = eventosInfo.some(col => col.name === 'lugarId');

    if (!lugarIdExists) {
      console.log('[Migrations] Añadiendo columna lugarId a eventos_personalizados...');
      await db.execAsync('ALTER TABLE eventos_personalizados ADD COLUMN lugarId TEXT;');
    } else {
      console.log('[Migrations] Columna lugarId ya existe, omitiendo...');
    }

    // Crear índice para lugarId
    console.log('[Migrations] Creando índice para lugarId...');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_eventos_lugarId ON eventos_personalizados(lugarId);');

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [10, now]
    );

    console.log('[Migrations] Migración a v10 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v10:', error);
    throw error;
  }
}

/**
 * Migración a versión 11: Crear tabla reservas_documentos
 * Permite relación many-to-many entre reservas y documentos
 */
async function migrateToV11(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Ejecutando migración a v11...');

  try {
    // Crear tabla reservas_documentos
    console.log('[Migrations] Creando tabla reservas_documentos...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reservas_documentos (
        id TEXT PRIMARY KEY NOT NULL,
        reservaId TEXT NOT NULL,
        documentoId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (reservaId) REFERENCES reservas(id) ON DELETE CASCADE,
        FOREIGN KEY (documentoId) REFERENCES documentos(id) ON DELETE CASCADE,
        UNIQUE(reservaId, documentoId)
      );
    `);

    // Crear índices para optimizar búsquedas
    console.log('[Migrations] Creando índices para reservas_documentos...');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_reservas_documentos_reservaId ON reservas_documentos(reservaId);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_reservas_documentos_documentoId ON reservas_documentos(documentoId);');

    // Migrar datos existentes desde reservas.documentoId
    console.log('[Migrations] Migrando relaciones existentes de reservas con documentos...');
    await db.execAsync(`
      INSERT OR IGNORE INTO reservas_documentos (id, reservaId, documentoId, createdAt)
      SELECT
        lower(hex(randomblob(16))),
        r.id,
        r.documentoId,
        r.updatedAt
      FROM reservas r
      WHERE r.documentoId IS NOT NULL;
    `);

    const migratedCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reservas_documentos'
    );
    console.log(`[Migrations] ${migratedCount?.count || 0} relaciones migradas desde reservas.documentoId`);

    // Registrar migración
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO _migrations (version, appliedAt) VALUES (?, ?)',
      [11, now]
    );

    console.log('[Migrations] Migración a v11 completada');
  } catch (error) {
    console.error('[Migrations] Error en migración a v11:', error);
    throw error;
  }
}
