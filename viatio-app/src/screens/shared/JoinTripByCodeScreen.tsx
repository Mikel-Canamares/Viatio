import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PageHeader, PrimaryButton, Card } from '@/components';
import { findInviteByCode, acceptInvitation } from '@/services/firestore/invitesService';
import { downloadSharedTrip } from '@/services/sync/syncDownload';
import { useViajesStore } from '@/store/viajesStore';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/theme';
import { showToast } from '@/utils/toast';

export default function JoinTripByCodeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { fetchViajes } = useViajesStore();

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Prellenar email si usuario está logueado
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanCode.length < 6) {
      showToast.error('Error', 'Introduce un código válido');
      return;
    }

    if (!cleanEmail) {
      showToast.error('Error', 'Introduce tu email');
      return;
    }

    setLoading(true);

    try {
      // PASAR EMAIL como segundo parámetro para validación
      const result = await findInviteByCode(cleanCode, cleanEmail);

      if (!result) {
        showToast.error('No encontrado', 'No existe una invitación con este código');
        setLoading(false);
        return;
      }

      const { tripId, invite } = result;

      // Intentar aceptar la invitación
      await acceptInvitation(tripId, invite.id);

      // Descargar el viaje completo a SQLite local
      if (user?.uid) {
        console.log('[JoinTrip] Descargando viaje a local...');
        const downloadResult = await downloadSharedTrip(tripId, user.uid);

        if (downloadResult.success) {
          console.log('[JoinTrip] Viaje descargado:', downloadResult.stats);
          // Refrescar la lista de viajes
          await fetchViajes(user.uid);
        } else {
          console.warn('[JoinTrip] Error al descargar viaje:', downloadResult.error);
          // Aún así mostramos éxito porque la invitación fue aceptada
        }
      }

      showToast.success('¡Te has unido!', `Bienvenido a ${invite.tripName}`);
      // Volver a la lista de viajes
      navigation.popToTop();
    } catch (error: any) {
      showToast.error('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <PageHeader title="Unirse a viaje" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="qr-code-outline" size={64} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Introduce el código de invitación</Text>
        <Text style={styles.subtitle}>
          Pide a quien te invitó que te comparta el código del viaje
        </Text>

        <Card style={styles.card}>
          <Text style={styles.inputLabel}>Tu email</Text>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@email.com"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!user?.email}
          />
          {user?.email && (
            <Text style={styles.hint}>Email de tu cuenta actual</Text>
          )}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Código</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder="XXXXXXXX"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            maxLength={10}
          />
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
          <Text style={styles.infoText}>
            El código solo funciona si fue generado para tu email
          </Text>
        </View>

        <PrimaryButton
          title="Unirme al viaje"
          onPress={handleJoin}
          loading={loading}
          disabled={code.trim().length < 6 || !email.trim()}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emailInput: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.success + '10',
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
