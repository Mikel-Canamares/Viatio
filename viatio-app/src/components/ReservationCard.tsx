/**
 * RESERVATION CARD COMPONENT
 *
 * Tarjeta para mostrar una reserva.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from './Card';
import { theme } from '@/config';
import { Reserva, RESERVA_CATEGORIAS } from '@/types/reserva';

interface ReservationCardProps {
  reserva: Reserva;
  onPress: () => void;
}

const CATEGORIA_COLORS: Record<
  string,
  { bg: string; icon: string }
> = {
  transport: { bg: '#DBEAFE', icon: '#3B82F6' },
  accommodation: { bg: '#FEE2E2', icon: '#EF4444' },
  food: { bg: '#FEF3C7', icon: '#F59E0B' },
  activity: { bg: '#D1FAE5', icon: '#10B981' },
  other: { bg: '#F3F4F6', icon: '#6B7280' },
};

const ESTADO_PAGO_CONFIG = {
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  partial: { label: 'Parcial', color: '#F97316', bg: '#FFEDD5' },
  paid: { label: 'Pagado', color: '#10B981', bg: '#D1FAE5' },
};

export default function ReservationCard({ reserva, onPress }: ReservationCardProps) {
  const categoriaInfo = RESERVA_CATEGORIAS[reserva.categoria];
  const colors = CATEGORIA_COLORS[reserva.categoria];
  const estadoPagoInfo = ESTADO_PAGO_CONFIG[reserva.estadoPago];

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "d 'de' MMM", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <View style={styles.mainRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
            <Ionicons
              name={categoriaInfo.icon as any}
              size={24}
              color={colors.icon}
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.nombre} numberOfLines={1}>
              {reserva.nombre}
            </Text>
            {reserva.proveedor && (
              <Text style={styles.proveedor} numberOfLines={1}>
                {reserva.proveedor}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>

        {(reserva.fechaInicio || reserva.estadoPago) && (
          <View style={styles.bottomRow}>
            {reserva.fechaInicio && (
              <View style={styles.badge}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.badgeText}>
                  {formatearFecha(reserva.fechaInicio)}
                  {reserva.horaInicio && ` · ${reserva.horaInicio}`}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: estadoPagoInfo.bg },
              ]}
            >
              <Text style={[styles.estadoText, { color: estadoPagoInfo.color }]}>
                {estadoPagoInfo.label}
              </Text>
            </View>
          </View>
        )}
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  proveedor: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  estadoBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
