import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ScreenContainer, PageHeader, PrimaryButton, Card } from '@/components';
import { useSharedTripsStore } from '@/store/sharedTripsStore';
import { TripRole, ROLE_LABELS } from '@/types/shared';
import { theme } from '@/theme';
import { showToast } from '@/utils/toast';

type RouteParams = {
  InviteToTrip: { viajeId: string; firestoreId: string };
};

export default function InviteToTripScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'InviteToTrip'>>();
  const { firestoreId } = route.params;
  // Usamos firestoreId como tripId para las operaciones de Firestore
  const tripId = firestoreId;

  const { currentTrip, inviteMember, invitations } = useSharedTripsStore();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TripRole>('member');
  const [loading, setLoading] = useState(false);

  // Encontrar código de invitación existente o generar uno nuevo
  const existingCode = invitations.find(i => i.status === 'pending')?.inviteCode;

  const handleSendInvite = async () => {
    if (!email.trim()) {
      showToast.error('Error', 'Introduce un email');
      return;
    }

    setLoading(true);

    try {
      const invite = await inviteMember(tripId, email.trim(), role);

      if (invite) {
        showToast.success('Invitación enviada', `Se ha invitado a ${email}`);
        setEmail('');
      }
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (existingCode) {
      await Clipboard.setStringAsync(existingCode);
      showToast.success('Copiado', 'Código copiado al portapapeles');
    }
  };

  const handleShare = async () => {
    try {
      const message = `¡Únete a mi viaje "${currentTrip?.name}" en Viatio!\n\nCódigo: ${existingCode || 'Invita primero a alguien para generar un código'}`;

      await Share.share({
        message,
        title: `Invitación a ${currentTrip?.name}`,
      });
    } catch (error) {
      // Usuario canceló
    }
  };

  return (
    <ScreenContainer>
      <PageHeader title="Invitar" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Invitar por email */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Invitar por email</Text>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.inputLabel}>Rol</Text>
          <View style={styles.roleSelector}>
            {(['member', 'admin', 'read_only'] as TripRole[]).map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.roleOption,
                  role === r && styles.roleOptionSelected,
                ]}
                onPress={() => setRole(r)}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    role === r && styles.roleOptionTextSelected,
                  ]}
                >
                  {ROLE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              El usuario recibirá una notificación automática en su app
            </Text>
          </View>

          <PrimaryButton
            title="Enviar invitación"
            onPress={handleSendInvite}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* Compartir código */}
        {existingCode && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Código manual (opcional)</Text>
            <Text style={styles.codeDescription}>
              Solo comparte este código si el invitado no recibe la notificación automática
            </Text>

            <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
              <Text style={styles.codeText}>{existingCode}</Text>
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
            </Pressable>

            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.shareButtonText}>Compartir enlace</Text>
            </Pressable>
          </Card>
        )}

        {/* Info sobre roles */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Sobre los roles</Text>

          <View style={styles.roleInfo}>
            <Ionicons name="shield-checkmark" size={18} color={theme.colors.primary} />
            <View style={styles.roleInfoContent}>
              <Text style={styles.roleInfoTitle}>Administrador</Text>
              <Text style={styles.roleInfoDescription}>
                Puede gestionar gastos, miembros e invitaciones
              </Text>
            </View>
          </View>

          <View style={styles.roleInfo}>
            <Ionicons name="person" size={18} color={theme.colors.textSecondary} />
            <View style={styles.roleInfoContent}>
              <Text style={styles.roleInfoTitle}>Miembro</Text>
              <Text style={styles.roleInfoDescription}>
                Puede ver y añadir gastos propios
              </Text>
            </View>
          </View>

          <View style={styles.roleInfo}>
            <Ionicons name="eye" size={18} color={theme.colors.textTertiary} />
            <View style={styles.roleInfoContent}>
              <Text style={styles.roleInfoTitle}>Solo lectura</Text>
              <Text style={styles.roleInfoDescription}>
                Solo puede ver el viaje y los gastos
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  roleOptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  roleOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  codeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  roleInfoContent: {
    flex: 1,
  },
  roleInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  roleInfoDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
