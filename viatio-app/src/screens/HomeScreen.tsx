/**
 * HOME SCREEN
 *
 * Pantalla principal de la aplicación.
 * Mostrará la lista de viajes del usuario.
 *
 * TODO: Implementar lista de viajes, búsqueda, filtros, etc.
 */

import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { theme } from '@/config';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
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
