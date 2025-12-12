/**
 * PROFILE MENU ITEM
 *
 * Componente reutilizable para ítems del menú de perfil.
 * Muestra un icono, label, valor opcional y chevron.
 */

import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

interface ProfileMenuItemProps {
  /** Nombre del icono de Ionicons */
  icon: keyof typeof Ionicons.glyphMap;

  /** Texto principal del ítem */
  label: string;

  /** Valor actual opcional (ej: "Español", "EUR") */
  value?: string;

  /** Callback al presionar */
  onPress: () => void;

  /** Mostrar chevron derecho (default: true) */
  showChevron?: boolean;

  /** Si es acción destructiva (logout, eliminar cuenta) */
  isDestructive?: boolean;
}

export function ProfileMenuItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  isDestructive = false,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Icono */}
      <View
        style={[
          styles.iconContainer,
          isDestructive ? styles.iconContainerDestructive : styles.iconContainerNormal,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? theme.colors.error : theme.colors.primaryLight}
        />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            isDestructive && styles.labelDestructive,
          ]}
        >
          {label}
        </Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>

      {/* Chevron */}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textMuted}
        />
      )}
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
  },
  iconContainerNormal: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)', // primaryLight con opacidad
  },
  iconContainerDestructive: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // error con opacidad
  },
  content: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text,
  },
  labelDestructive: {
    color: theme.colors.error,
  },
  value: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
