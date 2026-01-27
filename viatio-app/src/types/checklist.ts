/**
 * TYPES: CHECKLIST ITEMS
 *
 * Definiciones de tipos para items de checklist de viajes.
 * Los items pueden ser personales (privados) o grupales (sincronizados en viajes compartidos).
 */

export type SeccionChecklist = 'personal' | 'grupal';

export interface ChecklistItem {
  id: string;
  viajeId: string;
  usuarioId: string;
  texto: string;
  completado: boolean;
  orden: number;
  seccion: SeccionChecklist;
  firestoreId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistItemInput {
  viajeId: string;
  texto: string;
  seccion: SeccionChecklist;
  orden?: number;
}

export interface UpdateChecklistItemInput {
  texto?: string;
  completado?: boolean;
  orden?: number;
}

export interface ChecklistSection {
  title: string;
  data: ChecklistItem[];
  seccion: SeccionChecklist;
}
