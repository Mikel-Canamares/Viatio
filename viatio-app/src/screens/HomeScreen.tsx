/**
 * HOME SCREEN
 *
 * Pantalla principal de la aplicación.
 * Mostrará la lista de viajes del usuario.
 *
 * TODO: Implementar lista de viajes, búsqueda, filtros, etc.
 */

import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer, PageHeader } from '@/components';
import { theme } from '@/config';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="Mis Viajes" />
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            Aquí se mostrará la lista de viajes
          </Text>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
