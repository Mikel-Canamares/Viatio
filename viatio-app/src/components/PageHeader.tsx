/**
 * PAGE HEADER
 *
 * Componente de encabezado para pantallas.
 * Incluye título, botón de retroceso opcional y elemento a la derecha opcional.
 */

import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface PageHeaderProps {
  /** Título del encabezado */
  title: string;

  /** Callback para el botón de retroceso */
  onBack?: () => void;

  /** Elemento opcional a la derecha del encabezado */
  rightElement?: ReactNode;
}

export function PageHeader({ title, onBack, rightElement }: PageHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Botón de retroceso */}
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Título */}
        <Text
          style={[
            styles.title,
            onBack ? styles.titleCentered : styles.titleLeft,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Elemento derecho */}
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: '600',
  },
  titleCentered: {
    flex: 1,
    textAlign: 'center',
    marginLeft: -48, // Compensa el botón de retroceso para centrar
  },
  titleLeft: {
    flex: 1,
  },
  rightElement: {
    marginLeft: 'auto',
  },
});
