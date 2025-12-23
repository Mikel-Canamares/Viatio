/**
 * TYPES: DOCUMENTO
 *
 * Tipos para la gestión de documentos de viaje.
 * Incluye pasaportes, billetes, confirmaciones, seguros, etc.
 */

import { BASE_CATEGORIES, SPECIAL_DOCUMENT_CATEGORIES, getDocumentCategoryConfig } from '@/config/categories';

/**
 * Categorías de documentos (en español)
 * Incluye categorías especiales (identidad, seguro) además de las base
 */
export type CategoriaDocumento =
  | 'identidad' // Pasaportes, DNI (categoría especial)
  | 'transporte' // Billetes de avión, tren
  | 'alojamiento' // Confirmaciones de hotel
  | 'seguro' // Pólizas de seguro (categoría especial)
  | 'actividades' // Entradas, reservas
  | 'otros';

export type TipoArchivo = 'pdf' | 'image' | 'other';

export interface Documento {
  id: string;
  viajeId: string;
  nombre: string;
  categoria: CategoriaDocumento;
  tipoArchivo: TipoArchivo;
  rutaArchivo: string;
  tamano: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentoInput {
  viajeId: string;
  nombre: string;
  categoria: CategoriaDocumento;
  tipoArchivo: TipoArchivo;
  rutaArchivo: string;
  tamano: number;
}

/**
 * Configuración de categorías de documentos
 * Usa el sistema centralizado de colores para mantener consistencia
 * Incluye categorías especiales propias de documentos (identidad, seguro)
 */
export const DOCUMENTO_CATEGORIAS: Record<
  CategoriaDocumento,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  identidad: {
    label: SPECIAL_DOCUMENT_CATEGORIES.identity.label,
    icon: SPECIAL_DOCUMENT_CATEGORIES.identity.icon,
    color: SPECIAL_DOCUMENT_CATEGORIES.identity.color,
  },
  transporte: {
    label: BASE_CATEGORIES.transport.label,
    icon: BASE_CATEGORIES.transport.icon,
    color: BASE_CATEGORIES.transport.color,
  },
  alojamiento: {
    label: BASE_CATEGORIES.accommodation.label,
    icon: BASE_CATEGORIES.accommodation.icon,
    color: BASE_CATEGORIES.accommodation.color,
  },
  seguro: {
    label: SPECIAL_DOCUMENT_CATEGORIES.insurance.label,
    icon: SPECIAL_DOCUMENT_CATEGORIES.insurance.icon,
    color: SPECIAL_DOCUMENT_CATEGORIES.insurance.color,
  },
  actividades: {
    label: BASE_CATEGORIES.activity.label,
    icon: BASE_CATEGORIES.activity.icon,
    color: BASE_CATEGORIES.activity.color,
  },
  otros: {
    label: BASE_CATEGORIES.other.label,
    icon: 'document',
    color: BASE_CATEGORIES.other.color,
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
