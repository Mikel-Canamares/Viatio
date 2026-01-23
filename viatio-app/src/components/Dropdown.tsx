import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

export interface DropdownOption<T = string> {
  label: string;
  value: T;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface DropdownProps<T = string> {
  label?: string;
  placeholder?: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
}

export function Dropdown<T = string>({
  label,
  placeholder = 'Seleccionar...',
  options,
  value,
  onChange,
  error,
  disabled = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.icon && (
            <Ionicons
              name={selectedOption.icon}
              size={20}
              color={theme.colors.text}
              style={styles.triggerIcon}
            />
          )}
          <Text
            style={[
              styles.triggerText,
              !selectedOption && styles.triggerPlaceholder,
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
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
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                      index === options.length - 1 && styles.optionLast,
                    ]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <View style={styles.optionContent}>
                      {option.icon && (
                        <View style={[
                          styles.optionIconContainer,
                          isSelected && styles.optionIconContainerSelected
                        ]}>
                          <Ionicons
                            name={option.icon}
                            size={22}
                            color={
                              isSelected
                                ? theme.colors.primary
                                : theme.colors.textSecondary
                            }
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
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
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggerIcon: {
    marginRight: 8,
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
    borderRadius: 20,
    width: '85%',
    maxHeight: '60%',
    ...theme.shadows.elevated,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  optionsList: {
    maxHeight: 500,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 64,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: `${theme.colors.primary}12`,
  },
  optionPressed: {
    backgroundColor: theme.colors.secondary + '80',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconContainerSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
