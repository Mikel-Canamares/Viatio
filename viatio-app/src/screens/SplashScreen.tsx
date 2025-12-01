/**
 * SPLASH SCREEN
 *
 * Pantalla de carga mostrada mientras se inicializa la autenticación.
 * Muestra el logo de Viatio con un indicador de carga.
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryLight, theme.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Ionicons name="airplane" size={100} color="#FFFFFF" />
      </View>

      {/* App Name */}
      <Text style={styles.appName}>Viatio</Text>

      {/* Loading Indicator */}
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />

      {/* Tagline */}
      <Text style={styles.tagline}>Organizando tus viajes...</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xl,
    letterSpacing: -1,
  },
  loader: {
    marginBottom: theme.spacing.md,
  },
  tagline: {
    fontSize: 16,
    color: '#DBEAFE',
    opacity: 0.9,
  },
});
