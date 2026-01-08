/**
 * NAVIGATION TYPES
 *
 * Definiciones de tipos para React Navigation.
 * Esto permite autocompletado y type-safety al navegar entre pantallas.
 *
 * IMPORTANTE:
 * - Cada navigator (Stack, Tabs) necesita su propio ParamList
 * - undefined = la ruta no recibe parámetros
 * - Para rutas con parámetros: { rutaId: { id: string; name?: string } }
 *
 * Estos tipos se expandirán conforme añadamos más pantallas y navegadores.
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ============================================
// ROOT TAB NAVIGATOR (Bottom Tabs)
// ============================================
/**
 * ParamList para las tabs principales de la aplicación.
 *
 * Tabs actuales:
 * - Home: Pantalla principal con lista de viajes
 * - Calendar: Vista de calendario con eventos del viaje
 * - Profile: Perfil de usuario y configuración
 *
 * Para añadir una nueva tab:
 * 1. Añade la ruta aquí: NuevaTab: undefined (o con params si los necesita)
 * 2. Crea el screen correspondiente en src/screens/
 * 3. Añade el tab en TabNavigator.tsx
 */
export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Profile: undefined;
};

// ============================================
// HOME STACK NAVIGATOR
// ============================================
/**
 * ParamList para el stack de Home (pantallas relacionadas con viajes).
 *
 * Rutas disponibles:
 * - TripList: Lista de viajes del usuario
 * - CreateTrip: Formulario para crear nuevo viaje
 * - TripDetail: Detalle de un viaje
 * - TripAgenda: Agenda día a día del viaje
 * - TripReservations: Lista de reservas del viaje
 * - AddReservation: Formulario para añadir reserva
 * - ReservationDetail: Detalle de una reserva
 * - TripMap: Mapa con lugares del viaje
 * - TripDocuments: Documentos del viaje
 * - AddDocument: Formulario para añadir documento
 * - Expenses: Lista de gastos del viaje
 * - AddExpense: Formulario para añadir gasto
 */
export type HomeStackParamList = {
  TripList: undefined;
  ArchivedTrips: undefined;
  CreateTrip: undefined;
  TripDetail: { viajeId: string };
  TripAgenda: { viajeId: string };
  TripReservations: { viajeId: string };
  AddReservation: {
    viajeId: string;
    prefillData?: any;
    scannedFiles?: Array<{ uri: string; base64: string; name: string; type: string }>;
  };
  ReservationDetail: { viajeId: string; reservaId: string };
  EditReservation: { reservaId: string };
  ScanReservation: { viajeId: string };
  TripMap: { viajeId: string; lugarId?: string };
  TripDocuments: { viajeId: string };
  AddDocument: { viajeId: string };
  EditDocument: { documentoId: string; nombreActual: string };
  Expenses: { viajeId: string };
  AddExpense: { viajeId: string };
  AddEvento: { viajeId: string; diaId?: string; eventoId?: string };
  EventoDetail: { eventoId: string };
  Assistant: { viajeId?: string };
  // Pantallas de viajes compartidos (integradas desde SharedStack)
  TripMembers: { viajeId: string; firestoreId: string };
  InviteToTrip: { viajeId: string; firestoreId: string };
  TripSettlements: { viajeId: string; firestoreId: string };
  RecordSettlement: {
    viajeId: string;
    firestoreId: string;
    fromUid: string;
    toUid: string;
    amount: number;
  };
  AddSharedExpense: { tripId: string; expenseId?: string };
  ExpenseDetail: { tripId: string; expenseId: string };
  JoinTripByCode: undefined;
};

// ============================================
// PROFILE STACK NAVIGATOR
// ============================================
/**
 * ParamList para el stack de Profile (pantallas relacionadas con el perfil).
 *
 * Rutas disponibles:
 * - ProfileMain: Pantalla principal del perfil
 * - EditProfile: Editar información del perfil
 * - NotificationsSettings: Configuración de notificaciones
 * - Settings: Configuración de la aplicación
 * - Help: Centro de ayuda
 */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  NotificationsSettings: undefined;
  NotificationsManagement: undefined;
  Settings: undefined;
  CopilotSettings: undefined;
  Help: undefined;
};

// ============================================
// SHARED TRIPS STACK NAVIGATOR
// ============================================
/**
 * ParamList para el stack de Viajes Compartidos.
 *
 * Rutas disponibles:
 * - SharedTrips: Lista de viajes compartidos
 * - SharedTripDetail: Detalle de un viaje compartido
 * - CreateSharedTrip: Crear nuevo viaje compartido
 * - EditSharedTrip: Editar viaje compartido
 * - TripMembers: Lista de miembros del viaje
 * - InviteToTrip: Invitar usuarios al viaje
 * - JoinTripByCode: Unirse a viaje con código
 * - SharedExpenses: Gastos compartidos del viaje
 * - AddSharedExpense: Añadir/editar gasto compartido
 * - ExpenseDetail: Detalle de un gasto
 * - TripSettlements: Liquidaciones del viaje
 * - RecordSettlement: Registrar pago de liquidación
 */
export type SharedStackParamList = {
  SharedTrips: undefined;
  SharedTripDetail: { tripId: string };
  CreateSharedTrip: undefined;
  EditSharedTrip: { tripId: string };
  TripMembers: { tripId: string };
  InviteToTrip: { tripId: string };
  JoinTripByCode: undefined;
  SharedExpenses: { tripId: string };
  AddSharedExpense: { tripId: string; expenseId?: string };
  ExpenseDetail: { tripId: string; expenseId: string };
  TripSettlements: { tripId: string };
  RecordSettlement: {
    tripId: string;
    fromUid: string;
    toUid: string;
    amount: number;
  };
};

// ============================================
// STACK NAVIGATOR (TODO: se añadirá después)
// ============================================
/**
 * ParamList para el stack principal (pantallas que se apilan sobre las tabs).
 *
 * Ejemplos de rutas futuras:
 * - TripDetail: { tripId: string }
 * - BookingDetail: { bookingId: string; tripId: string }
 * - AddExpense: { tripId: string }
 * - etc.
 */
export type RootStackParamList = {
  // TODO: Añadir rutas de stack cuando se implementen
  // TripDetail: { tripId: string };
  // BookingDetail: { bookingId: string; tripId: string };
  // AddExpense: { tripId: string };
};

// ============================================
// HELPER TYPES
// ============================================
/**
 * Props para screens de Bottom Tabs
 *
 * Uso en componentes:
 * type Props = RootTabScreenProps<'Home'>;
 */
export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;

/**
 * Props para screens de Stack (cuando se implemente)
 *
 * Uso en componentes:
 * type Props = RootStackScreenProps<'TripDetail'>;
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Props compuestos para screens que están en Stack sobre Tabs
 * (para acceso a navegación de ambos navegadores)
 */
export type CompositeProps<T extends keyof RootStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<RootStackParamList, T>,
    BottomTabScreenProps<RootTabParamList>
  >;

// ============================================
// GLOBAL NAVIGATION TYPE DECLARATION
// ============================================
/**
 * Declara los tipos globalmente para React Navigation.
 * Esto permite que useNavigation() tenga tipos automáticamente.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
