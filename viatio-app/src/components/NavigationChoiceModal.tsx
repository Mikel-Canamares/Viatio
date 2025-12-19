/**
 * NAVIGATION CHOICE MODAL
 *
 * Modal elegante para seleccionar entre ver reserva o ver lugar en el mapa.
 * Se muestra cuando una reserva tiene un lugar asociado.
 */

import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { Card } from './Card';

interface NavigationChoiceModalProps {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  onViewReservation: () => void;
  onViewMap: () => void;
}

export default function NavigationChoiceModal({
  visible,
  titulo,
  onClose,
  onViewReservation,
  onViewMap,
}: NavigationChoiceModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>¿Qué deseas ver?</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              {/* Título del evento */}
              <Text style={styles.eventTitle} numberOfLines={2}>
                {titulo}
              </Text>

              {/* Opciones */}
              <View style={styles.options}>
                {/* Opción: Ver Reserva */}
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    onClose();
                    onViewReservation();
                  }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Ver reserva</Text>
                    <Text style={styles.optionDescription}>
                      Detalles, confirmación y documentos
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>

                {/* Opción: Ver en Mapa */}
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    onClose();
                    onViewMap();
                  }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="map" size={24} color="#10B981" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Ver en el mapa</Text>
                    <Text style={styles.optionDescription}>
                      Ubicación y cómo llegar
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            </Card>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  eventTitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  options: {
    gap: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  optionPressed: {
    opacity: 0.7,
    backgroundColor: '#E5E7EB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
