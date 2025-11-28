/**
 * CALENDAR SCREEN
 *
 * Pantalla de calendario de la aplicación.
 * Mostrará eventos y actividades del viaje en formato calendario.
 *
 * TODO: Implementar calendario con eventos, integración con agenda, etc.
 */

import { View, Text, StyleSheet } from 'react-native';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendario</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
});
