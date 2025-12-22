export interface PerfilUsuario {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  telefono?: string;
  createdAt: string;
}

export interface EstadisticasUsuario {
  totalViajes: number;
  viajesCompletados: number;
  viajesProximos: number;
  paisesVisitados: number;
  totalGastado: number;
  monedaDefault: string;
}

// Tipos de antelación para notificaciones
export type TiempoAntelacion = 'disabled' | '1h' | '3h' | '1d' | '3d' | '1w';

export interface PreferenciasNotificaciones {
  recordatoriosViaje: boolean;
  actualizacionesReservas: boolean;
  alertasDocumentos: boolean;
  resumenSemanal: boolean;
  promociones: boolean;
  // Tiempos de antelación para diferentes tipos de avisos
  tiempoAvisoViaje: TiempoAntelacion; // Avisar X antes del inicio del viaje
  tiempoAvisoReserva: TiempoAntelacion; // Avisar X antes de cada reserva
}

export interface ConfiguracionApp {
  tema: 'light' | 'dark' | 'system';
  idioma: string;
  monedaDefault: string;
  unidadDistancia: 'km' | 'mi';
  formatoFecha: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

export const IDIOMAS_DISPONIBLES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
];

export const MONEDAS_DISPONIBLES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'MXN', symbol: '$', label: 'Peso Mexicano' },
  { code: 'ARS', symbol: '$', label: 'Peso Argentino' },
  { code: 'COP', symbol: '$', label: 'Peso Colombiano' },
];

export const DEFAULT_PREFERENCIAS_NOTIFICACIONES: PreferenciasNotificaciones = {
  recordatoriosViaje: true,
  actualizacionesReservas: true,
  alertasDocumentos: true,
  resumenSemanal: false,
  promociones: false,
  tiempoAvisoViaje: '1d', // 1 día antes por defecto
  tiempoAvisoReserva: '3h', // 3 horas antes por defecto
};

// Configuración de opciones de tiempo de antelación
export const TIEMPOS_ANTELACION: Record<TiempoAntelacion, {
  label: string;
  descripcion: string;
  segundos: number | null; // null para 'disabled'
}> = {
  disabled: {
    label: 'Desactivado',
    descripcion: 'No recibir avisos',
    segundos: null,
  },
  '1h': {
    label: '1 hora antes',
    descripcion: 'Avisar 1 hora antes',
    segundos: 3600,
  },
  '3h': {
    label: '3 horas antes',
    descripcion: 'Avisar 3 horas antes',
    segundos: 10800,
  },
  '1d': {
    label: '1 día antes',
    descripcion: 'Avisar 1 día antes',
    segundos: 86400,
  },
  '3d': {
    label: '3 días antes',
    descripcion: 'Avisar 3 días antes',
    segundos: 259200,
  },
  '1w': {
    label: '1 semana antes',
    descripcion: 'Avisar 1 semana antes',
    segundos: 604800,
  },
};

export const DEFAULT_CONFIGURACION_APP: ConfiguracionApp = {
  tema: 'system',
  idioma: 'es',
  monedaDefault: 'EUR',
  unidadDistancia: 'km',
  formatoFecha: 'DD/MM/YYYY',
};
