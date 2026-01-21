/**
 * Selector de moneda para reservas
 *
 * Modal tipo dropdown que muestra solo 2 opciones:
 * - Moneda del viaje actual
 * - Moneda configurada por el usuario
 *
 * Si ambas son iguales, solo muestra una opción.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencyByCode } from '@/config/currencies';
import { theme } from '@/config/theme';

interface ReservationCurrencyPickerProps {
  /** Moneda seleccionada actualmente */
  value: string;
  /** Callback cuando cambia la moneda */
  onChange: (currencyCode: string) => void;
  /** Moneda del viaje */
  tripCurrency: string;
  /** Moneda de configuración del usuario */
  userCurrency: string;
  /** Etiqueta opcional */
  label?: string;
  /** Desactivar selector */
  disabled?: boolean;
}

interface CurrencyOption {
  code: string;
  label: string;
  flag?: string;
  name: string;
}

export function ReservationCurrencyPicker({
  value,
  onChange,
  tripCurrency,
  userCurrency,
  label,
  disabled,
}: ReservationCurrencyPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Obtener info de las divisas
  const tripCurrencyInfo = useMemo(() => getCurrencyByCode(tripCurrency), [tripCurrency]);
  const userCurrencyInfo = useMemo(() => getCurrencyByCode(userCurrency), [userCurrency]);
  const selectedCurrencyInfo = useMemo(() => getCurrencyByCode(value), [value]);

  // Si ambas monedas son iguales, solo mostrar una opción
  const showBothOptions = tripCurrency !== userCurrency;

  // Opciones disponibles
  const options: CurrencyOption[] = useMemo(() => {
    const opts: CurrencyOption[] = [
      {
        code: tripCurrency,
        label: 'Moneda del viaje',
        flag: tripCurrencyInfo?.flag,
        name: tripCurrencyInfo?.name || tripCurrency,
      },
    ];

    if (showBothOptions) {
      opts.push({
        code: userCurrency,
        label: 'Mi moneda',
        flag: userCurrencyInfo?.flag,
        name: userCurrencyInfo?.name || userCurrency,
      });
    }

    return opts;
  }, [tripCurrency, userCurrency, tripCurrencyInfo, userCurrencyInfo, showBothOptions]);

  const handleSelect = (option: CurrencyOption) => {
    onChange(option.code);
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}

        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          <View style={styles.buttonContent}>
            {selectedCurrencyInfo?.flag && (
              <Text style={styles.flag}>{selectedCurrencyInfo.flag}</Text>
            )}
            <Text style={styles.currencyCode}>{value}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Modal de selección */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar moneda</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Lista de opciones */}
            <View style={styles.optionsList}>
              {options.map((option) => {
                const isSelected = value === option.code;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <View style={styles.optionItemLeft}>
                      {option.flag && <Text style={styles.optionFlag}>{option.flag}</Text>}
                      <View>
                        <Text style={styles.optionCode}>{option.code}</Text>
                        <Text style={styles.optionName}>{option.name}</Text>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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

  // Lista de opciones
  optionsList: {
    paddingTop: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionItemSelected: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  optionFlag: {
    fontSize: 32,
  },
  optionCode: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  optionName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
});
