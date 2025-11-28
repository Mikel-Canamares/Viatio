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
  scrollable?: boolean;

  /** Si true, aplica padding horizontal */
  padded?: boolean;

  /** Color de fondo del contenedor */
  backgroundColor?: string;
}

export function ScreenContainer({
  children,
  scrollable = false,
  padded = true,
  backgroundColor = theme.colors.background,
}: ScreenContainerProps) {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: padded ? theme.spacing.lg : 0,
  };

  return (
    <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: padded ? theme.spacing.lg : 0 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
