/**
 * SCREEN CONTAINER
 *
 * Componente contenedor base para todas las pantallas.
 * Proporciona SafeAreaView, padding opcional y scroll opcional.
 */

import { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/config';

interface ScreenContainerProps {
  /** Contenido de la pantalla */
  children: ReactNode;

  /** Si true, usa ScrollView; si false, usa View */
  scroll?: boolean;

  /** Estilos adicionales para el contenedor */
  style?: ViewStyle;
}

export function ScreenContainer({
  children,
  scroll = false,
  style,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={[styles.content, style]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
