/**
 * AGENDA CARD COMPONENT
 *
 * Tarjeta minimalista para mostrar eventos en la agenda.
 * Muestra icono, hora, título y ubicación de forma compacta.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { theme } from '@/config';
import type { EventoAgenda } from '@/types/diaViaje';

interface AgendaCardProps {
  evento: EventoAgenda;
  onPress?: () => void;
}

export default function AgendaCard({ evento, onPress }: AgendaCardProps) {
  const isClickable = evento.tipo === 'reserva' && !!onPress;

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
              <Text style={styles.timeText}>{evento.hora}</Text>
            ) : (
              <Text style={styles.timeTextEmpty}>--:--</Text>
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

          {/* Contenido principal */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.titulo} numberOfLines={1}>
                {evento.titulo}
              </Text>
              {evento.categoria && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{evento.categoria}</Text>
                </View>
              )}
            </View>

            {evento.subtitulo && (
              <Text style={styles.subtitulo} numberOfLines={1}>
                {evento.subtitulo}
              </Text>
            )}

            {evento.ubicacion && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {evento.ubicacion}
                </Text>
              </View>
            )}
          </View>

          {/* Chevron si es clickeable */}
          {isClickable && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
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
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
  },
});
