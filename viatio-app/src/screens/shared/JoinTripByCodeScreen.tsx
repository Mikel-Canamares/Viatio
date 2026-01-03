import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 6) {
      showToast.error('Error', 'Introduce un código válido');
      return;
    }

    setLoading(true);

    try {
      const result = await findInviteByCode(cleanCode);

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

        <PrimaryButton
          title="Unirme al viaje"
          onPress={handleJoin}
          loading={loading}
          disabled={code.trim().length < 6}
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
    marginBottom: 24,
    padding: 8,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: 16,
  },
});
