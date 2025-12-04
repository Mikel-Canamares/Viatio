/**
 * COMPONENT: PlaceDetailsModal
 *
 * Modal que muestra los detalles de un lugar de Google Places.
 * Permite al usuario guardar el lugar en su viaje.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import type { PlaceDetails } from '@/services/placesService';
import { PrimaryButton } from './PrimaryButton';
import { Card } from './Card';

interface PlaceDetailsModalProps {
  visible: boolean;
  placeDetails: PlaceDetails | null;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PlaceDetailsModal({
  visible,
  placeDetails,
  loading,
  onClose,
  onSave,
}: PlaceDetailsModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Lugar encontrado</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando detalles...</Text>
            </View>
          ) : placeDetails ? (
            <>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Nombre */}
                <Text style={styles.placeName}>{placeDetails.name}</Text>

                {/* Rating */}
                {placeDetails.rating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFC107" />
                    <Text style={styles.ratingText}>
                      {placeDetails.rating.toFixed(1)}
                    </Text>
                    {placeDetails.userRatingsTotal && (
                      <Text style={styles.ratingCount}>
                        ({placeDetails.userRatingsTotal})
                      </Text>
                    )}
                  </View>
                )}

                {/* Dirección */}
                <Card style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.infoText}>{placeDetails.formattedAddress}</Text>
                  </View>
                </Card>

                {/* Teléfono */}
                {placeDetails.phoneNumber && (
                  <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.infoText}>{placeDetails.phoneNumber}</Text>
                    </View>
                  </Card>
                )}

                {/* Website */}
                {placeDetails.website && (
                  <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="globe-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {placeDetails.website}
                      </Text>
                    </View>
                  </Card>
                )}

                {/* Horario de apertura */}
                {placeDetails.openingHours && (
                  <Card style={styles.infoCard}>
                    <View style={styles.hoursHeader}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.hoursTitle}>Horario</Text>
                      {placeDetails.openingHours.openNow !== undefined && (
                        <View
                          style={[
                            styles.statusBadge,
                            placeDetails.openingHours.openNow
                              ? styles.statusOpen
                              : styles.statusClosed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              placeDetails.openingHours.openNow
                                ? styles.statusOpenText
                                : styles.statusClosedText,
                            ]}
                          >
                            {placeDetails.openingHours.openNow ? 'Abierto' : 'Cerrado'}
                          </Text>
                        </View>
                      )}
                    </View>
                    {placeDetails.openingHours.weekdayText.length > 0 && (
                      <View style={styles.hoursList}>
                        {placeDetails.openingHours.weekdayText.map((text, index) => (
                          <Text key={index} style={styles.hoursText}>
                            {text}
                          </Text>
                        ))}
                      </View>
                    )}
                  </Card>
                )}

                <View style={styles.bottomPadding} />
              </ScrollView>

              {/* Botones */}
              <View style={styles.buttonsContainer}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <View style={styles.buttonSpacer} />
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={onSave}>Guardar en el viaje</PrimaryButton>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  ratingCount: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  infoCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.sm,
  },
  hoursTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#10B98120',
  },
  statusClosed: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOpenText: {
    color: '#10B981',
  },
  statusClosedText: {
    color: '#EF4444',
  },
  hoursList: {
    gap: 4,
  },
  hoursText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: theme.spacing.lg,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  buttonSpacer: {
    width: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
