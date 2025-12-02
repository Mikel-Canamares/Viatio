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
} from '@/screens';
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
      {/* Las demás rutas se añadirán en fases posteriores:
        - TripReservations
        - AddReservation
        - ReservationDetail
        - TripMap
        - TripDocuments
        - AddDocument
      */}
    </Stack.Navigator>
  );
}
