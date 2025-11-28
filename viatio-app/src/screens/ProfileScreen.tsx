/**
 * PROFILE SCREEN
 *
 * Pantalla de perfil de usuario.
 * Mostrará información del usuario y configuración de la aplicación.
 *
 * TODO: Implementar perfil de usuario, ajustes, logout, etc.
 */

import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { theme } from '@/config';

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil</Text>
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
