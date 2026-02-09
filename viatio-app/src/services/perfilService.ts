import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EstadisticasUsuario,
  PreferenciasNotificaciones,
  ConfiguracionApp,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
  DEFAULT_CONFIGURACION_APP,
  DEFAULT_PREFERENCIAS_GASTOS_COMPARTIDOS,
  DEFAULT_HORARIO_SILENCIO,
  ModoSilencio,
  HorarioSilencio,
} from '@/types/perfil';
import { getViajesByUsuario } from './viajesService';
import { getDatabase } from '@/database';

const STORAGE_KEYS = {
  PREFERENCIAS_NOTIFICACIONES: 'viatio_prefs_notif',
  CONFIGURACION_APP: 'viatio_config_app',
  ULTIMO_UMBRAL_NOTIFICADO: 'viatio_ultimo_umbral_',
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
    // Los gastos no tienen usuarioId directamente, se accede a través de viajes
    const resultGastos = await db.getAllAsync<{ total: number | null }>(
      `SELECT SUM(g.monto) as total
       FROM gastos g
       INNER JOIN viajes v ON g.viajeId = v.id
       WHERE v.usuarioId = ?`,
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
 * Migra preferencias antiguas al nuevo formato
 * Garantiza compatibilidad con versiones anteriores
 */
function migratePreferencias(
  stored: Partial<PreferenciasNotificaciones>
): PreferenciasNotificaciones {
  return {
    // Master switch (nuevo, default true)
    notificacionesActivas: stored.notificacionesActivas ?? true,

    // Viajes y reservas (existentes)
    recordatoriosViaje: stored.recordatoriosViaje ?? true,
    tiempoAvisoViaje: stored.tiempoAvisoViaje ?? '1d',
    actualizacionesReservas: stored.actualizacionesReservas ?? true,
    tiempoAvisoReserva: stored.tiempoAvisoReserva ?? '3h',
    alertasDocumentos: stored.alertasDocumentos ?? true,

    // Gastos (nuevos)
    alertasPresupuesto: stored.alertasPresupuesto ?? true,
    umbralAlertaPresupuesto: stored.umbralAlertaPresupuesto ?? 75,

    // Gastos compartidos (nuevos, activados por defecto)
    gastosCompartidos: stored.gastosCompartidos ?? DEFAULT_PREFERENCIAS_GASTOS_COMPARTIDOS,

    // Control de silencio (nuevos)
    modoSilencio: stored.modoSilencio ?? 'off',
    horarioSilencio: stored.horarioSilencio ?? DEFAULT_HORARIO_SILENCIO,

    // General (existentes)
    resumenSemanal: stored.resumenSemanal ?? false,
    promociones: stored.promociones ?? false,
  };
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

    // Migrar datos antiguos al nuevo formato
    const stored = JSON.parse(data);
    return migratePreferencias(stored);
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
 * Verifica si estamos dentro del horario de silencio
 */
export function isInSilentHours(horario: HorarioSilencio): boolean {
  if (!horario.activo) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [inicioH, inicioM] = horario.inicio.split(':').map(Number);
  const [finH, finM] = horario.fin.split(':').map(Number);

  const inicioMinutes = inicioH * 60 + inicioM;
  const finMinutes = finH * 60 + finM;

  // Caso normal: inicio < fin (ej: 09:00 - 17:00)
  if (inicioMinutes < finMinutes) {
    return currentMinutes >= inicioMinutes && currentMinutes < finMinutes;
  }

  // Caso nocturno: inicio > fin (ej: 22:00 - 08:00)
  return currentMinutes >= inicioMinutes || currentMinutes < finMinutes;
}

/**
 * Verifica si las notificaciones están activas según las preferencias
 */
export async function shouldSendNotification(
  tipo: 'viaje' | 'reserva' | 'presupuesto' | 'gasto_compartido' | 'liquidacion'
): Promise<boolean> {
  const prefs = await getPreferenciasNotificaciones();

  // Master switch
  if (!prefs.notificacionesActivas) return false;

  // Modo silencio total
  if (prefs.modoSilencio === 'all') return false;

  // Horario de silencio
  if (isInSilentHours(prefs.horarioSilencio)) return false;

  // Modo solo urgentes: solo permitir viajes/reservas
  if (prefs.modoSilencio === 'urgent_only') {
    return tipo === 'viaje' || tipo === 'reserva';
  }

  // Verificar preferencia específica según tipo
  switch (tipo) {
    case 'viaje':
      return prefs.recordatoriosViaje;
    case 'reserva':
      return prefs.actualizacionesReservas;
    case 'presupuesto':
      return prefs.alertasPresupuesto;
    case 'gasto_compartido':
      return prefs.gastosCompartidos.nuevoGasto;
    case 'liquidacion':
      return prefs.gastosCompartidos.liquidacionSolicitada;
    default:
      return true;
  }
}

/**
 * Obtiene el último umbral de presupuesto notificado para un viaje
 */
export async function getUltimoUmbralNotificado(viajeId: string): Promise<number | null> {
  try {
    const key = STORAGE_KEYS.ULTIMO_UMBRAL_NOTIFICADO + viajeId;
    const data = await AsyncStorage.getItem(key);
    return data ? parseInt(data, 10) : null;
  } catch (error) {
    console.error('Error obteniendo último umbral notificado:', error);
    return null;
  }
}

/**
 * Guarda el último umbral de presupuesto notificado para un viaje
 */
export async function setUltimoUmbralNotificado(
  viajeId: string,
  umbral: number
): Promise<void> {
  try {
    const key = STORAGE_KEYS.ULTIMO_UMBRAL_NOTIFICADO + viajeId;
    await AsyncStorage.setItem(key, umbral.toString());
  } catch (error) {
    console.error('Error guardando último umbral notificado:', error);
  }
}

/**
 * Limpia el tracking de umbral notificado para un viaje
 */
export async function clearUmbralNotificado(viajeId: string): Promise<void> {
  try {
    const key = STORAGE_KEYS.ULTIMO_UMBRAL_NOTIFICADO + viajeId;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error limpiando umbral notificado:', error);
  }
}

/**
 * Elimina todos los datos del usuario (para cerrar sesión completo o eliminar cuenta)
 */
export async function clearUserData(usuarioId: string): Promise<void> {
  try {
    const db = await getDatabase();

    // Solo eliminar viajes - el CASCADE DELETE eliminará automáticamente:
    // - dias_viaje (ON DELETE CASCADE)
    // - reservas (ON DELETE CASCADE)
    // - lugares (ON DELETE CASCADE)
    // - documentos (ON DELETE CASCADE)
    // - gastos (ON DELETE CASCADE)
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
