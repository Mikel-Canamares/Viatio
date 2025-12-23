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
        {/* Título centrado */}
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

        {/* Botón de retroceso (absoluto para evitar superposición) */}
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    position: 'relative',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 10,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 0.96 }],
  },
  title: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: '600',
  },
  titleCentered: {
    textAlign: 'center',
    paddingHorizontal: 60, // Espacio para botones a los lados
  },
  titleLeft: {
    flex: 1,
    paddingLeft: 60, // Espacio para el botón de retroceso
  },
  rightElement: {
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 10,
  },
});
