/**
 * NOTIFICATIONS SETTINGS SCREEN
 *
 * Pantalla de configuración de preferencias de notificaciones.
 * Permite activar/desactivar diferentes tipos de notificaciones.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PreferenciasNotificaciones,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
} from '@/types/perfil';
import {
  getPreferenciasNotificaciones,
  setPreferenciasNotificaciones,
} from '@/services/perfilService';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SwitchItem } from '@/components/SwitchItem';
import { theme } from '@/config';

type RootStackParamList = {
  NotificationsSettings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationsSettings'>;

export default function NotificationsSettingsScreen({ navigation }: Props) {
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones>(
    DEFAULT_PREFERENCIAS_NOTIFICACIONES
  );
  const [loading, setLoading] = useState(true);

  // Cargar preferencias al montar
  useEffect(() => {
    loadPreferencias();
  }, []);

  /**
   * Carga las preferencias desde AsyncStorage
   */
  const loadPreferencias = async () => {
    try {
      setLoading(true);
      const prefs = await getPreferenciasNotificaciones();
      setPreferencias(prefs);
    } catch (error) {
      console.error('Error cargando preferencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias de notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza una preferencia específica
   */
  const updatePreferencia = async <K extends keyof PreferenciasNotificaciones>(
    key: K,
    value: PreferenciasNotificaciones[K]
  ) => {
    try {
      const nuevasPreferencias = { ...preferencias, [key]: value };
      setPreferencias(nuevasPreferencias);

      // Guardar inmediatamente en AsyncStorage
      await setPreferenciasNotificaciones(nuevasPreferencias);
    } catch (error) {
      console.error('Error guardando preferencia:', error);
      Alert.alert('Error', 'No se pudo guardar la preferencia.');

      // Revertir el cambio en caso de error
      setPreferencias(preferencias);
    }
  };

  return (
    <ScreenContainer scroll>
      <PageHeader title="Notificaciones" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* Sección Viajes */}
        <Text style={styles.sectionTitle}>Viajes</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Recordatorios de viaje"
            description="Recibe avisos antes de tus viajes"
            value={preferencias.recordatoriosViaje}
            onValueChange={(value) => updatePreferencia('recordatoriosViaje', value)}
            disabled={loading}
          />

          <SwitchItem
            label="Actualizaciones de reservas"
            description="Cambios en vuelos, hoteles, etc."
            value={preferencias.actualizacionesReservas}
            onValueChange={(value) => updatePreferencia('actualizacionesReservas', value)}
            disabled={loading}
          />

          <SwitchItem
            label="Alertas de documentos"
            description="Documentos próximos a expirar"
            value={preferencias.alertasDocumentos}
            onValueChange={(value) => updatePreferencia('alertasDocumentos', value)}
            disabled={loading}
          />
        </Card>

        {/* Sección General */}
        <Text style={styles.sectionTitle}>General</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Resumen semanal"
            description="Email con tu actividad de la semana"
            value={preferencias.resumenSemanal}
            onValueChange={(value) => updatePreferencia('resumenSemanal', value)}
            disabled={loading}
          />

          <SwitchItem
            label="Promociones y ofertas"
            description="Descuentos y ofertas especiales"
            value={preferencias.promociones}
            onValueChange={(value) => updatePreferencia('promociones', value)}
            disabled={loading}
          />
        </Card>

        {/* Nota informativa */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Las preferencias se guardan automáticamente al cambiar cada opción.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: theme.spacing.xl,
    padding: 0, // Los SwitchItem tienen su propio padding
  },
  infoContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primaryLight,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
