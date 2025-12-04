/**
 * HOME STACK NAVIGATOR
 *
 * Stack Navigator para el flujo de viajes.
 * Incluye lista de viajes, creación, detalle y subsecciones.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  TripListScreen,
  CreateTripScreen,
  TripDetailScreen,
  TripAgendaScreen,
  TripDocumentsScreen,
  AddDocumentScreen,
  EditReservationScreen,
  ScanReservationScreen,
} from '@/screens';
import TripReservationsScreen from '@/screens/TripReservationsScreen';
import AddReservationScreen from '@/screens/AddReservationScreen';
import ReservationDetailScreen from '@/screens/ReservationDetailScreen';
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
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="TripAgenda" component={TripAgendaScreen} />
      <Stack.Screen name="TripReservations" component={TripReservationsScreen} />
      <Stack.Screen name="TripDocuments" component={TripDocumentsScreen} />
      <Stack.Screen name="AddDocument" component={AddDocumentScreen} />
      <Stack.Screen name="AddReservation" component={AddReservationScreen} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
      <Stack.Screen name="EditReservation" component={EditReservationScreen} />
      <Stack.Screen name="ScanReservation" component={ScanReservationScreen} />
      {/* Las demás rutas se añadirán en fases posteriores:
        - TripMap
      */}
    </Stack.Navigator>
  );
}
