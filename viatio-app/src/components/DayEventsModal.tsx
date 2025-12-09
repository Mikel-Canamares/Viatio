/**
 * DAY EVENTS MODAL
 *
 * Modal que muestra los eventos de un día específico.
 * Se presenta desde abajo con animación slide.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { theme } from '@/config/theme';
import type { EventoAgenda } from '@/types/diaViaje';
import type { CategoriaReserva } from '@/types/reserva';
import { CategoryBadge } from './CategoryBadge';

export type EventoAgendaCalendario = EventoAgenda & {
  categoria: CategoriaReserva;
  viajeId: string;
  tieneDocumento?: boolean;
  tieneReserva?: boolean;
};

interface DayEventsModalProps {
  /** Si el modal está visible */
  visible: boolean;

  /** Fecha de los eventos */
  date: Date;

  /** Lista de eventos del día */
  eventos: EventoAgendaCalendario[];

  /** Callback al cerrar el modal */
  onClose: () => void;

  /** Callback al presionar un evento (opcional) */
  onEventPress?: (evento: EventoAgendaCalendario) => void;
}

export function DayEventsModal({
  visible,
  date,
  eventos,
  onClose,
  onEventPress,
}: DayEventsModalProps) {
  // Formatear fecha: "Viernes, 21 de diciembre"
  const fechaFormateada = format(date, "EEEE, d 'de' MMMM", { locale: es });

  const getEventIcon = (categoria: CategoriaReserva): keyof typeof Ionicons.glyphMap => {
    switch (categoria) {
      case 'transport': return 'airplane';
      case 'accommodation': return 'bed';
      case 'food': return 'restaurant';
      case 'activity': return 'ticket';
      default: return 'calendar';
    }
  };

  const renderEvento = ({ item }: { item: EventoAgendaCalendario }) => (
    <Pressable
      style={({ pressed }) => [
        styles.eventoCard,
        pressed && styles.eventoCardPressed,
      ]}
      onPress={() => onEventPress?.(item)}
      disabled={!onEventPress}
    >
      {/* Icono de categoría */}
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
        <Ionicons
          name={getEventIcon(item.categoria)}
          size={24}
          color={theme.colors.primary}
        />
      </View>

      {/* Contenido */}
      <View style={styles.eventoContent}>
        {/* Hora y título */}
        <View style={styles.eventoHeader}>
          {item.hora && (
            <>
              <Text style={styles.horaText}>{item.hora}</Text>
              <Text style={styles.separator}>·</Text>
            </>
          )}
          <Text style={styles.eventoTitulo} numberOfLines={1}>
            {item.titulo}
          </Text>
        </View>

        {/* Badge de categoría */}
        <CategoryBadge category={item.categoria} />

        {/* Indicadores de reserva y documento */}
        {(item.tieneReserva || item.tieneDocumento) && (
          <View style={styles.indicators}>
            {item.tieneReserva && (
              <View style={styles.indicator}>
                <Ionicons name="bookmark" size={12} color={theme.colors.primary} />
                <Text style={styles.indicatorText}>Reserva</Text>
              </View>
            )}
            {item.tieneDocumento && (
              <View style={styles.indicator}>
                <Ionicons name="document" size={12} color={theme.colors.primary} />
                <Text style={styles.indicatorText}>Documento</Text>
              </View>
            )}
          </View>
        )}

        {/* Subtítulo y ubicación */}
        {item.subtitulo && (
          <Text style={styles.subtitulo}>{item.subtitulo}</Text>
        )}
        {item.ubicacion && (
          <Text style={styles.ubicacion}>{item.ubicacion}</Text>
        )}
      </View>

      {/* Icono de navegación solo si hay callback */}
      {onEventPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textMuted}
        />
      )}
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="calendar-outline"
        size={48}
        color={theme.colors.textMuted}
      />
      <Text style={styles.emptyText}>No hay eventos</Text>
      <Text style={styles.emptySubtext}>
        Este día no tiene eventos programados
      </Text>
    </View>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      propagateSwipe
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      useNativeDriverForBackdrop
    >
      <View style={styles.container}>
        {/* Handle de drag */}
        <View style={styles.dragHandle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.fechaTitulo}>
              {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Lista de eventos */}
        {eventos.length > 0 ? (
          <FlatList
            data={eventos}
            keyExtractor={(item) => item.id}
            renderItem={renderEvento}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderEmpty()}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '80%',
    paddingBottom: theme.spacing.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  fechaTitulo: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.secondary,
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  eventoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  eventoCardPressed: {
    backgroundColor: theme.colors.secondary,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventoContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  eventoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  horaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  separator: {
    fontSize: 14,
    color: theme.colors.border,
  },
  eventoTitulo: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  indicators: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  subtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  ubicacion: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
