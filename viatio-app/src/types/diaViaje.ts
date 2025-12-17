/**
 * TIPOS: DÍA DE VIAJE Y AGENDA
 *
 * Define las interfaces para los días de viaje y eventos de agenda.
 * Usado en CalendarScreen y TripDetailScreen.
 */

export interface DiaViaje {
  id: string;
  viajeId: string;
  fecha: string; // ISO date
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventoAgenda {
  id: string;
  tipo: 'reserva' | 'lugar';
  reservaId?: string; // ID de la reserva si tipo === 'reserva'
  hora?: string;
  titulo: string;
  subtitulo?: string;
  categoria?: string;
  iconName: string; // Nombre del icono Ionicons
  iconColor: string; // Color del icono
  iconBgColor: string; // Color de fondo del icono
  ubicacion?: string;
}

export interface DiaAgenda {
  dia: DiaViaje;
  fecha: Date;
  diaSemana: string; // "Lunes", "Martes", etc.
  fechaFormateada: string; // "21 de diciembre"
  eventos: EventoAgenda[];
}
