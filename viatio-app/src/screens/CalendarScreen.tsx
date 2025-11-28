/**
 * CALENDAR SCREEN
 *
 * Pantalla de calendario de la aplicación.
 * Mostrará eventos y actividades del viaje en formato calendario.
 *
 * TODO: Implementar calendario con eventos, integración con agenda, etc.
 */

import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { theme } from '@/config';

export default function CalendarScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Calendario</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
});
