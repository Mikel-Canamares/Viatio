/**
 * TYPES: DOCUMENTO
 *
 * Tipos para la gestión de documentos de viaje.
 * Incluye pasaportes, billetes, confirmaciones, seguros, etc.
 */

export type CategoriaDocumento =
  | 'identidad'      // Pasaportes, DNI
  | 'transporte'     // Billetes de avión, tren
  | 'alojamiento'    // Confirmaciones de hotel
  | 'seguro'         // Pólizas de seguro
  | 'actividades'    // Entradas, reservas
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

export const DOCUMENTO_CATEGORIAS: Record<
  CategoriaDocumento,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  identidad: { label: 'Identidad', icon: 'card', color: '#3B82F6' },
  transporte: { label: 'Transporte', icon: 'airplane', color: '#0066CC' },
  alojamiento: { label: 'Alojamiento', icon: 'bed', color: '#16A34A' },
  seguro: { label: 'Seguro', icon: 'shield-checkmark', color: '#8B5CF6' },
  actividades: { label: 'Actividades', icon: 'ticket', color: '#F59E0B' },
  otros: { label: 'Otros', icon: 'document', color: '#6B7280' },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
