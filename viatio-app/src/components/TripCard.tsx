/**
 * TRIP CARD
 *
 * Tarjeta para mostrar un viaje en la lista.
 * Incluye imagen, destino, fechas y badge de días restantes.
 * Soporta swipe para acciones (archivar/borrar).
 */

import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from './Card';
import { SwipeableCard } from './SwipeableCard';
import { SwipeActions } from './SwipeActions';
import type { Viaje } from '@/types/viaje';
import { theme } from '@/config';
import { parseLocalDate, startOfLocalDay } from '@/utils';

interface TripCardProps {
  /** Viaje a mostrar */
  viaje: Viaje;

  /** Callback al presionar la tarjeta */
  onPress: () => void;

  /** Callback al archivar/desarchivar (opcional) */
  onArchive?: () => void;

  /** Callback al borrar */
  onDelete: () => void;

  /** Si el viaje está archivado (para mostrar "Desarchivar" en lugar de "Archivar") */
  isArchived?: boolean;
}

export function TripCard({
  viaje,
  onPress,
  onArchive,
  onDelete,
  isArchived = false,
}: TripCardProps) {
  // Validar y formatear fechas (parseLocalDate evita problemas de zona horaria)
  const fechaInicio = parseLocalDate(viaje.fechaInicio);
  const fechaFin = parseLocalDate(viaje.fechaFin);

  // Validar que las fechas sean válidas
  const fechasValidas = isValid(fechaInicio) && isValid(fechaFin);

  const fechasFormateadas = fechasValidas
    ? `${format(fechaInicio, 'd MMM', { locale: es })} - ${format(fechaFin, 'd MMM', { locale: es })}`
    : 'Fechas no válidas';

  // Calcular días restantes (solo si las fechas son válidas)
  const hoy = startOfLocalDay(new Date());
  const diasRestantes = fechasValidas ? differenceInDays(fechaInicio, hoy) : 0;
  const esFuturo = diasRestantes > 0;

  // Contenido de la tarjeta (reutilizable)
  const cardContent = (
    <Card onPress={onPress} padding={0} style={styles.card}>
      {/* Imagen o placeholder */}
      {viaje.imagenUrl ? (
        <Image
          source={{ uri: viaje.imagenUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.imagePlaceholder}
        >
          <Ionicons name="airplane" size={48} color="#FFFFFF" />
        </LinearGradient>
      )}

      {/* Contenido */}
      <View style={styles.content}>
        {/* Destino */}
        <Text style={styles.destino} numberOfLines={1}>
          {viaje.destino}
        </Text>

        {/* Fechas */}
        <Text style={styles.fechas}>{fechasFormateadas}</Text>

        {/* Badge de días restantes (solo si es futuro) */}
        {esFuturo && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {diasRestantes === 0
                ? '¡Hoy!'
                : diasRestantes === 1
                ? 'Mañana'
                : `En ${diasRestantes} días`}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  // Si no hay acciones, retornar solo la tarjeta
  if (!onArchive && !onDelete) {
    return cardContent;
  }

  // Si hay acciones, envolver con SwipeableCard
  return (
    <SwipeableCard
      renderRightActions={() => (
        <SwipeActions
          onArchive={onArchive}
          onDelete={onDelete}
          isArchived={isArchived}
        />
      )}
    >
      {cardContent}
    </SwipeableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  destino: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fechas: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
