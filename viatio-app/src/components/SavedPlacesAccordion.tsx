import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lugar, LUGAR_CATEGORIAS, CategoriaLugar } from '@/types/lugar';
import { theme } from '@/config/theme';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SavedPlacesAccordionProps {
  lugares: Lugar[];
  onSelectLugar: (lugar: Lugar) => void;
  onToggleVisitado: (lugar: Lugar) => void;
  onDeleteLugar: (lugar: Lugar) => void;
}

interface LugaresPorCategoria {
  categoria: CategoriaLugar;
  lugares: Lugar[];
  config: typeof LUGAR_CATEGORIAS[CategoriaLugar];
}

export function SavedPlacesAccordion({
  lugares,
  onSelectLugar,
  onToggleVisitado,
  onDeleteLugar,
}: SavedPlacesAccordionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoriaLugar>>(new Set());

  // Agrupar lugares por categoría
  const lugaresPorCategoria = useMemo((): LugaresPorCategoria[] => {
    const grupos: Record<CategoriaLugar, Lugar[]> = {
      restaurant: [],
      hotel: [],
      attraction: [],
      shopping: [],
      transport: [],
      other: [],
    };

    lugares.forEach((lugar) => {
      const cat = lugar.categoria || 'other';
      if (grupos[cat]) {
        grupos[cat].push(lugar);
      } else {
        grupos.other.push(lugar);
      }
    });

    // Filtrar categorías vacías y convertir a array
    return (Object.entries(grupos) as [CategoriaLugar, Lugar[]][])
      .filter(([_, items]) => items.length > 0)
      .map(([categoria, items]) => ({
        categoria,
        lugares: items,
        config: LUGAR_CATEGORIAS[categoria],
      }));
  }, [lugares]);

  const toggleCategory = (categoria: CategoriaLugar) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoria)) {
        next.delete(categoria);
      } else {
        next.add(categoria);
      }
      return next;
    });
  };

  if (lugares.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin lugares guardados</Text>
        <Text style={styles.emptyText}>
          Busca lugares o toca en el mapa para añadirlos a tu viaje
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Mis lugares ({lugares.length})
      </Text>

      {lugaresPorCategoria.map(({ categoria, lugares: lugaresCategoria, config }) => {
        const isExpanded = expandedCategories.has(categoria);
        const visitados = lugaresCategoria.filter((l) => l.visitado).length;

        return (
          <View key={categoria} style={styles.categoryContainer}>
            {/* Header de categoría */}
            <Pressable
              style={styles.categoryHeader}
              onPress={() => toggleCategory(categoria)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon as any} size={20} color={config.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{config.label}</Text>
                <Text style={styles.categoryCount}>
                  {visitados}/{lugaresCategoria.length} visitados
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            {/* Lista de lugares */}
            {isExpanded && (
              <View style={styles.lugaresContainer}>
                {lugaresCategoria.map((lugar) => (
                  <Pressable
                    key={lugar.id}
                    style={styles.lugarItem}
                    onPress={() => onSelectLugar(lugar)}
                  >
                    {/* Checkbox de visitado */}
                    <Pressable
                      style={styles.checkbox}
                      onPress={() => onToggleVisitado(lugar)}
                      hitSlop={8}
                    >
                      <View
                        style={[
                          styles.checkboxInner,
                          lugar.visitado && {
                            backgroundColor: theme.colors.success,
                            borderColor: theme.colors.success,
                          },
                        ]}
                      >
                        {lugar.visitado && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>

                    {/* Info del lugar */}
                    <View style={styles.lugarInfo}>
                      <Text
                        style={[
                          styles.lugarNombre,
                          lugar.visitado && styles.lugarNombreVisitado,
                        ]}
                        numberOfLines={1}
                      >
                        {lugar.nombre}
                      </Text>
                      {lugar.direccion && (
                        <Text style={styles.lugarDireccion} numberOfLines={1}>
                          {lugar.direccion}
                        </Text>
                      )}
                    </View>

                    {/* Botón eliminar */}
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => onDeleteLugar(lugar)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  lugaresContainer: {
    backgroundColor: '#F9FAFB',
    paddingLeft: 64,
  },
  lugarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lugarInfo: {
    flex: 1,
    marginRight: 8,
  },
  lugarNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  lugarNombreVisitado: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  lugarDireccion: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
});
