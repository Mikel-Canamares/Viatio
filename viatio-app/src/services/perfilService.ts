import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EstadisticasUsuario,
  PreferenciasNotificaciones,
  ConfiguracionApp,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
  DEFAULT_CONFIGURACION_APP,
} from '@/types/perfil';
import { getViajesByUsuario } from './viajesService';
import { getDatabase } from '@/database';

const STORAGE_KEYS = {
  PREFERENCIAS_NOTIFICACIONES: 'viatio_prefs_notif',
  CONFIGURACION_APP: 'viatio_config_app',
};

/**
 * Obtiene las estadísticas del usuario basadas en sus viajes
 */
export async function getEstadisticasUsuario(
  usuarioId: string
): Promise<EstadisticasUsuario> {
  try {
    const db = await getDatabase();
    const hoy = new Date().toISOString().split('T')[0];

    // Obtener todos los viajes del usuario
    const viajes = await getViajesByUsuario(usuarioId);

    // Contar viajes completados (fechaFin < hoy)
    const viajesCompletados = viajes.filter(
      (v) => v.fechaFin && v.fechaFin < hoy
    ).length;

    // Contar viajes próximos (fechaInicio > hoy)
    const viajesProximos = viajes.filter((v) => v.fechaInicio > hoy).length;

    // Extraer países únicos de los destinos
    // El campo destino es un string (ej: "París, Francia" o "Tokyo, Japón")
    // Extraemos el país como la última parte después de la coma
    const paisesSet = new Set<string>();
    viajes.forEach((viaje) => {
      if (viaje.destino) {
        // Intentar extraer el país del formato "Ciudad, País"
        const partes = viaje.destino.split(',').map((p) => p.trim());
        if (partes.length >= 2) {
          // Tomar la última parte como país
          paisesSet.add(partes[partes.length - 1]);
        } else {
          // Si no hay coma, considerar todo el destino como país
          paisesSet.add(viaje.destino);
        }
      }
    });

    // Obtener configuración para la moneda default
    const config = await getConfiguracionApp();

    // Sumar total gastado de todos los gastos del usuario
    const resultGastos = await db.getAllAsync<{ total: number | null }>(
      `SELECT SUM(monto) as total
       FROM gastos
       WHERE usuarioId = ?`,
      [usuarioId]
    );

    const totalGastado = resultGastos[0]?.total || 0;

    return {
      totalViajes: viajes.length,
      viajesCompletados,
      viajesProximos,
      paisesVisitados: paisesSet.size,
      totalGastado,
      monedaDefault: config.monedaDefault,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuario:', error);
    throw new Error('No se pudieron obtener las estadísticas del usuario');
  }
}

/**
 * Obtiene las preferencias de notificaciones del usuario
 */
export async function getPreferenciasNotificaciones(): Promise<PreferenciasNotificaciones> {
  try {
    const data = await AsyncStorage.getItem(
      STORAGE_KEYS.PREFERENCIAS_NOTIFICACIONES
    );

    if (!data) {
      return DEFAULT_PREFERENCIAS_NOTIFICACIONES;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error obteniendo preferencias de notificaciones:', error);
    return DEFAULT_PREFERENCIAS_NOTIFICACIONES;
  }
}

/**
 * Guarda las preferencias de notificaciones del usuario
 */
export async function setPreferenciasNotificaciones(
  prefs: PreferenciasNotificaciones
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PREFERENCIAS_NOTIFICACIONES,
      JSON.stringify(prefs)
    );
  } catch (error) {
    console.error('Error guardando preferencias de notificaciones:', error);
    throw new Error('No se pudieron guardar las preferencias');
  }
}

/**
 * Obtiene la configuración de la aplicación
 */
export async function getConfiguracionApp(): Promise<ConfiguracionApp> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIGURACION_APP);

    if (!data) {
      return DEFAULT_CONFIGURACION_APP;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error obteniendo configuración de la app:', error);
    return DEFAULT_CONFIGURACION_APP;
  }
}

/**
 * Guarda la configuración de la aplicación
 */
export async function setConfiguracionApp(
  config: ConfiguracionApp
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONFIGURACION_APP,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Error guardando configuración de la app:', error);
    throw new Error('No se pudo guardar la configuración');
  }
}

/**
 * Elimina todos los datos del usuario (para cerrar sesión completo o eliminar cuenta)
 */
export async function clearUserData(usuarioId: string): Promise<void> {
  try {
    const db = await getDatabase();

    // Eliminar en orden correcto respetando foreign keys
    await db.runAsync('DELETE FROM gastos WHERE usuarioId = ?', [usuarioId]);
    await db.runAsync('DELETE FROM documentos WHERE usuarioId = ?', [usuarioId]);
    await db.runAsync('DELETE FROM reservas WHERE usuarioId = ?', [usuarioId]);
    await db.runAsync('DELETE FROM actividades WHERE usuarioId = ?', [usuarioId]);
    await db.runAsync('DELETE FROM viajes WHERE usuarioId = ?', [usuarioId]);

    // Eliminar preferencias de AsyncStorage
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PREFERENCIAS_NOTIFICACIONES,
      STORAGE_KEYS.CONFIGURACION_APP,
    ]);

    console.log('Datos del usuario eliminados correctamente');
  } catch (error) {
    console.error('Error eliminando datos del usuario:', error);
    throw new Error('No se pudieron eliminar los datos del usuario');
  }
}
