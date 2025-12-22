/**
 * NOTIFICATIONS SETTINGS SCREEN
 *
 * Pantalla de configuración de preferencias de notificaciones.
 * Permite activar/desactivar diferentes tipos de notificaciones.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PreferenciasNotificaciones,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
  TIEMPOS_ANTELACION,
  TiempoAntelacion,
} from '@/types/perfil';
import {
  getPreferenciasNotificaciones,
  setPreferenciasNotificaciones,
} from '@/services/perfilService';
import {
  requestNotificationPermissions,
  hasNotificationPermissions,
} from '@/services/notificationsService';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SwitchItem } from '@/components/SwitchItem';
import { SelectItem } from '@/components/SelectItem';
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
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Cargar preferencias y verificar permisos al montar
  useEffect(() => {
    loadPreferencias();
    checkPermissions();
  }, []);

  /**
   * Verifica si hay permisos de notificaciones
   */
  const checkPermissions = async () => {
    const hasPerms = await hasNotificationPermissions();
    setPermissionsGranted(hasPerms);
  };

  /**
   * Solicita permisos de notificaciones
   */
  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionsGranted(granted);

    if (!granted) {
      Alert.alert(
        'Permisos denegados',
        'Para recibir notificaciones, debes activar los permisos en la configuración del dispositivo.'
      );
    }
  };

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
        {/* Banner de permisos si no están activos */}
        {!permissionsGranted && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <View style={styles.warningIcon}>
                <Text style={styles.warningEmoji}>⚠️</Text>
              </View>
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Permisos necesarios</Text>
                <Text style={styles.warningDescription}>
                  Activa los permisos de notificaciones para recibir recordatorios de tus viajes
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.permissionButtonText}>Activar permisos</Text>
            </Pressable>
          </Card>
        )}

        {/* Sección Viajes */}
        <Text style={styles.sectionTitle}>Viajes</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Recordatorios de viaje"
            description="Recibe avisos antes de tus viajes"
            value={preferencias.recordatoriosViaje}
            onValueChange={(value) => updatePreferencia('recordatoriosViaje', value)}
            disabled={loading || !permissionsGranted}
          />

          {preferencias.recordatoriosViaje && (
            <SelectItem
              label="Avisar con antelación"
              value={preferencias.tiempoAvisoViaje}
              options={Object.entries(TIEMPOS_ANTELACION).map(([key, config]) => ({
                value: key,
                label: config.label,
              }))}
              onSelect={(value) => updatePreferencia('tiempoAvisoViaje', value as TiempoAntelacion)}
              icon="time-outline"
            />
          )}

          <SwitchItem
            label="Actualizaciones de reservas"
            description="Avisos de tus reservas programadas"
            value={preferencias.actualizacionesReservas}
            onValueChange={(value) => updatePreferencia('actualizacionesReservas', value)}
            disabled={loading || !permissionsGranted}
          />

          {preferencias.actualizacionesReservas && (
            <SelectItem
              label="Avisar con antelación"
              value={preferencias.tiempoAvisoReserva}
              options={Object.entries(TIEMPOS_ANTELACION).map(([key, config]) => ({
                value: key,
                label: config.label,
              }))}
              onSelect={(value) => updatePreferencia('tiempoAvisoReserva', value as TiempoAntelacion)}
              icon="time-outline"
            />
          )}

          <SwitchItem
            label="Alertas de documentos"
            description="Documentos próximos a expirar"
            value={preferencias.alertasDocumentos}
            onValueChange={(value) => updatePreferencia('alertasDocumentos', value)}
            disabled={loading || !permissionsGranted}
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
            disabled={loading || !permissionsGranted}
          />

          <SwitchItem
            label="Promociones y ofertas"
            description="Descuentos y ofertas especiales"
            value={preferencias.promociones}
            onValueChange={(value) => updatePreferencia('promociones', value)}
            disabled={loading || !permissionsGranted}
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
  warningCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  warningIcon: {
    marginRight: theme.spacing.md,
  },
  warningEmoji: {
    fontSize: 32,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
