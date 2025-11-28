/**
 * ERROR BOUNDARY
 *
 * Componente que captura errores de JavaScript en el árbol de componentes hijos.
 * Muestra una UI de fallback amigable cuando ocurre un error.
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { theme } from '@/config';

interface ErrorBoundaryProps {
  /** Componentes hijos a monitorear */
  children: ReactNode;

  /** Callback opcional cuando ocurre un error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Si hay un error capturado */
  hasError: boolean;

  /** El error capturado */
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // Actualiza el estado cuando se captura un error
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  // Log del error
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log en consola para desarrollo
    console.error('ErrorBoundary capturó un error:', error, errorInfo);

    // Callback opcional
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Resetear el estado de error
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Card style={styles.card} padding={24}>
            {/* Icono de error */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color={theme.colors.error}
              />
            </View>

            {/* Título */}
            <Text style={styles.title}>Algo salió mal</Text>

            {/* Mensaje */}
            <Text style={styles.message}>
              Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
            </Text>

            {/* Detalles del error (solo en desarrollo) */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            {/* Botón de reintentar */}
            <PrimaryButton onPress={this.handleReset}>
              Reintentar
            </PrimaryButton>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    fontFamily: 'monospace',
  },
});
