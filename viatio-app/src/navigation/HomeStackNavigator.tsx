/**
 * HOME STACK NAVIGATOR
 *
 * Stack Navigator para el flujo de viajes.
 * Incluye lista de viajes, creación, detalle y subsecciones.
 *
 * NOTA: Las pantallas de viajes compartidos (TripMembers, InviteToTrip, etc.)
 * ahora están integradas aquí en lugar de en un SharedStackNavigator separado.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  TripListScreen,
  CreateTripScreen,
  TripDetailScreen,
  TripAgendaScreen,
  TripDocumentsScreen,
  AddDocumentScreen,
  EditDocumentScreen,
  EditReservationScreen,
  ScanReservationScreen,
} from '@/screens';
import TripReservationsScreen from '@/screens/TripReservationsScreen';
import AddReservationScreen from '@/screens/AddReservationScreen';
import ReservationDetailScreen from '@/screens/ReservationDetailScreen';
import TripMapScreen from '@/screens/TripMapScreen';
import ArchivedTripsScreen from '@/screens/ArchivedTripsScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { AddExpenseScreen } from '@/screens/AddExpenseScreen';
import { AddEventoScreen } from '@/screens/AddEventoScreen';
import { EventoDetailScreen } from '@/screens/EventoDetailScreen';
import AssistantScreen from '@/screens/AssistantScreen';
// Pantallas de viajes compartidos (integradas desde SharedStack)
import {
  TripMembersScreen,
  InviteToTripScreen,
  TripSettlementsScreen,
  RecordSettlementScreen,
  JoinTripByCodeScreen,
  AddSharedExpenseScreen,
} from '@/screens/shared';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

// ============================================
// HOME STACK NAVIGATOR
// ============================================

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TripList" component={TripListScreen} />
      <Stack.Screen name="ArchivedTrips" component={ArchivedTripsScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="TripAgenda" component={TripAgendaScreen} />
      <Stack.Screen name="TripReservations" component={TripReservationsScreen} />
      <Stack.Screen name="TripDocuments" component={TripDocumentsScreen} />
      <Stack.Screen name="AddDocument" component={AddDocumentScreen} />
      <Stack.Screen name="EditDocument" component={EditDocumentScreen} />
      <Stack.Screen name="AddReservation" component={AddReservationScreen} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
      <Stack.Screen name="EditReservation" component={EditReservationScreen} />
      <Stack.Screen name="ScanReservation" component={ScanReservationScreen} />
      <Stack.Screen name="TripMap" component={TripMapScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="AddEvento" component={AddEventoScreen} />
      <Stack.Screen name="EventoDetail" component={EventoDetailScreen} />
      <Stack.Screen name="Assistant" component={AssistantScreen} />
      {/* Pantallas de viajes compartidos */}
      <Stack.Screen name="TripMembers" component={TripMembersScreen} />
      <Stack.Screen name="InviteToTrip" component={InviteToTripScreen} />
      <Stack.Screen name="TripSettlements" component={TripSettlementsScreen} />
      <Stack.Screen name="RecordSettlement" component={RecordSettlementScreen} />
      <Stack.Screen name="AddSharedExpense" component={AddSharedExpenseScreen} />
      <Stack.Screen name="JoinTripByCode" component={JoinTripByCodeScreen} />
    </Stack.Navigator>
  );
}
