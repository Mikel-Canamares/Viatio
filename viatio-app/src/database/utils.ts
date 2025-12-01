/**
 * DATABASE UTILS
 *
 * Funciones utilitarias para la base de datos.
 * Incluye generación de IDs, timestamps, validación y limpieza.
 */

import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from './database';
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
