import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SharedExpense, centsToDisplay } from '@/types/shared';
import { GASTO_CATEGORIAS, CategoriaGasto } from '@/types/gasto';
import { theme } from '@/config/theme';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de categorías en inglés a español
const categoryToSpanish: Record<string, CategoriaGasto> = {
  transport: 'transporte',
  accommodation: 'alojamiento',
  food: 'comida',
  activity: 'actividades',
  shopping: 'compras',
  other: 'otros',
  // Categorías ya en español
  transporte: 'transporte',
  alojamiento: 'alojamiento',
  comida: 'comida',
  actividades: 'actividades',
  compras: 'compras',
  otros: 'otros',
};

interface ExpenseCardProps {
  expense: SharedExpense;
  currentUserId?: string;
  userCurrency?: string; // Moneda del perfil del usuario para conversiones
  onPress?: () => void;
}

export function ExpenseCard({
  expense,
  currentUserId,
  userCurrency,
  onPress,
}: ExpenseCardProps) {
  // Obtener configuración de categoría (mapeando si es necesario)
  const spanishCategory = categoryToSpanish[expense.category] || 'otros';
  const categoria = GASTO_CATEGORIAS[spanishCategory];

  const isPayer = expense.paidByUid === currentUserId;
  const myShare = expense.shares.find(s => s.uid === currentUserId);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // Calcular el impacto para el usuario actual
  let myImpact = 0;
  if (myShare) {
    if (isPayer) {
      // Si pagué yo, me deben la diferencia entre lo que pagué y mi parte
      myImpact = expense.amount - myShare.calculatedAmount;
    } else {
      // Si no pagué yo, debo mi parte
      myImpact = -myShare.calculatedAmount;
    }
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Icono de categoría */}
      <View style={[styles.iconContainer, { backgroundColor: categoria.color + '20' }]}>
        <Ionicons name={categoria.icon as keyof typeof Ionicons.glyphMap} size={24} color={categoria.color} />
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.paidBy}>
            {isPayer ? 'Pagaste tú' : `Pagó ${expense.paidByName}`}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
          {expense.participantUids.length > 1 && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.participants}>
                {expense.participantUids.length} pers.
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Importes */}
      <View style={styles.amountsContainer}>
        {/* Monto original (si existe y es diferente a la moneda del usuario) */}
        {expense.originalAmount && expense.originalCurrency ? (
          <>
            <Text style={styles.totalAmount}>
              {centsToDisplay(expense.originalAmount, expense.originalCurrency)}
            </Text>
            {userCurrency && expense.originalCurrency !== userCurrency && (
              <Text style={styles.convertedAmount}>
                ≈ {centsToDisplay(expense.amount, expense.currency)}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.totalAmount}>
            {centsToDisplay(expense.amount, expense.currency)}
          </Text>
        )}

        {myShare && myImpact !== 0 && (
          <Text style={[
            styles.myShare,
            myImpact > 0 && styles.mySharePositive,
            myImpact < 0 && styles.myShareNegative,
          ]}>
            {myImpact > 0 ? '+' : ''}{centsToDisplay(myImpact, expense.currency)}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paidBy: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  dot: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginHorizontal: 4,
  },
  date: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  participants: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  amountsContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  convertedAmount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  myShare: {
    fontSize: 12,
    marginTop: 2,
  },
  mySharePositive: {
    color: theme.colors.success,
  },
  myShareNegative: {
    color: theme.colors.error,
  },
});
