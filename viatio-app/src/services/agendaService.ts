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
  RESERVA_CATEGORIAS,
  Reserva,
  SUBTIPOS_TRANSPORTE,
  SUBTIPOS_ALOJAMIENTO,
  SUBTIPOS_ACTIVIDAD,
} from '@/types/reserva';
import { Lugar, LUGAR_CATEGORIAS } from '@/types/lugar';
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
  const [dias, reservas, lugares] = await Promise.all([
    getDiasByViajeId(viajeId),
    getReservasByViajeId(viajeId),
    getLugaresByViajeId(viajeId),
  ]);

  return dias.map((dia) => {
    const fecha = parseISO(dia.fecha);
    const eventos = combinarEventos(reservas, lugares, dia.id, dia.fecha);

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
 * Función helper para combinar reservas y lugares en eventos
 */
export function combinarEventos(
  reservas: Reserva[],
  lugares: Lugar[],
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
        reservaId: r.id,
        lugarId: r.lugarId, // Incluir lugarId si la reserva tiene un lugar asociado
        hora: r.horaInicio,
        titulo: r.nombre,
        subtitulo: r.proveedor,
        categoria: categoriaInfo.label,
        iconName,
        iconColor: colors.icon,
        iconBgColor: colors.bg,
        ubicacion: r.ubicacion || r.direccion,
      });
    });

  // Filtrar y mapear lugares del día
  lugares
    .filter((l) => l.diaId === diaId)
    .forEach((l) => {
      const categoriaInfo = LUGAR_CATEGORIAS[l.categoria];

      eventos.push({
        id: l.id,
        tipo: 'lugar',
        hora: undefined, // Los lugares no tienen hora específica
        titulo: l.nombre,
        subtitulo: l.descripcion,
        categoria: categoriaInfo.label,
        iconName: categoriaInfo.icon,
        iconColor: categoriaInfo.color,
        iconBgColor: `${categoriaInfo.color}20`, // Color con 20% opacidad
        ubicacion: l.direccion,
      });
    });

  // Ordenar por hora (eventos sin hora van al final)
  return eventos.sort((a, b) => {
    if (!a.hora) return 1;
    if (!b.hora) return -1;
    return a.hora.localeCompare(b.hora);
  });
}
