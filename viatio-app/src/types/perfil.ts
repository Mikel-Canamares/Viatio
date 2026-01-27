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

// Umbrales de alerta de presupuesto
export type UmbralPresupuesto = 50 | 75 | 90;

// Modos de silencio
export type ModoSilencio = 'off' | 'urgent_only' | 'all';

// Preferencias de gastos compartidos
export interface PreferenciasGastosCompartidos {
  nuevoGasto: boolean;
  gastoEditado: boolean;
  gastoEliminado: boolean;
  liquidacionSolicitada: boolean;
  liquidacionCompletada: boolean;
}

// Configuración de horario de silencio
export interface HorarioSilencio {
  activo: boolean;
  inicio: string; // formato "HH:mm" ej: "22:00"
  fin: string;    // formato "HH:mm" ej: "08:00"
}

export interface PreferenciasNotificaciones {
  // === MASTER SWITCH ===
  notificacionesActivas: boolean;

  // === VIAJES Y RESERVAS ===
  recordatoriosViaje: boolean;
  tiempoAvisoViaje: TiempoAntelacion;
  actualizacionesReservas: boolean;
  tiempoAvisoReserva: TiempoAntelacion;
  alertasDocumentos: boolean;

  // === GASTOS ===
  alertasPresupuesto: boolean;
  umbralAlertaPresupuesto: UmbralPresupuesto;

  // === GASTOS COMPARTIDOS ===
  gastosCompartidos: PreferenciasGastosCompartidos;

  // === CONTROL DE SILENCIO ===
  modoSilencio: ModoSilencio;
  horarioSilencio: HorarioSilencio;

  // === GENERAL ===
  resumenSemanal: boolean;
  promociones: boolean;
}

export interface ConfiguracionApp {
  tema: 'light' | 'dark' | 'system';
  idioma: string;
  monedaDefault: string;
  unidadDistancia: 'km' | 'mi';
  formatoFecha: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  homeTimeZone?: string; // Timezone IANA del lugar "casa" del usuario (ej: "Europe/Madrid")
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

export const DEFAULT_PREFERENCIAS_GASTOS_COMPARTIDOS: PreferenciasGastosCompartidos = {
  nuevoGasto: true,
  gastoEditado: true,
  gastoEliminado: true,
  liquidacionSolicitada: true,
  liquidacionCompletada: true,
};

export const DEFAULT_HORARIO_SILENCIO: HorarioSilencio = {
  activo: false,
  inicio: '22:00',
  fin: '08:00',
};

export const DEFAULT_PREFERENCIAS_NOTIFICACIONES: PreferenciasNotificaciones = {
  // Master switch
  notificacionesActivas: true,

  // Viajes y reservas
  recordatoriosViaje: true,
  tiempoAvisoViaje: '1d',
  actualizacionesReservas: true,
  tiempoAvisoReserva: '3h',
  alertasDocumentos: true,

  // Gastos
  alertasPresupuesto: true,
  umbralAlertaPresupuesto: 75,

  // Gastos compartidos (activados por defecto)
  gastosCompartidos: DEFAULT_PREFERENCIAS_GASTOS_COMPARTIDOS,

  // Control de silencio
  modoSilencio: 'off',
  horarioSilencio: DEFAULT_HORARIO_SILENCIO,

  // General
  resumenSemanal: false,
  promociones: false,
};

// Configuración de opciones de tiempo de antelación
// Opciones de umbral de presupuesto
export const UMBRALES_PRESUPUESTO: Record<UmbralPresupuesto, {
  label: string;
  descripcion: string;
}> = {
  50: {
    label: '50%',
    descripcion: 'Alerta temprana al gastar la mitad',
  },
  75: {
    label: '75%',
    descripcion: 'Alerta moderada al gastar 3/4 partes',
  },
  90: {
    label: '90%',
    descripcion: 'Alerta crítica cerca del límite',
  },
};

// Opciones de modo silencio
export const MODOS_SILENCIO: Record<ModoSilencio, {
  label: string;
  descripcion: string;
}> = {
  off: {
    label: 'Desactivado',
    descripcion: 'Recibir todas las notificaciones',
  },
  urgent_only: {
    label: 'Solo urgentes',
    descripcion: 'Solo viajes/reservas en las próximas 24h',
  },
  all: {
    label: 'Silenciar todo',
    descripcion: 'No recibir ninguna notificación',
  },
};

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
  homeTimeZone: undefined, // Se detectará automáticamente del dispositivo
};
