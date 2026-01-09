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

// Flag para saber si ya se ejecutaron las migraciones
let migrationsRun = false;

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa la base de datos y ejecuta migraciones
 * IMPORTANTE: No cachear la instancia, expo-sqlite maneja el singleton internamente
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
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

    console.log('[Database] Base de datos inicializada correctamente');
    return db;
  } catch (error) {
    logError(error, 'initializeDatabase');
    throw new Error('No se pudo inicializar la base de datos');
  }
}

// ============================================
// ACCESO A LA BASE DE DATOS
// ============================================

/**
 * Obtiene la instancia de la base de datos
 * IMPORTANTE: Siempre abre la conexión fresh, expo-sqlite maneja el singleton
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    // Siempre usar openDatabaseAsync, que internamente maneja el singleton
    const db = await SQLite.openDatabaseAsync('viatio.db');

    // Ejecutar migraciones solo la primera vez
    if (!migrationsRun) {
      console.log('[Database] Ejecutando migraciones...');
      await runMigrations(db);
      migrationsRun = true;
    }

    return db;
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
 * NOTA: No es necesario llamar esto en uso normal, expo-sqlite maneja el ciclo de vida
 */
export async function closeDatabase(): Promise<void> {
  try {
    console.log('[Database] Cerrando base de datos...');
    const db = await SQLite.openDatabaseAsync('viatio.db');
    await db.closeAsync();
    migrationsRun = false; // Reset flag para cuando se vuelva a abrir
    console.log('[Database] Base de datos cerrada');
  } catch (error) {
    logError(error, 'closeDatabase');
    throw new Error('Error al cerrar la base de datos');
  }
}
