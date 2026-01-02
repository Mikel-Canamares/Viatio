import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, Card } from '@/components';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { useExpensesV2Store } from '@/store/expensesV2Store';
import { useAuth } from '@/context/AuthContext';
import { SharedExpense, centsToDisplay, hasPermission } from '@/types/shared';
import { GASTO_CATEGORIAS } from '@/types/gasto';
import { theme } from '@/theme';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { showToast } from '@/utils/toast';

type RouteParams = {
  ExpenseDetail: { tripId: string; expenseId: string };
};

export default function ExpenseDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ExpenseDetail'>>();
  const { tripId, expenseId } = route.params;
  const { user } = useAuth();

  const { currentTrip, members } = useSharedTripsStore();
  const { getExpenseById, removeExpense } = useExpensesV2Store();

  const [expense, setExpense] = useState<SharedExpense | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserRole = currentTrip?.currentUserRole;
  const isCreator = expense?.createdBy === user?.uid;
  const canEdit = isCreator || hasPermission(currentUserRole, 'canEditAnyExpense');
  const canDelete = isCreator || hasPermission(currentUserRole, 'canDeleteAnyExpense');

  useEffect(() => {
    loadExpense();
  }, [expenseId]);

  const loadExpense = async () => {
    setLoading(true);
    const data = await getExpenseById(tripId, expenseId);
    setExpense(data);
    setLoading(false);
  };

  const handleEdit = () => {
    navigation.navigate('AddSharedExpense', { tripId, expenseId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro de que quieres eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeExpense(tripId, expenseId);
            if (success) {
              showToast.success('Gasto eliminado');
              navigation.goBack();
            } else {
              showToast.error('Error', 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  };

  if (loading || !expense) {
    return (
      <ScreenContainer>
        <PageHeader title="Cargando..." onBack={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const categoria = GASTO_CATEGORIAS[expense.category as keyof typeof GASTO_CATEGORIAS]
    || { icon: 'help-circle-outline', color: theme.colors.textSecondary, label: 'Otro' };

  const payer = members.find(m => m.uid === expense.paidByUid);
  const splitMethodLabels: Record<string, string> = {
    equal: 'Igualitario',
    exact: 'Importes exactos',
    percentage: 'Por porcentaje',
    shares: 'Por participaciones',
  };

  return (
    <ScreenContainer edges={['top']}>
      <PageHeader
        title="Detalle del gasto"
        onBack={() => navigation.goBack()}
        rightElement={
          canEdit ? (
            <Pressable onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header con categoría e importe */}
        <View style={styles.header}>
          <View style={[styles.categoryIcon, { backgroundColor: categoria.color + '20' }]}>
            <Ionicons name={categoria.icon as any} size={32} color={categoria.color} />
          </View>

          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.amount}>
            {centsToDisplay(expense.amount, expense.currency)}
          </Text>

          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: categoria.color }]}>
              {categoria.label}
            </Text>
          </View>
        </View>

        {/* Info del pago */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Información del pago</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.infoLabel}>Pagado por</Text>
            <View style={styles.infoValueContainer}>
              {payer?.photoURL ? (
                <Image source={{ uri: payer.photoURL }} style={styles.payerAvatar} />
              ) : (
                <View style={[styles.payerAvatar, styles.payerAvatarPlaceholder]}>
                  <Text style={styles.payerAvatarText}>
                    {expense.paidByName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.infoValue}>{expense.paidByName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>
              {format(parseISO(expense.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="git-compare-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.infoLabel}>Reparto</Text>
            <Text style={styles.infoValue}>
              {splitMethodLabels[expense.splitMethod]}
            </Text>
          </View>
        </Card>

        {/* Reparto entre participantes */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>
            Reparto ({expense.shares.length} personas)
          </Text>

          {expense.shares.map((share) => {
            const member = members.find(m => m.uid === share.uid);
            const isCurrentUser = share.uid === user?.uid;

            return (
              <View key={share.uid} style={styles.shareRow}>
                {member?.photoURL ? (
                  <Image source={{ uri: member.photoURL }} style={styles.shareAvatar} />
                ) : (
                  <View style={[styles.shareAvatar, styles.shareAvatarPlaceholder]}>
                    <Text style={styles.shareAvatarText}>
                      {share.displayName.charAt(0)}
                    </Text>
                  </View>
                )}

                <Text style={styles.shareName}>
                  {share.displayName}
                  {isCurrentUser && <Text style={styles.youLabel}> (tú)</Text>}
                </Text>

                <Text style={styles.shareAmount}>
                  {centsToDisplay(share.calculatedAmount, expense.currency)}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Notas */}
        {expense.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notas</Text>
            <Text style={styles.notes}>{expense.notes}</Text>
          </Card>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Creado el {format(expense.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
          </Text>
          {expense.updatedAt > expense.createdAt && (
            <Text style={styles.metadataText}>
              Editado el {format(expense.updatedAt, "d MMM yyyy, HH:mm", { locale: es })}
            </Text>
          )}
        </View>

        {/* Botón eliminar */}
        {canDelete && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Eliminar gasto</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  payerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  payerAvatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  shareAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  shareAvatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  shareName: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  youLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  shareAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  notes: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  metadata: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
