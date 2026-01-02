import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SharedStackParamList } from './types';

import {
  SharedTripsScreen,
  SharedTripDetailScreen,
  TripMembersScreen,
  SharedExpensesScreen,
  AddSharedExpenseScreen,
  ExpenseDetailScreen,
  RecordSettlementScreen,
  TripSettlementsScreen,
  CreateSharedTripScreen,
  JoinTripByCodeScreen,
  InviteToTripScreen,
} from '@/screens/shared';

const Stack = createNativeStackNavigator<SharedStackParamList>();

export function SharedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SharedTrips" component={SharedTripsScreen} />
      <Stack.Screen name="SharedTripDetail" component={SharedTripDetailScreen} />
      <Stack.Screen name="CreateSharedTrip" component={CreateSharedTripScreen} />
      <Stack.Screen name="TripMembers" component={TripMembersScreen} />
      <Stack.Screen name="InviteToTrip" component={InviteToTripScreen} />
      <Stack.Screen name="JoinTripByCode" component={JoinTripByCodeScreen} />
      <Stack.Screen name="SharedExpenses" component={SharedExpensesScreen} />
      <Stack.Screen name="AddSharedExpense" component={AddSharedExpenseScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="TripSettlements" component={TripSettlementsScreen} />
      <Stack.Screen name="RecordSettlement" component={RecordSettlementScreen} />
    </Stack.Navigator>
  );
}
