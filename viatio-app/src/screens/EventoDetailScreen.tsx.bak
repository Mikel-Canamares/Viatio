/**
 * EVENTO DETAIL SCREEN
 *
 * Pantalla de detalle de un evento personalizado.
 * Muestra información completa del evento y permite marcar como completado.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { CustomModal } from '@/components';
import { useEventosStore } from '@/store/eventosStore';
import {
  EventoPersonalizado,
  EVENTO_CATEGORIAS,
} from '@/types/evento';
import * as eventosService from '@/services/eventosService';
import { theme } from '@/config/theme';
import { showToast } from '@/utils/toast';

// ============================================
// TIPOS
// ============================================

type RootStackParamList = {
  EventoDetail: { eventoId: string };
  AddEvento: { viajeId: string; diaId?: string; eventoId?: string };
  TripMap: { viajeId: string; lugarId?: string };
};

type EventoDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventoDetail'>;
type EventoDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function EventoDetailScreen() {
  const navigation = useNavigation<EventoDetailScreenNavigationProp>();
  const route = useRoute<EventoDetailScreenRouteProp>();
  const { eventoId } = route.params;

  const { removeEvento } = useEventosStore();

  const [evento, setEvento] = useState<EventoPersonalizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  // Cargar evento
  useEffect(() => {
    loadEvento();
  }, [eventoId]);

  const loadEvento = async () => {
    try {
      setLoading(true);
      const eventoData = await eventosService.getEventoById(eventoId);
      if (!eventoData) {
        showToast.error('Error', 'No se encontró el evento');
        navigation.goBack();
        return;
      }
      setEvento(eventoData);
    } catch (error) {
      console.error('Error loading evento:', error);
      showToast.error('Error', 'No se pudo cargar el evento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleBack = () => navigation.goBack();

  const handleEdit = () => {
    if (!evento) return;
    navigation.navigate('AddEvento', {
      viajeId: evento.viajeId,
      diaId: evento.diaId,
      eventoId: evento.id,
    });
  };

  const handleDelete = () => {
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    const success = await removeEvento(eventoId);
    if (success) {
      navigation.goBack();
    } else {
      showToast.error('Error', 'No se pudo eliminar el evento');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <PageHeader title="Detalle del evento" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!evento) {
    return (
      <ScreenContainer>
        <PageHeader title="Detalle del evento" onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Evento no encontrado</Text>
        </View>
      </ScreenContainer>
    );
  }

  const categoriaConfig = EVENTO_CATEGORIAS[evento.categoria];

  return (
    <ScreenContainer>
      <PageHeader
        title="Detalle del evento"
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categoría badge */}
        <View style={styles.categoryBadgeContainer}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoriaConfig.bgColor },
            ]}
          >
            <Ionicons
              name={categoriaConfig.icon as any}
              size={20}
              color={categoriaConfig.color}
            />
            <Text style={[styles.categoryText, { color: categoriaConfig.color }]}>
              {categoriaConfig.label}
            </Text>
          </View>
        </View>

        {/* Nombre del evento */}
        <View style={styles.section}>
          <Text style={styles.eventName}>{evento.nombre}</Text>
        </View>

        {/* Descripción */}
        {evento.descripcion && (
          <View style={styles.section}>
            <SectionHeader title="Descripción" />
            <Text style={styles.description}>{evento.descripcion}</Text>
          </View>
        )}

        {/* Horario */}
        {(evento.horaInicio || evento.horaFin) && (
          <View style={styles.section}>
            <SectionHeader title="Horario" />
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>
                {evento.horaInicio || '--:--'} - {evento.horaFin || '--:--'}
              </Text>
            </View>
          </View>
        )}

        {/* Ubicación */}
        {evento.ubicacion && (
          <View style={styles.section}>
            <SectionHeader title="Ubicación" />
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoText}>{evento.ubicacion}</Text>
            </View>
          </View>
        )}

        {/* Notas */}
        {evento.notas && (
          <View style={styles.section}>
            <SectionHeader title="Notas" />
            <Text style={styles.description}>{evento.notas}</Text>
          </View>
        )}

        {/* Botón editar */}
        <View style={styles.editButtonContainer}>
          <SecondaryButton onPress={handleEdit}>
            <View style={styles.buttonContent}>
              <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonTextSecondary}>Editar evento</Text>
            </View>
          </SecondaryButton>
        </View>

        {/* Botón eliminar */}
        <View style={styles.deleteButtonContainer}>
          <SecondaryButton onPress={handleDelete}>
            <View style={styles.buttonContent}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={styles.deleteButtonText}>Eliminar evento</Text>
            </View>
          </SecondaryButton>
        </View>
      </ScrollView>

      <CustomModal
        visible={deleteModal}
        type="warning"
        title="Eliminar evento"
        message="¿Estás seguro de que quieres eliminar este evento?"
        onClose={() => setDeleteModal(false)}
        primaryButton={{
          text: 'Eliminar',
          onPress: confirmDelete,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => {},
        }}
      />
    </ScreenContainer>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  eventName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  infoText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  completedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  completedSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  editButtonContainer: {
    marginTop: theme.spacing.lg,
  },
  deleteButtonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
