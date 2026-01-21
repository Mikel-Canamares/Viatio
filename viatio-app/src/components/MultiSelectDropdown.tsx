import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

export interface MultiSelectOption<T = string> {
  label: string;
  value: T;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface MultiSelectDropdownProps<T = string> {
  label?: string;
  placeholder?: string;
  options: MultiSelectOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  error?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
}

export function MultiSelectDropdown<T = string>({
  label,
  placeholder = 'Seleccionar...',
  options,
  values,
  onChange,
  error,
  disabled = false,
  showSelectAll = true,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = values.length;
  const allSelected = selectedCount === options.length;

  const handleToggle = (value: T) => {
    if (values.includes(value)) {
      // Deseleccionar (mantener al menos uno)
      if (values.length > 1) {
        onChange(values.filter(v => v !== value));
      }
    } else {
      // Seleccionar
      onChange([...values, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map(opt => opt.value));
  };

  const handleSelectNone = () => {
    // Mantener al menos el primero
    if (options.length > 0) {
      onChange([options[0].value]);
    }
  };

  const getDisplayText = () => {
    if (selectedCount === 0) return placeholder;
    if (selectedCount === options.length) return 'Todos';
    if (selectedCount === 1) {
      const selected = options.find(opt => values.includes(opt.value));
      return selected?.label || placeholder;
    }
    return `${selectedCount} seleccionados`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {showSelectAll && !isOpen && (
            <Pressable
              onPress={allSelected ? handleSelectNone : handleSelectAll}
              hitSlop={8}
            >
              <Text style={styles.selectAllText}>
                {allSelected ? 'Ninguno' : 'Todos'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            selectedCount === 0 && styles.triggerPlaceholder,
          ]}
        >
          {getDisplayText()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Seleccionar'}</Text>
              {showSelectAll && (
                <Pressable
                  onPress={allSelected ? handleSelectNone : handleSelectAll}
                  hitSlop={8}
                  style={styles.selectAllButton}
                >
                  <Text style={styles.selectAllText}>
                    {allSelected ? 'Ninguno' : 'Todos'}
                  </Text>
                </Pressable>
              )}
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const isSelected = values.includes(option.value);

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                      index === options.length - 1 && styles.optionLast,
                    ]}
                    onPress={() => handleToggle(option.value)}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  selectAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  triggerError: {
    borderColor: theme.colors.error,
  },
  triggerDisabled: {
    backgroundColor: theme.colors.secondary,
    opacity: 0.6,
  },
  triggerText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  triggerPlaceholder: {
    color: theme.colors.textMuted,
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },

  // Modal centrado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    width: '90%',
    maxHeight: '70%',
    ...theme.shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectAllButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary + '08',
  },
  optionPressed: {
    backgroundColor: theme.colors.secondary + '60',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
