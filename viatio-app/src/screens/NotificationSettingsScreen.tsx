/**
 * NOTIFICATION SETTINGS SCREEN
 *
 * Configuración simplificada de notificaciones:
 * - Preferencias básicas (on/off)
 * - Tiempos de antelación personalizables
 * - Acceso a gestión de notificaciones programadas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { ProfileStackParamList } from '@/navigation/types';
import {
  getPreferenciasNotificaciones,
  setPreferenciasNotificaciones,
} from '@/services/perfilService';
import { PreferenciasNotificaciones, TIEMPOS_ANTELACION, TiempoAntelacion } from '@/types/perfil';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationsSettings'>;

export default function NotificationSettingsScreen({ navigation }: Props) {
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const prefs = await getPreferenciasNotificaciones();
      setPreferencias(prefs);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handlePreferencesChange = async (
    key: keyof PreferenciasNotificaciones,
    value: boolean | TiempoAntelacion
  ) => {
    if (!preferencias) return;

    const updated = { ...preferencias, [key]: value };
    setPreferencias(updated);

    try {
      await setPreferenciasNotificaciones(updated);
    } catch (error) {
      console.error('Error updating preferences:', error);
      showToast.error('Error', 'No se pudieron guardar las preferencias');
    }
  };

  if (!preferencias) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsManagement')}
          style={styles.manageButton}
        >
          <Ionicons name="list" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Preferencias generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias generales</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Recordatorios de viaje</Text>
              <Text style={styles.settingDescription}>
                Recibe avisos antes de que comience tu viaje
              </Text>
            </View>
            <Switch
              value={preferencias.recordatoriosViaje}
              onValueChange={value => handlePreferencesChange('recordatoriosViaje', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Actualizaciones de reservas</Text>
              <Text style={styles.settingDescription}>
                Recibe recordatorios de tus reservas
              </Text>
            </View>
            <Switch
              value={preferencias.actualizacionesReservas}
              onValueChange={value => handlePreferencesChange('actualizacionesReservas', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Alertas de documentos</Text>
              <Text style={styles.settingDescription}>
                Avisos sobre documentos próximos a vencer
              </Text>
            </View>
            <Switch
              value={preferencias.alertasDocumentos}
              onValueChange={value => handlePreferencesChange('alertasDocumentos', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Tiempos de antelación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiempos de aviso</Text>
          <Text style={styles.sectionDescription}>
            Configura cuánto tiempo antes quieres recibir las notificaciones
          </Text>

          <View style={styles.timeSettingContainer}>
            <Text style={styles.timeSettingLabel}>Avisar antes de los viajes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeOptions}>
                {(Object.keys(TIEMPOS_ANTELACION) as TiempoAntelacion[]).map(key => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.timeOption,
                      preferencias.tiempoAvisoViaje === key && styles.timeOptionActive,
                    ]}
                    onPress={() => handlePreferencesChange('tiempoAvisoViaje', key)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        preferencias.tiempoAvisoViaje === key && styles.timeOptionTextActive,
                      ]}
                    >
                      {TIEMPOS_ANTELACION[key].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.timeSettingContainer}>
            <Text style={styles.timeSettingLabel}>Avisar antes de las reservas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeOptions}>
                {(Object.keys(TIEMPOS_ANTELACION) as TiempoAntelacion[]).map(key => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.timeOption,
                      preferencias.tiempoAvisoReserva === key && styles.timeOptionActive,
                    ]}
                    onPress={() => handlePreferencesChange('tiempoAvisoReserva', key)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        preferencias.tiempoAvisoReserva === key && styles.timeOptionTextActive,
                      ]}
                    >
                      {TIEMPOS_ANTELACION[key].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Gestión avanzada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión avanzada</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('NotificationsManagement')}
          >
            <View style={styles.actionCardIcon}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Ver notificaciones programadas</Text>
              <Text style={styles.actionCardDescription}>
                Consulta todas tus notificaciones activas, estadísticas y más
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  manageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
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

  // Sections
  section: {
    backgroundColor: '#fff',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },

  // Settings rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Time settings
  timeSettingContainer: {
    marginBottom: theme.spacing.lg,
  },
  timeSettingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  timeOptionTextActive: {
    color: '#fff',
  },

  // Action card
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
