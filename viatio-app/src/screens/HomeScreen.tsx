/**
 * HOME SCREEN
 *
 * Pantalla principal de la aplicación.
 * Mostrará la lista de viajes del usuario.
 *
 * TODO: Implementar lista de viajes, búsqueda, filtros, etc.
 */

import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
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
