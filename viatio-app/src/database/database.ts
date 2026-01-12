/**
 * DATABASE
 *
 * Gestión centralizada de la conexión a SQLite.
 * Usa openDatabaseAsync de expo-sqlite que maneja internamente el singleton.
 */

import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { logError } from '@/utils';

// ============================================
// VARIABLES PRIVADAS
// ============================================

// Singleton de base de datos (reutilizar la misma instancia)
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Promise de inicialización para evitar múltiples conexiones concurrentes
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Flag para saber si ya se ejecutaron las migraciones
let migrationsRun = false;


// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa la base de datos y ejecuta migraciones
 * IMPORTANTE: Singleton para asegurar una única instancia de la base de datos.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Si ya existe, retornarla
  if (dbInstance) {
    console.log('[Database] Base de datos ya inicializada');
    return dbInstance;
  }

  try {
    console.log('[Database] Inicializando base de datos...');

    // Abrir base de datos (expo-sqlite maneja el singleton internamente)
    const db = await SQLite.openDatabaseAsync('viatio.db');
    console.log('[Database] Base de datos abierta: viatio.db');

    // Ejecutar migraciones solo una vez
    if (!migrationsRun) {
      console.log('[Database] Ejecutando migraciones...');
      await runMigrations(db);
      migrationsRun = true;
    } else {
      console.log('[Database] Migraciones ya ejecutadas, omitiendo...');
    }

    // Guardar instancia para reutilización
    dbInstance = db;

    console.log('[Database] Base de datos inicializada correctamente');
    return db;
  } catch (error) {
    logError(error, 'initializeDatabase');
    dbInstance = null;
    throw new Error('No se pudo inicializar la base de datos');
  }
}

// ============================================
// ACCESO A LA BASE DE DATOS
// ============================================

/**
 * Obtiene la instancia de la base de datos con singleton pattern correcto
 *
 * SI no está inicializada, la inicializa automáticamente
 * IMPORTANTE: Siempre abrir la conexión fresh, expo-sqlite maneja el singleton
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    // Si ya tenemos una instancia válida, reutilizarla
    if (dbInstance) {
      return dbInstance;
    }

    // Si hay una inicialización en progreso, esperar a que termine
    if (initPromise) {
      return await initPromise;
    }

    // Inicializar base de datos (solo se ejecuta una vez)
    initPromise = (async () => {
      console.log('[Database] Abriendo base de datos...');

      // Abrir conexión (expo-sqlite maneja el singleton internamente)
      const db = await SQLite.openDatabaseAsync('viatio.db');

      // PASO 1: Configurar WAL mode para mejor concurrencia en Android
      // WAL permite lecturas y escrituras concurrentes, reduciendo bloqueos
      try {
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync('PRAGMA synchronous = NORMAL;');
        console.log('[Database] WAL mode habilitado');
      } catch (e) {
        console.warn('[Database] No se pudo habilitar WAL mode:', e);
      }

      // PASO 2: Ejecutar migraciones solo la primera vez
      if (!migrationsRun) {
        console.log('[Database] Ejecutando migraciones...');
        await runMigrations(db);
        migrationsRun = true;
      }

      // Guardar instancia para reutilización
      dbInstance = db;
      console.log('[Database] Base de datos lista');

      return db;
    })();

    try {
      const db = await initPromise;
      return db;
    } finally {
      // Limpiar promise de inicialización (pero mantener dbInstance)
      initPromise = null;
    }
  } catch (error) {
    // Limpiar estado en caso de error
    dbInstance = null;
    initPromise = null;
    logError(error, 'getDatabase');
    throw new Error('No se pudo obtener la base de datos');
  }
}


// ============================================
// CIERRE
// ============================================

/**
 * Cierra la conexión a la base de datos
 *
 * NOTA: No es necesario llamar esto en uso normal, expo-sqlite maneja el ciclo de vida
 */
export async function closeDatabase(): Promise<void> {
  try {
    console.log('[Database] Cerrando base de datos...');

    const db = await SQLite.openDatabaseAsync('viatio.db');
    await db.closeAsync();

    // Reset flag para cuando se vuelva a abrir
    migrationsRun = false;
    dbInstance = null;

    console.log('[Database] Base de datos cerrada');
  } catch (error) {
    logError(error, 'closeDatabase');
    dbInstance = null;
    throw new Error('Error al cerrar la base de datos');
  }
}
