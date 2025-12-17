/**
 * SUBTYPE SELECTOR
 *
 * Selector visual de subtipos con iconos para categorías de reservas.
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface SubtypeSelectorProps<T extends string> {
  label: string;
  options: Record<T, { label: string; icon: string }>;
  value?: T;
  onSelect: (value: T) => void;
}

export function SubtypeSelector<T extends string>({
  label,
  options,
  value,
  onSelect,
}: SubtypeSelectorProps<T>) {
  const entries = Object.entries(options) as [T, { label: string; icon: string }][];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.map(([key, option]) => (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[
              styles.optionChip,
              value === key && styles.optionChipActive,
            ]}
          >
            <Ionicons
              name={option.icon as any}
              size={18}
              color={value === key ? '#FFFFFF' : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.optionText,
                value === key && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingVertical: 2,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
