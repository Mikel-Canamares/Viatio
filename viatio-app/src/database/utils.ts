/**
 * DATABASE UTILS
 *
 * Funciones utilitarias para la base de datos.
 * Incluye generación de IDs, timestamps, validación y limpieza.
 */

import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { getDatabase, closeDatabase } from './database';
import { logError } from '@/utils';

// ============================================
// GENERACIÓN DE IDS Y TIMESTAMPS
// ============================================

/**
 * Genera un UUID v4 único para usar como ID
 */
export function generateId(): string {
  return Crypto.randomUUID();
}

/**
 * Obtiene el timestamp actual en formato ISO
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================
// LIMPIEZA DE BASE DE DATOS
// ============================================

/**
 * Limpia todos los datos de la base de datos
 * ADVERTENCIA: Esto borra TODOS los datos (excepto migraciones)
 * Solo usar en desarrollo/testing
 */
export async function clearDatabase(): Promise<void> {
  try {
    console.log('[Database Utils] Limpiando base de datos...');

    const db = await getDatabase();

    // Deshabilitar foreign keys temporalmente
    await db.execAsync('PRAGMA foreign_keys = OFF;');

    // Limpiar todas las tablas (excepto _migrations)
    await db.execAsync('DELETE FROM gastos;');
    await db.execAsync('DELETE FROM documentos;');
    await db.execAsync('DELETE FROM lugares;');
    await db.execAsync('DELETE FROM reservas;');
    await db.execAsync('DELETE FROM dias_viaje;');
    await db.execAsync('DELETE FROM viajes;');

    // Rehabilitar foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    console.log('[Database Utils] Base de datos limpiada correctamente');
  } catch (error) {
    logError(error, 'clearDatabase');
    throw new Error('Error al limpiar la base de datos');
  }
}

/**
 * LIMPIEZA PROFUNDA: Elimina completamente el archivo de base de datos
 * y fuerza recreación desde cero
 *
 * Esto resuelve problemas de instancias corruptas de SQLite
 * ADVERTENCIA: Borra TODOS los datos permanentemente
 */
export async function deepCleanDatabase(): Promise<void> {
  try {
    console.log('[Database Utils] 🔥 Iniciando limpieza profunda de SQLite...');

    // PASO 1: Cerrar cualquier conexión abierta
    try {
      await closeDatabase();
      console.log('[Database Utils] ✓ Conexión cerrada');
    } catch (e) {
      console.log('[Database Utils] Conexión ya cerrada o no existente');
    }

    // PASO 2: Eliminar archivos de la base de datos usando deleteDatabaseAsync
    try {
      await SQLite.deleteDatabaseAsync('viatio.db');
      console.log('[Database Utils] ✓ Base de datos eliminada completamente');
    } catch (e) {
      console.log('[Database Utils] Error al eliminar DB (puede no existir):', e);
    }

    // PASO 3: Forzar recreación limpia
    // Al llamar getDatabase(), se creará una base de datos nueva con migraciones frescas
    console.log('[Database Utils] 🔄 Recreando base de datos...');
    const newDb = await getDatabase();

    // Verificar que la nueva DB funciona
    await newDb.execAsync('SELECT 1');
    console.log('[Database Utils] ✅ Base de datos recreada exitosamente');

    console.log('[Database Utils] 🎉 Limpieza profunda completada');
  } catch (error) {
    logError(error, 'deepCleanDatabase');
    throw new Error('Error en limpieza profunda de la base de datos');
  }
}

// ============================================
// VALIDACIÓN DE SCHEMA
// ============================================

/**
 * Verifica que todas las tablas necesarias existen en la base de datos
 */
export async function validateSchema(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  try {
    console.log('[Database Utils] Validando esquema de base de datos...');

    // Lista de tablas esperadas
    const expectedTables = [
      'viajes',
      'dias_viaje',
      'reservas',
      'lugares',
      'documentos',
      'gastos',
      '_migrations',
    ];

    // Consultar tablas existentes
    const result = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const existingTables = result.map((row) => row.name);

    // Verificar que todas las tablas esperadas existen
    for (const tableName of expectedTables) {
      if (!existingTables.includes(tableName)) {
        console.error(`[Database Utils] Tabla faltante: ${tableName}`);
        return false;
      }
    }

    console.log('[Database Utils] Esquema válido - todas las tablas existen');
    return true;
  } catch (error) {
    logError(error, 'validateSchema');
    return false;
  }
}
