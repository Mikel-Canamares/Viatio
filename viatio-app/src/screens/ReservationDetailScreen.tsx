/**
 * RESERVATION DETAIL SCREEN
 *
 * Pantalla de detalle de una reserva.
 * Muestra toda la información de la reserva y permite editar/eliminar.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScreenContainer,
  PageHeader,
  Card,
  SectionHeader,
  SecondaryButton,
  CategoryBadge,
} from '@/components';
import { theme } from '@/config';
import { useReservasStore } from '@/store/reservasStore';
import { getReservaById } from '@/services/reservasService';
import type { Reserva } from '@/types/reserva';
import { RESERVA_CATEGORIAS } from '@/types/reserva';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReservationDetail'>;

const ESTADO_PAGO_CONFIG = {
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  partial: { label: 'Parcial', color: '#F97316', bg: '#FFEDD5' },
  paid: { label: 'Pagado', color: '#10B981', bg: '#D1FAE5' },
};

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

export default function ReservationDetailScreen({ route, navigation }: Props) {
  const { reservaId } = route.params;
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const { removeReserva } = useReservasStore();

  useEffect(() => {
    loadReserva();
  }, [reservaId]);

  // Recargar al volver de la pantalla de edición
  useFocusEffect(
    React.useCallback(() => {
      loadReserva();
    }, [reservaId])
  );

  const loadReserva = async () => {
    try {
      setLoading(true);
      const data = await getReservaById(reservaId);
      setReserva(data);
    } catch (error) {
      console.error('Error loading reservation:', error);
      Alert.alert('Error', 'No se pudo cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyConfirmation = async () => {
    if (reserva?.numeroConfirmacion) {
      await Clipboard.setStringAsync(reserva.numeroConfirmacion);
      Alert.alert('Copiado', 'Número de confirmación copiado al portapapeles');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditReservation', { reservaId: reserva!.id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar reserva',
      '¿Estás seguro de que quieres eliminar esta reserva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeReserva(reservaId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatFechaHora = (fecha?: string, hora?: string) => {
    if (!fecha) return null;
    try {
      const fechaStr = format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es });
      return hora ? `${fechaStr} · ${hora}` : fechaStr;
    } catch {
      return fecha;
    }
  };

  if (loading || !reserva) {
    return (
      <View style={styles.container}>
        <PageHeader title="Detalle de reserva" onBack={() => navigation.goBack()} />
        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  const categoriaInfo = RESERVA_CATEGORIAS[reserva.categoria];
  const colors = CATEGORIA_COLORS[reserva.categoria];
  const estadoPagoInfo = ESTADO_PAGO_CONFIG[reserva.estadoPago];

  return (
    <View style={styles.container}>
      <PageHeader title="Detalle de reserva" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={[styles.iconLarge, { backgroundColor: colors.bg }]}>
                <Ionicons
                  name={categoriaInfo.icon as any}
                  size={32}
                  color={colors.icon}
                />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.title}>{reserva.nombre}</Text>
                {reserva.proveedor && (
                  <Text style={styles.proveedor}>{reserva.proveedor}</Text>
                )}
                <CategoryBadge category={reserva.categoria} label={categoriaInfo.label} />
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <SectionHeader title="Información" />
            <Card style={styles.infoCard}>
              {reserva.fechaInicio && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Fecha inicio</Text>
                    <Text style={styles.infoValue}>
                      {formatFechaHora(reserva.fechaInicio, reserva.horaInicio)}
                    </Text>
                  </View>
                </View>
              )}

              {reserva.fechaFin && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Fecha fin</Text>
                    <Text style={styles.infoValue}>
                      {formatFechaHora(reserva.fechaFin, reserva.horaFin)}
                    </Text>
                  </View>
                </View>
              )}

              {(reserva.ubicacion || reserva.direccion) && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Ubicación</Text>
                    <Text style={styles.infoValue}>
                      {reserva.ubicacion || reserva.direccion}
                    </Text>
                  </View>
                </View>
              )}

              {reserva.metadatos?.telefono && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{reserva.metadatos.telefono}</Text>
                  </View>
                </View>
              )}

              {reserva.metadatos?.web && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Web</Text>
                    <Text style={styles.infoValue}>{reserva.metadatos.web}</Text>
                  </View>
                </View>
              )}
            </Card>
          </View>

          {reserva.numeroConfirmacion && (
            <View style={styles.section}>
              <SectionHeader title="Confirmación" />
              <Card style={styles.confirmationCard}>
                <View style={styles.confirmationRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="document-text-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.confirmationContent}>
                    <Text style={styles.infoLabel}>Número de confirmación</Text>
                    <Text style={styles.confirmationNumber}>{reserva.numeroConfirmacion}</Text>
                  </View>
                </View>
                <Pressable onPress={handleCopyConfirmation} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={18} color={theme.colors.primaryLight} />
                  <Text style={styles.copyButtonText}>Copiar</Text>
                </Pressable>
              </Card>
            </View>
          )}

          {reserva.precio && (
            <View style={styles.section}>
              <SectionHeader title="Pago" />
              <Card style={styles.paymentCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="card-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Precio</Text>
                    <Text style={styles.infoValue}>
                      {reserva.precio.toFixed(2)} {reserva.moneda}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.estadoRow}>
                  <Text style={styles.infoLabel}>Estado</Text>
                  <View
                    style={[styles.estadoBadge, { backgroundColor: estadoPagoInfo.bg }]}
                  >
                    <Text style={[styles.estadoText, { color: estadoPagoInfo.color }]}>
                      {estadoPagoInfo.label}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {reserva.notas && (
            <View style={styles.section}>
              <SectionHeader title="Notas" />
              <Card style={styles.notesCard}>
                <Text style={styles.notesText}>{reserva.notas}</Text>
              </Card>
            </View>
          )}

          <View style={styles.actions}>
            <SecondaryButton onPress={handleEdit}>Editar reserva</SecondaryButton>
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Eliminar reserva</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  headerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  proveedor: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  confirmationCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  confirmationRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  confirmationContent: {
    flex: 1,
    gap: 4,
  },
  confirmationNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  paymentCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesCard: {
    padding: theme.spacing.md,
  },
  notesText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
