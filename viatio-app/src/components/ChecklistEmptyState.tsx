/**
 * CHECKLIST EMPTY STATE
 *
 * Estado vacío para cuando no hay items en el checklist.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

interface ChecklistEmptyStateProps {
  seccion: 'personal' | 'grupal';
}

export function ChecklistEmptyState({ seccion }: ChecklistEmptyStateProps) {
  const isPersonal = seccion === 'personal';

  return (
    <View style={styles.container}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isPersonal ? 'rgba(0, 102, 204, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
      ]}>
        <Ionicons
          name="checkbox-outline"
          size={48}
          color={isPersonal ? theme.colors.primaryLight : '#10B981'}
        />
      </View>
      <Text style={styles.title}>
        {isPersonal ? 'Sin items personales' : 'Sin items grupales'}
      </Text>
      <Text style={styles.description}>
        {isPersonal
          ? 'Añade cosas que solo tú necesites recordar'
          : 'Añade tareas que todo el grupo pueda ver y marcar'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
