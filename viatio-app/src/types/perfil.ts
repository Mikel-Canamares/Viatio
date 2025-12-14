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

export interface PreferenciasNotificaciones {
  recordatoriosViaje: boolean;
  actualizacionesReservas: boolean;
  alertasDocumentos: boolean;
  resumenSemanal: boolean;
  promociones: boolean;
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
};

export const DEFAULT_CONFIGURACION_APP: ConfiguracionApp = {
  tema: 'system',
  idioma: 'es',
  monedaDefault: 'EUR',
  unidadDistancia: 'km',
  formatoFecha: 'DD/MM/YYYY',
};
