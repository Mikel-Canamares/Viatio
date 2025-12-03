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
 */
export type HomeStackParamList = {
  TripList: undefined;
  CreateTrip: undefined;
  TripDetail: { viajeId: string };
  TripAgenda: { viajeId: string };
  TripReservations: { viajeId: string };
  AddReservation: { viajeId: string; prefillData?: any };
  ReservationDetail: { viajeId: string; reservaId: string };
  EditReservation: { reservaId: string };
  TripMap: { viajeId: string };
  TripDocuments: { viajeId: string };
  AddDocument: { viajeId: string };
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
