/**
 * DATABASE
 *
 * Gestión centralizada de la conexión a SQLite.
 * Singleton para asegurar una única instancia de la base de datos.
 */

import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { logError } from '@/utils';

// ============================================
// VARIABLES PRIVADAS
// ============================================

let db: SQLite.SQLiteDatabase | null = null;

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa la base de datos y ejecuta migraciones
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Si ya existe, retornarla
  if (db) {
    console.log('[Database] Base de datos ya inicializada');
    return db;
  }

  try {
    console.log('[Database] Inicializando base de datos...');

    // Abrir base de datos
    db = await SQLite.openDatabaseAsync('viatio.db');
    console.log('[Database] Base de datos abierta: viatio.db');

    // Ejecutar migraciones
    console.log('[Database] Ejecutando migraciones...');
    await runMigrations(db);

    console.log('[Database] Base de datos inicializada correctamente');
    return db;
  } catch (error) {
    logError(error, 'initializeDatabase');
    db = null;
    throw new Error('No se pudo inicializar la base de datos');
  }
}

// ============================================
// ACCESO A LA BASE DE DATOS
// ============================================

/**
 * Obtiene la instancia de la base de datos
 * Si no está inicializada, la inicializa automáticamente
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Si ya existe, retornarla
  if (db) {
    return db;
  }

  // Si no existe, inicializarla
  try {
    return await initializeDatabase();
  } catch (error) {
    logError(error, 'getDatabase');
    throw new Error('No se pudo obtener la base de datos');
  }
}

// ============================================
// CIERRE
// ============================================

/**
 * Cierra la conexión a la base de datos
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      console.log('[Database] Cerrando base de datos...');
      await db.closeAsync();
      db = null;
      console.log('[Database] Base de datos cerrada');
    } catch (error) {
      logError(error, 'closeDatabase');
      db = null;
      throw new Error('Error al cerrar la base de datos');
    }
  }
}
