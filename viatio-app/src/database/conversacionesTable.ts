/**
 * TABLA DE CONVERSACIONES DEL ASISTENTE
 *
 * Persiste las conversaciones del asistente para historial.
 * Permite guardar, cargar, reanudar y borrar conversaciones.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'viatio.db';

// ============================================
// CREATE TABLE
// ============================================

export async function createConversacionesTable(): Promise<void> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversaciones (
        id TEXT PRIMARY KEY,
        viajeId TEXT,
        titulo TEXT NOT NULL,
        mensajesJson TEXT NOT NULL,
        contextoJson TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_conversaciones_viajeId
        ON conversaciones(viajeId);

      CREATE INDEX IF NOT EXISTS idx_conversaciones_updatedAt
        ON conversaciones(updatedAt DESC);
    `);

    console.log('✓ Tabla conversaciones creada');
  } catch (error) {
    console.error('Error creando tabla conversaciones:', error);
    throw error;
  }
}

// ============================================
// DROP TABLE (para development/testing)
// ============================================

export async function dropConversacionesTable(): Promise<void> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('DROP TABLE IF EXISTS conversaciones;');
    console.log('✓ Tabla conversaciones eliminada');
  } catch (error) {
    console.error('Error eliminando tabla conversaciones:', error);
    throw error;
  }
}
