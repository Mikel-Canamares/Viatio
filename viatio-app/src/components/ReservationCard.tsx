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
import { SwipeableCard } from './SwipeableCard';
import { SwipeActionsReservation } from './SwipeActionsReservation';
import { theme } from '@/config';
import {
  Reserva,
  RESERVA_CATEGORIAS,
  SUBTIPOS_TRANSPORTE,
  SUBTIPOS_ALOJAMIENTO,
  SUBTIPOS_ACTIVIDAD,
} from '@/types/reserva';
import { BASE_CATEGORIES, CategoryBase } from '@/config/categories';

interface ReservationCardProps {
  reserva: Reserva;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Colores de categorías usando el sistema centralizado
 */
const CATEGORIA_COLORS: Record<
  CategoryBase,
  { bg: string; icon: string }
> = {
  transport: {
    bg: BASE_CATEGORIES.transport.lightBg,
    icon: BASE_CATEGORIES.transport.color
  },
  accommodation: {
    bg: BASE_CATEGORIES.accommodation.lightBg,
    icon: BASE_CATEGORIES.accommodation.color
  },
  food: {
    bg: BASE_CATEGORIES.food.lightBg,
    icon: BASE_CATEGORIES.food.color
  },
  activity: {
    bg: BASE_CATEGORIES.activity.lightBg,
    icon: BASE_CATEGORIES.activity.color
  },
  shopping: {
    bg: BASE_CATEGORIES.shopping.lightBg,
    icon: BASE_CATEGORIES.shopping.color
  },
  other: {
    bg: BASE_CATEGORIES.other.lightBg,
    icon: BASE_CATEGORIES.other.color
  },
};

const ESTADO_PAGO_CONFIG = {
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  partial: { label: 'Parcial', color: '#F97316', bg: '#FFEDD5' },
  paid: { label: 'Pagado', color: '#10B981', bg: '#D1FAE5' },
};

/**
 * Obtiene el icono específico según categoría y subtipo de reserva
 */
function getIconForReserva(reserva: Reserva): string {
  const metadatos = reserva.metadatos;

  // Usar icono específico del subtipo si existe
  if (reserva.categoria === 'transport' && metadatos?.subtipoTransporte) {
    return SUBTIPOS_TRANSPORTE[metadatos.subtipoTransporte].icon;
  }

  if (reserva.categoria === 'accommodation' && metadatos?.subtipoAlojamiento) {
    return SUBTIPOS_ALOJAMIENTO[metadatos.subtipoAlojamiento].icon;
  }

  if (reserva.categoria === 'activity' && metadatos?.subtipoActividad) {
    return SUBTIPOS_ACTIVIDAD[metadatos.subtipoActividad].icon;
  }

  // Fallback al ícono de categoría general
  return RESERVA_CATEGORIAS[reserva.categoria].icon;
}

export default function ReservationCard({ reserva, onPress, onEdit, onDelete }: ReservationCardProps) {
  const colors = CATEGORIA_COLORS[reserva.categoria];
  const estadoPagoInfo = ESTADO_PAGO_CONFIG[reserva.estadoPago];
  const iconName = getIconForReserva(reserva);

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "d 'de' MMM", { locale: es });
    } catch {
      return fecha;
    }
  };

  // Contenido de la tarjeta (reutilizable)
  const cardContent = (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <View style={styles.mainRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
            <Ionicons
              name={iconName as any}
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

  // Si no hay acciones, retornar solo la tarjeta
  if (!onEdit && !onDelete) {
    return cardContent;
  }

  // Si hay acciones, envolver con SwipeableCard
  return (
    <SwipeableCard
      renderRightActions={() => (
        <SwipeActionsReservation
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    >
      {cardContent}
    </SwipeableCard>
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
