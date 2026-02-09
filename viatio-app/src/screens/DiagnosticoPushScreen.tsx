/**
 * PANTALLA DE DIAGNÓSTICO - Push Notifications
 *
 * Pantalla temporal para diagnosticar problemas con push tokens
 * y forzar el registro manual.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { registerPushToken, getDeviceInfo } from '@/services/pushTokenService';
import { getPushToken } from '@/services/firestore/usersService';

export default function DiagnosticoPushScreen() {
  const { user } = useAuth();
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    ejecutarDiagnostico();
  }, []);

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    const resultado: any = {
      timestamp: new Date().toISOString(),
      usuario: {
        autenticado: !!user,
        uid: user?.uid || null,
        email: user?.email || null,
      },
      dispositivo: {},
      permisos: {},
      config: {},
      token: {},
    };

    try {
      // 1. Info del dispositivo
      const deviceInfo = getDeviceInfo();
      resultado.dispositivo = {
        esDispositivoFisico: deviceInfo.isDevice,
        plataforma: deviceInfo.platform,
        version: deviceInfo.osVersion,
        fabricante: deviceInfo.manufacturer,
        modelo: deviceInfo.modelName,
      };

      // 2. Verificar config de EAS
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      resultado.config = {
        projectId: projectId || 'NO ENCONTRADO',
        tieneProjectId: !!projectId,
      };

      // 3. Verificar permisos
      try {
        const { status } = await Notifications.getPermissionsAsync();
        resultado.permisos = {
          estado: status,
          otorgado: status === 'granted',
        };
      } catch (error) {
        resultado.permisos = {
          error: error instanceof Error ? error.message : String(error),
        };
      }

      // 4. Intentar obtener token (SIN registrar)
      if (deviceInfo.isDevice && projectId) {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === 'granted') {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            resultado.token = {
              existe: true,
              token: tokenData.data,
              preview: tokenData.data.substring(0, 40) + '...',
            };
          } else {
            resultado.token = {
              existe: false,
              razon: 'Permisos no otorgados',
            };
          }
        } catch (error) {
          resultado.token = {
            existe: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      } else {
        resultado.token = {
          existe: false,
          razon: !deviceInfo.isDevice
            ? 'No es dispositivo físico'
            : 'ProjectId no configurado',
        };
      }

      // 5. Verificar token en Firestore
      if (user?.uid) {
        try {
          const tokenFirestore = await getPushToken(user.uid);
          resultado.firestore = {
            tieneToken: !!tokenFirestore,
            token: tokenFirestore ? tokenFirestore.substring(0, 40) + '...' : null,
          };
        } catch (error) {
          resultado.firestore = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

    } catch (error) {
      resultado.errorGeneral = error instanceof Error ? error.message : String(error);
    }

    setDiagnostico(resultado);
    setLoading(false);
  };

  const forzarRegistro = async () => {
    setRegistrando(true);
    try {
      console.log('[Diagnostico] Forzando registro de push token...');
      const success = await registerPushToken();

      if (success) {
        alert('✅ Token registrado exitosamente');
      } else {
        alert('❌ No se pudo registrar el token. Revisa los logs.');
      }

      // Re-ejecutar diagnóstico
      await ejecutarDiagnostico();
    } catch (error) {
      alert('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    }
    setRegistrando(false);
  };

  const solicitarPermisos = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      alert(status === 'granted' ? '✅ Permisos otorgados' : '❌ Permisos denegados');
      await ejecutarDiagnostico();
    } catch (error) {
      alert('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Ejecutando diagnóstico...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔧 Diagnóstico Push Notifications</Text>

      {diagnostico && (
        <View style={styles.section}>
          {/* Usuario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Usuario</Text>
            <InfoRow label="Autenticado" value={diagnostico.usuario.autenticado ? '✅' : '❌'} />
            <InfoRow label="UID" value={diagnostico.usuario.uid || 'N/A'} />
            <InfoRow label="Email" value={diagnostico.usuario.email || 'N/A'} />
          </View>

          {/* Dispositivo */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Dispositivo</Text>
            <InfoRow
              label="Físico"
              value={diagnostico.dispositivo.esDispositivoFisico ? '✅ Sí' : '❌ No (emulador)'}
              alert={!diagnostico.dispositivo.esDispositivoFisico}
            />
            <InfoRow label="Plataforma" value={diagnostico.dispositivo.plataforma} />
            <InfoRow label="Modelo" value={diagnostico.dispositivo.modelo || 'N/A'} />
          </View>

          {/* Config */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Configuración</Text>
            <InfoRow
              label="EAS Project ID"
              value={diagnostico.config.tieneProjectId ? '✅' : '❌ NO CONFIGURADO'}
              alert={!diagnostico.config.tieneProjectId}
            />
            {diagnostico.config.projectId !== 'NO ENCONTRADO' && (
              <InfoRow label="Project ID" value={diagnostico.config.projectId} small />
            )}
          </View>

          {/* Permisos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔔 Permisos</Text>
            <InfoRow
              label="Estado"
              value={diagnostico.permisos.estado || 'Error'}
              alert={!diagnostico.permisos.otorgado}
            />
            {!diagnostico.permisos.otorgado && (
              <Pressable style={styles.button} onPress={solicitarPermisos}>
                <Text style={styles.buttonText}>Solicitar Permisos</Text>
              </Pressable>
            )}
          </View>

          {/* Token */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎫 Push Token</Text>
            <InfoRow
              label="Token obtenido"
              value={diagnostico.token.existe ? '✅ Sí' : '❌ No'}
              alert={!diagnostico.token.existe}
            />
            {diagnostico.token.preview && (
              <InfoRow label="Preview" value={diagnostico.token.preview} small />
            )}
            {diagnostico.token.razon && (
              <InfoRow label="Razón" value={diagnostico.token.razon} alert />
            )}
            {diagnostico.token.error && (
              <InfoRow label="Error" value={diagnostico.token.error} alert />
            )}
          </View>

          {/* Firestore */}
          {diagnostico.firestore && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>☁️ Firestore</Text>
              <InfoRow
                label="Token guardado"
                value={diagnostico.firestore.tieneToken ? '✅ Sí' : '❌ No'}
              />
              {diagnostico.firestore.token && (
                <InfoRow label="Preview" value={diagnostico.firestore.token} small />
              )}
              {diagnostico.firestore.error && (
                <InfoRow label="Error" value={diagnostico.firestore.error} alert />
              )}
            </View>
          )}
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={forzarRegistro}
          disabled={registrando}
        >
          {registrando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>🚀 Forzar Registro de Token</Text>
          )}
        </Pressable>

        <Pressable style={styles.button} onPress={ejecutarDiagnostico}>
          <Text style={styles.buttonText}>🔄 Actualizar Diagnóstico</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        Ejecutado: {diagnostico?.timestamp ? new Date(diagnostico.timestamp).toLocaleTimeString() : ''}
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, small, alert }: {
  label: string;
  value: string;
  small?: boolean;
  alert?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[
        styles.infoValue,
        small && styles.infoValueSmall,
        alert && styles.infoValueAlert
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  infoValueSmall: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  infoValueAlert: {
    color: '#D32F2F',
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
});
