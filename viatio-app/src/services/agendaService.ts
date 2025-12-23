/**
 * SERVICIO: AGENDA
 *
 * Servicio para construir la agenda diaria de un viaje.
 * Combina días, reservas y lugares en una vista unificada.
 */

import { DiaAgenda, EventoAgenda } from '@/types/diaViaje';
import { getDiasByViajeId } from './diasViajeService';
import { getReservasByViajeId } from './reservasService';
import { getLugaresByViajeId } from './lugaresService';
import {
  getEventosByViajeId,
  getEventosSinAsignar,
} from './eventosService';
import {
  RESERVA_CATEGORIAS,
  Reserva,
  SUBTIPOS_TRANSPORTE,
  SUBTIPOS_ALOJAMIENTO,
  SUBTIPOS_ACTIVIDAD,
} from '@/types/reserva';
import { Lugar, LUGAR_CATEGORIAS } from '@/types/lugar';
import { EventoPersonalizado, EVENTO_CATEGORIAS } from '@/types/evento';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de colores por categoría
const CATEGORIA_COLORS: Record<string, { bg: string; icon: string }> = {
  transport: { bg: '#DBEAFE', icon: '#3B82F6' },
  accommodation: { bg: '#FEE2E2', icon: '#EF4444' },
  food: { bg: '#FEF3C7', icon: '#F59E0B' },
  activity: { bg: '#D1FAE5', icon: '#10B981' },
  other: { bg: '#F3F4F6', icon: '#6B7280' },
};

/**
 * Obtiene el ícono específico según categoría y subtipo de reserva
 */
function getIconForReserva(reserva: Reserva): string {
  const metadatos = reserva.metadatos;

  if (reserva.categoria === 'transport' && metadatos?.subtipoTransporte) {
    return SUBTIPOS_TRANSPORTE[metadatos.subtipoTransporte].icon;
  }

  if (reserva.categoria === 'accommodation' && metadatos?.subtipoAlojamiento) {
    return SUBTIPOS_ALOJAMIENTO[metadatos.subtipoAlojamiento].icon;
  }

  if (reserva.categoria === 'activity' && metadatos?.subtipoActividad) {
    return SUBTIPOS_ACTIVIDAD[metadatos.subtipoActividad].icon;
  }

  // Fallback al ícono de categoría general
  return RESERVA_CATEGORIAS[reserva.categoria].icon;
}

/**
 * Obtiene la agenda completa de un viaje
 * Retorna días con información formateada y eventos asociados
 */
export async function getAgendaByViajeId(viajeId: string): Promise<DiaAgenda[]> {
  const [dias, reservas, lugares, eventosPersonalizados] = await Promise.all([
    getDiasByViajeId(viajeId),
    getReservasByViajeId(viajeId),
    getLugaresByViajeId(viajeId),
    getEventosByViajeId(viajeId),
  ]);

  return dias.map((dia) => {
    const fecha = parseISO(dia.fecha);
    const eventos = combinarEventos(
      reservas,
      lugares,
      eventosPersonalizados,
      dia.id,
      dia.fecha
    );

    return {
      dia,
      fecha,
      diaSemana: format(fecha, 'EEEE', { locale: es }), // "lunes", "martes", etc.
      fechaFormateada: format(fecha, "d 'de' MMMM", { locale: es }), // "21 de diciembre"
      eventos,
    };
  });
}

/**
 * Función helper para combinar reservas, lugares y eventos personalizados
 */
export function combinarEventos(
  reservas: Reserva[],
  lugares: Lugar[],
  eventosPersonalizados: EventoPersonalizado[],
  diaId: string,
  fecha: string
): EventoAgenda[] {
  const eventos: EventoAgenda[] = [];

  // Filtrar y mapear reservas del día
  reservas
    .filter((r) => r.fechaInicio === fecha)
    .forEach((r) => {
      const categoriaInfo = RESERVA_CATEGORIAS[r.categoria];
      const colors = CATEGORIA_COLORS[r.categoria];
      const iconName = getIconForReserva(r);

      eventos.push({
        id: r.id,
        tipo: 'reserva',
        origen: 'reserva',
        reservaId: r.id,
        lugarId: r.lugarId,
        hora: r.horaInicio,
        horaFin: r.horaFin,
        titulo: r.nombre,
        subtitulo: r.proveedor,
        categoria: categoriaInfo.label,
        iconName,
        iconColor: colors.icon,
        iconBgColor: colors.bg,
        ubicacion: r.ubicacion || r.direccion,
        completado: false,
        referenciaId: r.id,
        referenciaTipo: 'reserva',
      });
    });

  // Filtrar y mapear lugares del día
  // IMPORTANTE: Solo mostrar lugares que NO están vinculados a reservas/eventos
  // para evitar tarjetas duplicadas en la agenda
  const lugaresVinculados = new Set([
    ...reservas.filter((r) => r.lugarId).map((r) => r.lugarId!),
    ...eventosPersonalizados.filter((e) => e.lugarId).map((e) => e.lugarId!),
  ]);

  lugares
    .filter((l) => l.diaId === diaId && !lugaresVinculados.has(l.id))
    .forEach((l) => {
      const categoriaInfo = LUGAR_CATEGORIAS[l.categoria];

      eventos.push({
        id: l.id,
        tipo: 'lugar',
        origen: 'lugar',
        hora: undefined,
        titulo: l.nombre,
        subtitulo: l.descripcion,
        categoria: categoriaInfo.label,
        iconName: categoriaInfo.icon,
        iconColor: categoriaInfo.color,
        iconBgColor: `${categoriaInfo.color}20`,
        ubicacion: l.direccion,
        completado: false,
        referenciaId: l.id,
        referenciaTipo: 'lugar',
      });
    });

  // Filtrar y mapear eventos personalizados del día
  eventosPersonalizados
    .filter((e) => e.diaId === diaId)
    .forEach((e) => {
      const catInfo = EVENTO_CATEGORIAS[e.categoria];

      eventos.push({
        id: e.id,
        tipo: 'reserva', // Mantenemos tipo 'reserva' por compatibilidad visual
        origen: 'evento_personalizado',
        lugarId: e.lugarId, // Incluir lugarId para navegación al mapa
        hora: e.horaInicio,
        horaFin: e.horaFin,
        titulo: e.nombre,
        subtitulo: e.descripcion,
        categoria: catInfo.label,
        iconName: catInfo.icon,
        iconColor: catInfo.color,
        iconBgColor: catInfo.bgColor,
        ubicacion: e.ubicacion,
        completado: e.completado,
        referenciaId: e.id,
        referenciaTipo: 'evento_personalizado',
      });
    });

  // Ordenar por hora (eventos sin hora van al final)
  return eventos.sort((a, b) => {
    if (!a.hora) return 1;
    if (!b.hora) return -1;
    return a.hora.localeCompare(b.hora);
  });
}

/**
 * Obtiene eventos sin asignar de la agenda
 */
export async function getEventosSinAsignarAgenda(
  viajeId: string
): Promise<EventoAgenda[]> {
  try {
    const eventos = await getEventosSinAsignar(viajeId);

    return eventos.map((evento) => {
      const catInfo = EVENTO_CATEGORIAS[evento.categoria];
      return {
        id: evento.id,
        tipo: 'reserva' as const,
        origen: 'evento_personalizado' as const,
        lugarId: evento.lugarId,
        hora: evento.horaInicio,
        horaFin: evento.horaFin,
        titulo: evento.nombre,
        subtitulo: evento.descripcion,
        categoria: catInfo.label,
        iconName: catInfo.icon,
        iconColor: catInfo.color,
        iconBgColor: catInfo.bgColor,
        ubicacion: evento.ubicacion,
        completado: evento.completado,
        referenciaId: evento.id,
        referenciaTipo: 'evento_personalizado' as const,
      };
    });
  } catch (error) {
    console.error('Error al obtener eventos sin asignar:', error);
    return [];
  }
}
