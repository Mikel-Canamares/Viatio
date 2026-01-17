/**
 * Componente para seleccionar divisa
 * Modal con lista de divisas comunes + búsqueda
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Currency, TOP_CURRENCIES, ALL_CURRENCIES } from '@/config/currencies';
import { theme } from '@/config/theme';

interface CurrencyPickerProps {
  value: string;
  onChange: (currencyCode: string) => void;
  label?: string;
  disabled?: boolean;
  /** Si es true, solo muestra el modal (sin botón trigger) */
  modalOnly?: boolean;
  /** Callback cuando se cierra el modal (útil con modalOnly) */
  onClose?: () => void;
}

export function CurrencyPicker({ value, onChange, label, disabled, modalOnly, onClose }: CurrencyPickerProps) {
  const [modalVisible, setModalVisible] = useState(modalOnly ? true : false);
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener divisa seleccionada
  const selectedCurrency = useMemo(() => {
    return ALL_CURRENCIES.find(c => c.code === value);
  }, [value]);

  // Filtrar divisas según búsqueda
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) {
      // Sin búsqueda: mostrar Top 10 primero, luego el resto
      const topCodes = TOP_CURRENCIES.map(c => c.code);
      const others = ALL_CURRENCIES.filter(c => !topCodes.includes(c.code));
      return [...TOP_CURRENCIES, ...others];
    }

    // Con búsqueda: filtrar por código o nombre
    const query = searchQuery.toLowerCase();
    return ALL_CURRENCIES.filter(
      c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (currency: Currency) => {
    onChange(currency.code);
    handleClose();
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
    onClose?.();
  };

  return (
    <>
      {/* Botón para abrir modal (solo si no es modalOnly) */}
      {!modalOnly && (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}

          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => !disabled && setModalVisible(true)}
            disabled={disabled}
          >
            <View style={styles.buttonContent}>
              {selectedCurrency?.flag && <Text style={styles.flag}>{selectedCurrency.flag}</Text>}
              <Text style={styles.currencyCode}>{value}</Text>
              <Text style={styles.currencyName}>{selectedCurrency?.name || value}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de selección */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar divisa</Text>
              <Pressable onPress={handleClose}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar divisa..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Lista de divisas */}
            <FlatList
              data={filteredCurrencies}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    item.code === value && styles.currencyItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                    <View style={styles.currencyItemLeft}>
                      {item.flag && <Text style={styles.currencyFlag}>{item.flag}</Text>}
                      <View>
                        <Text style={styles.currencyItemCode}>{item.code}</Text>
                        <Text style={styles.currencyItemName}>{item.name}</Text>
                      </View>
                    </View>

                  {item.code === value && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron divisas</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  flag: {
    fontSize: 24,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  currencyName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    height: '80%',
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Buscador
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    margin: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },

  // Lista
  list: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyItemSelected: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  currencyFlag: {
    fontSize: 28,
  },
  currencyItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  currencyItemName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
