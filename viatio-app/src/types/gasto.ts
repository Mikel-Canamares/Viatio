export type CategoriaGasto =
  | 'transporte'
  | 'alojamiento'
  | 'comida'
  | 'actividades'
  | 'compras'
  | 'otros';

export interface Gasto {
  id: string;
  viajeId: string;
  diaId?: string;
  reservaId?: string; // ID de la reserva asociada (si aplica)
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  moneda: string;
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGastoInput {
  viajeId: string;
  diaId?: string;
  reservaId?: string; // ID de la reserva asociada (si aplica)
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  moneda?: string;
  fecha: string;
}

export interface ResumenGastos {
  total: number;
  porCategoria: Record<CategoriaGasto, number>;
  porDia: Array<{ fecha: string; total: number }>;
  presupuesto?: number;
  restante?: number;
  moneda: string;
}

export const GASTO_CATEGORIAS: Record<CategoriaGasto, {
  label: string;
  icon: string;
  color: string;
}> = {
  transporte: { label: 'Transporte', icon: 'car', color: '#0066CC' },
  alojamiento: { label: 'Alojamiento', icon: 'bed', color: '#16A34A' },
  comida: { label: 'Comida', icon: 'restaurant', color: '#EA580C' },
  actividades: { label: 'Actividades', icon: 'ticket', color: '#8B5CF6' },
  compras: { label: 'Compras', icon: 'bag', color: '#EC4899' },
  otros: { label: 'Otros', icon: 'cash', color: '#6B7280' },
};

/**
 * Mapea una categoría de reserva a categoría de gasto
 */
export function mapReservaToCategoriaGasto(
  categoriaReserva: 'transport' | 'accommodation' | 'food' | 'activity' | 'other'
): CategoriaGasto {
  switch (categoriaReserva) {
    case 'transport':
      return 'transporte';
    case 'accommodation':
      return 'alojamiento';
    case 'food':
      return 'comida';
    case 'activity':
      return 'actividades';
    case 'other':
    default:
      return 'otros';
  }
}
