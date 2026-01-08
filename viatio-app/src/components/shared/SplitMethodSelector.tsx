import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitMethod } from '@/types/shared';
import { theme } from '@/config/theme';

interface SplitMethodSelectorProps {
  selected: SplitMethod;
  onSelect: (method: SplitMethod) => void;
}

const SPLIT_METHODS: {
  value: SplitMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    value: 'equal',
    label: 'Igualitario',
    icon: 'git-compare-outline',
    description: 'Dividir a partes iguales entre todos',
  },
  {
    value: 'exact',
    label: 'Importes',
    icon: 'cash-outline',
    description: 'Especificar importe exacto por persona',
  },
  {
    value: 'percentage',
    label: 'Porcentaje',
    icon: 'pie-chart-outline',
    description: 'Asignar porcentajes a cada persona',
  },
  {
    value: 'shares',
    label: 'Partes',
    icon: 'grid-outline',
    description: 'Asignar participaciones (ej: 2x, 3x)',
  },
];

export function SplitMethodSelector({
  selected,
  onSelect,
}: SplitMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Método de reparto</Text>

      <View style={styles.optionsContainer}>
        {SPLIT_METHODS.map((method) => {
          const isSelected = selected === method.value;

          return (
            <Pressable
              key={method.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(method.value)}
            >
              <Ionicons
                name={method.icon}
                size={24}
                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {method.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.description}>
        {SPLIT_METHODS.find(m => m.value === selected)?.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
