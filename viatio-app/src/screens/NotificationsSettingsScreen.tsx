/**
 * NOTIFICATIONS SETTINGS SCREEN
 *
 * Pantalla de configuración de preferencias de notificaciones.
 * Incluye secciones para viajes, gastos, gastos compartidos y modo silencio.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  PreferenciasNotificaciones,
  DEFAULT_PREFERENCIAS_NOTIFICACIONES,
  TIEMPOS_ANTELACION,
  TiempoAntelacion,
  UMBRALES_PRESUPUESTO,
  UmbralPresupuesto,
  MODOS_SILENCIO,
  ModoSilencio,
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
import { TimeInput } from '@/components/TimeInput';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';

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

  useEffect(() => {
    loadPreferencias();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const hasPerms = await hasNotificationPermissions();
    setPermissionsGranted(hasPerms);
  };

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

  const loadPreferencias = async () => {
    try {
      setLoading(true);
      const prefs = await getPreferenciasNotificaciones();
      setPreferencias(prefs);
    } catch (error) {
      console.error('Error cargando preferencias:', error);
      showToast.error('Error', 'No se pudieron cargar las preferencias.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferencia = useCallback(async <K extends keyof PreferenciasNotificaciones>(
    key: K,
    value: PreferenciasNotificaciones[K]
  ) => {
    try {
      const nuevasPreferencias = { ...preferencias, [key]: value };
      setPreferencias(nuevasPreferencias);
      await setPreferenciasNotificaciones(nuevasPreferencias);
    } catch (error) {
      console.error('Error guardando preferencia:', error);
      showToast.error('Error', 'No se pudo guardar la preferencia.');
      setPreferencias(preferencias);
    }
  }, [preferencias]);

  const updateGastosCompartidos = useCallback(async (
    key: keyof PreferenciasNotificaciones['gastosCompartidos'],
    value: boolean
  ) => {
    try {
      const nuevasPreferencias = {
        ...preferencias,
        gastosCompartidos: {
          ...preferencias.gastosCompartidos,
          [key]: value,
        },
      };
      setPreferencias(nuevasPreferencias);
      await setPreferenciasNotificaciones(nuevasPreferencias);
    } catch (error) {
      console.error('Error guardando preferencia:', error);
      showToast.error('Error', 'No se pudo guardar la preferencia.');
    }
  }, [preferencias]);

  const updateHorarioSilencio = useCallback(async (
    key: keyof PreferenciasNotificaciones['horarioSilencio'],
    value: boolean | string
  ) => {
    try {
      const nuevasPreferencias = {
        ...preferencias,
        horarioSilencio: {
          ...preferencias.horarioSilencio,
          [key]: value,
        },
      };
      setPreferencias(nuevasPreferencias);
      await setPreferenciasNotificaciones(nuevasPreferencias);
    } catch (error) {
      console.error('Error guardando preferencia:', error);
      showToast.error('Error', 'No se pudo guardar la preferencia.');
    }
  }, [preferencias]);

  const isDisabled = loading || !permissionsGranted || !preferencias.notificacionesActivas;

  return (
    <ScreenContainer>
      <PageHeader
        title="Notificaciones"
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable
            onPress={() => (navigation as any).navigate('NotificationDebug')}
            style={{ padding: 8 }}
          >
            <Ionicons name="bug-outline" size={24} color={theme.colors.text} />
          </Pressable>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner de permisos */}
        {!permissionsGranted && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <View style={styles.warningIcon}>
                <Ionicons name="notifications-off" size={28} color="#F59E0B" />
              </View>
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Permisos necesarios</Text>
                <Text style={styles.warningDescription}>
                  Activa los permisos para recibir recordatorios de tus viajes
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

        {/* Master Switch */}
        <Card style={styles.masterCard}>
          <SwitchItem
            label="Notificaciones activas"
            description="Activar o desactivar todas las notificaciones"
            value={preferencias.notificacionesActivas}
            onValueChange={(value) => updatePreferencia('notificacionesActivas', value)}
            disabled={loading || !permissionsGranted}
          />
        </Card>

        {/* Sección Viajes */}
        <Text style={styles.sectionTitle}>Viajes y Reservas</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Recordatorios de viaje"
            description="Avisos antes del inicio de tus viajes"
            value={preferencias.recordatoriosViaje}
            onValueChange={(value) => updatePreferencia('recordatoriosViaje', value)}
            disabled={isDisabled}
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
            label="Recordatorios de reservas"
            description="Avisos antes de cada reserva"
            value={preferencias.actualizacionesReservas}
            onValueChange={(value) => updatePreferencia('actualizacionesReservas', value)}
            disabled={isDisabled}
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
            disabled={isDisabled}
          />
        </Card>

        {/* Sección Gastos */}
        <Text style={styles.sectionTitle}>Presupuesto</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Alertas de presupuesto"
            description="Aviso cuando superes el umbral configurado"
            value={preferencias.alertasPresupuesto}
            onValueChange={(value) => updatePreferencia('alertasPresupuesto', value)}
            disabled={isDisabled}
          />

          {preferencias.alertasPresupuesto && (
            <SelectItem
              label="Umbral de alerta"
              value={preferencias.umbralAlertaPresupuesto.toString()}
              options={Object.entries(UMBRALES_PRESUPUESTO).map(([key, config]) => ({
                value: key,
                label: `${config.label} - ${config.descripcion}`,
              }))}
              onSelect={(value) => updatePreferencia('umbralAlertaPresupuesto', parseInt(value, 10) as UmbralPresupuesto)}
              icon="wallet-outline"
            />
          )}
        </Card>

        {/* Sección Gastos Compartidos */}
        <Text style={styles.sectionTitle}>Gastos Compartidos</Text>
        <Card style={styles.card}>
          <View style={styles.sectionInfo}>
            <Ionicons name="people-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.sectionInfoText}>
              Notificaciones de viajes compartidos con otros usuarios
            </Text>
          </View>

          <SwitchItem
            label="Nuevo gasto añadido"
            description="Cuando alguien añade un gasto al viaje"
            value={preferencias.gastosCompartidos.nuevoGasto}
            onValueChange={(value) => updateGastosCompartidos('nuevoGasto', value)}
            disabled={isDisabled}
          />

          <SwitchItem
            label="Gasto editado"
            description="Cuando se modifica un gasto existente"
            value={preferencias.gastosCompartidos.gastoEditado}
            onValueChange={(value) => updateGastosCompartidos('gastoEditado', value)}
            disabled={isDisabled}
          />

          <SwitchItem
            label="Gasto eliminado"
            description="Cuando se elimina un gasto del viaje"
            value={preferencias.gastosCompartidos.gastoEliminado}
            onValueChange={(value) => updateGastosCompartidos('gastoEliminado', value)}
            disabled={isDisabled}
          />

          <SwitchItem
            label="Liquidación solicitada"
            description="Cuando alguien te solicita un pago"
            value={preferencias.gastosCompartidos.liquidacionSolicitada}
            onValueChange={(value) => updateGastosCompartidos('liquidacionSolicitada', value)}
            disabled={isDisabled}
          />

          <SwitchItem
            label="Liquidación completada"
            description="Cuando se completa un pago pendiente"
            value={preferencias.gastosCompartidos.liquidacionCompletada}
            onValueChange={(value) => updateGastosCompartidos('liquidacionCompletada', value)}
            disabled={isDisabled}
          />
        </Card>

        {/* Sección Modo Silencio */}
        <Text style={styles.sectionTitle}>Control de Notificaciones</Text>
        <Card style={styles.card}>
          <SelectItem
            label="Modo silencio"
            value={preferencias.modoSilencio}
            options={Object.entries(MODOS_SILENCIO).map(([key, config]) => ({
              value: key,
              label: `${config.label} - ${config.descripcion}`,
            }))}
            onSelect={(value) => updatePreferencia('modoSilencio', value as ModoSilencio)}
            icon="moon-outline"
          />

          <SwitchItem
            label="Horario de silencio"
            description="No recibir notificaciones en cierto horario"
            value={preferencias.horarioSilencio.activo}
            onValueChange={(value) => updateHorarioSilencio('activo', value)}
            disabled={isDisabled}
          />

          {preferencias.horarioSilencio.activo && (
            <View style={styles.horarioContainer}>
              <View style={styles.horarioRow}>
                <View style={styles.horarioInput}>
                  <TimeInput
                    label="Desde"
                    value={preferencias.horarioSilencio.inicio}
                    onChangeTime={(time) => updateHorarioSilencio('inicio', time)}
                  />
                </View>
                <View style={styles.horarioSeparator}>
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.textMuted} />
                </View>
                <View style={styles.horarioInput}>
                  <TimeInput
                    label="Hasta"
                    value={preferencias.horarioSilencio.fin}
                    onChangeTime={(time) => updateHorarioSilencio('fin', time)}
                  />
                </View>
              </View>
              <Text style={styles.horarioHint}>
                Ejemplo: 22:00 → 08:00 silencia notificaciones durante la noche
              </Text>
            </View>
          )}
        </Card>

        {/* Sección General */}
        <Text style={styles.sectionTitle}>General</Text>
        <Card style={styles.card}>
          <SwitchItem
            label="Resumen semanal"
            description="Email con tu actividad de la semana"
            value={preferencias.resumenSemanal}
            onValueChange={(value) => updatePreferencia('resumenSemanal', value)}
            disabled={isDisabled}
          />

          <SwitchItem
            label="Promociones y ofertas"
            description="Descuentos y ofertas especiales"
            value={preferencias.promociones}
            onValueChange={(value) => updatePreferencia('promociones', value)}
            disabled={isDisabled}
          />
        </Card>

        {/* Nota informativa */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.primaryLight} />
          <Text style={styles.infoText}>
            Las preferencias se guardan automáticamente al cambiar cada opción.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  masterCard: {
    marginBottom: theme.spacing.xl,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
    padding: 0,
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
    padding: 0,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    gap: theme.spacing.sm,
  },
  sectionInfoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  horarioContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  horarioInput: {
    flex: 1,
  },
  horarioSeparator: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  horarioHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primaryLight,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: theme.spacing.xxl,
  },
});
