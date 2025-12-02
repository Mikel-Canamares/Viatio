/**
 * SERVICIO: AGENDA
 *
 * Servicio para construir la agenda diaria de un viaje.
 * Combina días, reservas y lugares en una vista unificada.
 */

import { DiaAgenda, EventoAgenda } from '@/types/diaViaje';
import { getDiasByViajeId } from './diasViajeService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene la agenda completa de un viaje
 * Retorna días con información formateada y eventos asociados
 */
export async function getAgendaByViajeId(viajeId: string): Promise<DiaAgenda[]> {
  const dias = await getDiasByViajeId(viajeId);

  // Por ahora, retornar días sin eventos (se completará cuando existan reservas y lugares)
  return dias.map((dia) => {
    const fecha = parseISO(dia.fecha);
    return {
      dia,
      fecha,
      diaSemana: format(fecha, 'EEEE', { locale: es }), // "lunes", "martes", etc.
      fechaFormateada: format(fecha, "d 'de' MMMM", { locale: es }), // "21 de diciembre"
      eventos: [], // Se poblarán con reservas y lugares
    };
  });
}

/**
 * Función helper para combinar reservas y lugares en eventos
 * Se completará cuando se implementen las tablas de reservas y lugares
 */
export function combinarEventos(
  _reservas: any[], // tipo Reserva cuando exista
  _lugares: any[], // tipo Lugar cuando exista
  _fecha: string
): EventoAgenda[] {
  const eventos: EventoAgenda[] = [];

  // TODO: Filtrar y mapear reservas del día
  // reservas
  //   .filter(r => r.fecha === fecha)
  //   .forEach(r => {
  //     eventos.push({
  //       id: r.id,
  //       tipo: 'reserva',
  //       hora: r.hora,
  //       titulo: r.titulo,
  //       subtitulo: r.subtitulo,
  //       categoria: r.categoria,
  //       ubicacion: r.ubicacion,
  //     });
  //   });

  // TODO: Filtrar y mapear lugares del día
  // lugares
  //   .filter(l => l.fecha === fecha)
  //   .forEach(l => {
  //     eventos.push({
  //       id: l.id,
  //       tipo: 'lugar',
  //       hora: l.hora,
  //       titulo: l.nombre,
  //       subtitulo: l.descripcion,
  //       ubicacion: l.direccion,
  //     });
  //   });

  // Ordenar por hora (eventos sin hora van al final)
  return eventos.sort((a, b) => {
    if (!a.hora) return 1;
    if (!b.hora) return -1;
    return a.hora.localeCompare(b.hora);
  });
}
