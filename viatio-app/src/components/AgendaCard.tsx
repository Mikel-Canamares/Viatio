/**
 * AGENDA CARD COMPONENT
 *
 * Tarjeta minimalista para mostrar eventos en la agenda.
 * Muestra solo hora, icono y nombre de forma compacta.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { theme } from '@/config';
import type { EventoAgenda } from '@/types/diaViaje';

interface AgendaCardProps {
  evento: EventoAgenda;
  onPress?: () => void;
  onToggleComplete?: () => void;
  showCheckbox?: boolean;
}

export default function AgendaCard({
  evento,
  onPress,
}: AgendaCardProps) {
  const isClickable = !!onPress;

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={isClickable ? onPress : undefined}
        disabled={!isClickable}
        style={({ pressed }) => [
          styles.pressable,
          pressed && isClickable && styles.pressed,
        ]}
      >
        <View style={styles.container}>
          {/* Hora a la izquierda */}
          <View style={styles.timeContainer}>
            {evento.hora ? (
              <Text style={styles.timeText}>
                {evento.hora}
              </Text>
            ) : (
              <Text style={styles.timeTextEmpty}>
                --:--
              </Text>
            )}
          </View>

          {/* Icono con color de fondo */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: evento.iconBgColor },
            ]}
          >
            <Ionicons
              name={evento.iconName as any}
              size={20}
              color={evento.iconColor}
            />
          </View>

          {/* Título - Sin numberOfLines para que no se corte */}
          <Text style={styles.titulo}>
            {evento.titulo}
          </Text>

          {/* Chevron si es clickeable */}
          {isClickable && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
              style={styles.chevron}
            />
          )}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  pressable: {
    padding: theme.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeContainer: {
    minWidth: 42,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  timeTextEmpty: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  chevron: {
    marginLeft: theme.spacing.xs,
  },
});
