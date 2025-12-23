/**
 * COMPONENTE: EventoCategoriaSelector
 *
 * Selector visual de categorías para eventos personalizados.
 * Muestra grid de categorías con iconos y colores del sistema centralizado.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoriaEvento, EVENTO_CATEGORIAS } from '@/types/evento';
import { theme } from '@/config/theme';

interface EventoCategoriaSelectorProps {
  selected: CategoriaEvento | null;
  onSelect: (categoria: CategoriaEvento) => void;
  columns?: 2 | 3;
}

export function EventoCategoriaSelector({
  selected,
  onSelect,
  columns = 3,
}: EventoCategoriaSelectorProps) {
  const categorias = Object.entries(EVENTO_CATEGORIAS) as [
    CategoriaEvento,
    typeof EVENTO_CATEGORIAS[CategoriaEvento]
  ][];

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gap: columns === 2 ? 12 : 8 }]}>
        {categorias.map(([key, config]) => {
          const isSelected = selected === key;

          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={[
                styles.item,
                { width: columns === 2 ? '47%' : '30%' },
                isSelected && {
                  backgroundColor: config.bgColor,
                  borderColor: config.color,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? config.color
                      : config.bgColor,
                  },
                ]}
              >
                <Ionicons
                  name={config.icon as any}
                  size={24}
                  color={isSelected ? '#FFFFFF' : config.color}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isSelected && { color: config.color, fontWeight: '600' },
                ]}
                numberOfLines={2}
              >
                {config.labelCorto}
              </Text>
              {isSelected && (
                <View
                  style={[styles.checkmark, { backgroundColor: config.color }]}
                >
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  item: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
