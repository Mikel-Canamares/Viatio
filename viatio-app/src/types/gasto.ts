import { BASE_CATEGORIES, mapCategoryToSpanish, mapSpanishToCategory } from '@/config/categories';

/**
 * Categorías de gastos (en español)
 * Mapean a las categorías base del sistema centralizado
 */
export type CategoriaGasto =
  | 'transporte' // maps to 'transport'
  | 'alojamiento' // maps to 'accommodation'
  | 'comida' // maps to 'food'
  | 'actividades' // maps to 'activity'
  | 'compras' // maps to 'shopping'
  | 'otros'; // maps to 'other'

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
  firestoreId?: string; // ID en Firestore (para viajes compartidos)
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

/**
 * Configuración de categorías de gastos
 * Usa el sistema centralizado de colores para mantener consistencia
 */
export const GASTO_CATEGORIAS: Record<
  CategoriaGasto,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  transporte: {
    label: BASE_CATEGORIES.transport.label,
    icon: 'car',
    color: BASE_CATEGORIES.transport.color,
  },
  alojamiento: {
    label: BASE_CATEGORIES.accommodation.label,
    icon: BASE_CATEGORIES.accommodation.icon,
    color: BASE_CATEGORIES.accommodation.color,
  },
  comida: {
    label: BASE_CATEGORIES.food.label,
    icon: BASE_CATEGORIES.food.icon,
    color: BASE_CATEGORIES.food.color,
  },
  actividades: {
    label: BASE_CATEGORIES.activity.label,
    icon: BASE_CATEGORIES.activity.icon,
    color: BASE_CATEGORIES.activity.color,
  },
  compras: {
    label: BASE_CATEGORIES.shopping.label,
    icon: BASE_CATEGORIES.shopping.icon,
    color: BASE_CATEGORIES.shopping.color,
  },
  otros: {
    label: BASE_CATEGORIES.other.label,
    icon: 'cash',
    color: BASE_CATEGORIES.other.color,
  },
};

/**
 * Mapea una categoría de reserva a categoría de gasto
 */
export function mapReservaToCategoriaGasto(
  categoriaReserva: 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping' | 'other'
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
    case 'shopping':
      return 'compras';
    case 'other':
    default:
      return 'otros';
  }
}
