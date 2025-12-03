/**
 * SERVICIO: AGENDA
 *
 * Servicio para construir la agenda diaria de un viaje.
 * Combina días, reservas y lugares en una vista unificada.
 */

import { DiaAgenda, EventoAgenda } from '@/types/diaViaje';
import { getDiasByViajeId } from './diasViajeService';
import { getReservasByViajeId } from './reservasService';
import { RESERVA_CATEGORIAS, Reserva } from '@/types/reserva';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene la agenda completa de un viaje
 * Retorna días con información formateada y eventos asociados
 */
export async function getAgendaByViajeId(viajeId: string): Promise<DiaAgenda[]> {
  const [dias, reservas] = await Promise.all([
    getDiasByViajeId(viajeId),
    getReservasByViajeId(viajeId),
  ]);

  return dias.map((dia) => {
    const fecha = parseISO(dia.fecha);
    const eventos = combinarEventos(reservas, [], dia.fecha);

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
  _lugares: any[],
  fecha: string
): EventoAgenda[] {
  const eventos: EventoAgenda[] = [];

  // Filtrar y mapear reservas del día
  reservas
    .filter((r) => r.fechaInicio === fecha)
    .forEach((r) => {
      const categoriaInfo = RESERVA_CATEGORIAS[r.categoria];
      eventos.push({
        id: r.id,
        tipo: 'reserva',
        hora: r.horaInicio,
        titulo: r.nombre,
        subtitulo: r.proveedor,
        categoria: categoriaInfo.label,
        ubicacion: r.ubicacion || r.direccion,
      });
    });

  // TODO: Filtrar y mapear lugares del día cuando se implementen
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
