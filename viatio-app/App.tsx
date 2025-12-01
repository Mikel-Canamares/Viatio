import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootTabs } from '@/navigation';
import { ErrorBoundary, PrimaryButton } from '@/components';
import { initializeDatabase, clearDatabase } from '@/database';
import { logError } from '@/utils';
import { theme } from '@/config';

// DEVELOPMENT: Cambiar a true para limpiar la BD al iniciar
const CLEAR_DB_ON_START = true;

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const initDB = async () => {
    try {
      console.log('[App] Inicializando base de datos...');
      await initializeDatabase();

      // DEVELOPMENT: Limpiar base de datos si está habilitado
      if (__DEV__ && CLEAR_DB_ON_START) {
        console.log('[App] Limpiando base de datos (desarrollo)...');
        await clearDatabase();
      }

      setDbReady(true);
      setDbError(null);
      console.log('[App] Base de datos lista');
    } catch (error) {
      logError(error, 'App - initializeDatabase');
      setDbError('No se pudo inicializar la base de datos. Por favor, reinicia la aplicación.');
      setDbReady(false);
    }
  };

  useEffect(() => {
    initDB();
  }, []);

  // Pantalla de error
  if (dbError) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error de inicialización</Text>
          <Text style={styles.errorMessage}>{dbError}</Text>
          <PrimaryButton onPress={initDB}>
            Reintentar
          </PrimaryButton>
        </View>
      </View>
    );
  }

  // Pantalla de carga
  if (!dbReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        <Text style={styles.loadingText}>Iniciando Viatio...</Text>
      </View>
    );
  }

  // App lista
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <RootTabs />
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
});
