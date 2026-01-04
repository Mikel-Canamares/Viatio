/**
 * SELECT ITEM
 *
 * Componente reutilizable para elementos de selección.
 * Muestra un label, valor actual y abre un ActionSheet con opciones.
 */

import { useState } from 'react';
import {Pressable, View, Text, StyleSheet, ActionSheetIOS, Platform,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

export interface SelectOption {
  /** Valor de la opción */
  value: string;

  /** Etiqueta a mostrar */
  label: string;
}

interface SelectItemProps {
  /** Etiqueta del campo */
  label: string;

  /** Valor actual seleccionado */
  value: string;

  /** Opciones disponibles */
  options: SelectOption[];

  /** Callback al seleccionar una opción */
  onSelect: (value: string) => void;

  /** Icono opcional */
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SelectItem({ label, value, options, onSelect, icon }: SelectItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Obtener la etiqueta del valor actual
  const currentOption = options.find((opt) => opt.value === value);
  const currentLabel = currentOption?.label || value;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      // iOS: usar ActionSheetIOS nativo
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', ...options.map((opt) => opt.label)],
          cancelButtonIndex: 0,
          title: label,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selectedOption = options[buttonIndex - 1];
            onSelect(selectedOption.value);
          }
        }
      );
    } else {
      // Android: usar Alert con opciones
      Alert.alert(
        label,
        'Selecciona una opción',
        [
          ...options.map((opt) => ({
            text: opt.label,
            onPress: () => onSelect(opt.value),
          })),
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Icono opcional */}
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={theme.colors.primaryLight} />
        </View>
      )}

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{currentLabel}</Text>
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
});
