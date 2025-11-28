/**
 * PROFILE SCREEN
 *
 * Pantalla de perfil de usuario.
 * Mostrará información del usuario y configuración de la aplicación.
 *
 * TODO: Implementar perfil de usuario, ajustes, logout, etc.
 */

import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Perfil</Text>
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
