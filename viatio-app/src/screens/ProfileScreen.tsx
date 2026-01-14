/**
 * PROFILE SCREEN
 *
 * Pantalla principal del perfil de usuario.
 * Muestra información del usuario, estadísticas y menú de opciones.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { theme } from '@/config';
import { getEstadisticasUsuario } from '@/services/perfilService';
import type { EstadisticasUsuario } from '@/types/perfil';
import type { ProfileStackParamList } from '@/navigation/types';
import { showToast } from '@/utils/toast';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carga las estadísticas del usuario al montar
   */
  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      if (user?.uid) {
        const stats = await getEstadisticasUsuario(user.uid);
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene las iniciales del nombre para el avatar
   */
  const getInitials = () => {
    if (!user?.displayName) return '?';
    const parts = user.displayName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /**
   * Maneja el cierre de sesión con confirmación
   */
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              showToast.error('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scroll>
      {/* Header con gradiente y avatar */}
      <LinearGradient
        colors={['#0066CC', '#003580']}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>
          )}

          {/* Botón editar */}
          <Pressable
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={theme.colors.primaryLight} />
          </Pressable>
        </View>

        <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Card de Estadísticas */}
        <Card style={styles.statsCard}>
          {loading ? (
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          ) : (
            <View style={styles.statsGrid}>
              {/* Total viajes */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estadisticas?.totalViajes || 0}</Text>
                <Text style={styles.statLabel}>Viajes</Text>
              </View>

              {/* Países visitados */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estadisticas?.paisesVisitados || 0}</Text>
                <Text style={styles.statLabel}>Países</Text>
              </View>

              {/* Viajes completados */}
              <View style={[styles.statItem, styles.statItemLast]}>
                <Text style={styles.statValue}>{estadisticas?.viajesCompletados || 0}</Text>
                <Text style={styles.statLabel}>Completados</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Sección Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <Card style={styles.menuCard}>
            <ProfileMenuItem
              icon="person-outline"
              label="Editar perfil"
              iconColor="#0066CC"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <ProfileMenuItem
              icon="lock-closed-outline"
              label="Cambiar contraseña"
              iconColor="#0066CC"
              onPress={() => {
                // TODO: Implementar cambio de contraseña
                showToast.info('Próximamente', 'Esta función estará disponible pronto.');
              }}
            />
          </Card>
        </View>

        {/* Sección Preferencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <Card style={styles.menuCard}>
            <ProfileMenuItem
              icon="notifications-outline"
              label="Notificaciones"
              iconColor="#EA580C"
              onPress={() => navigation.navigate('NotificationsSettings')}
            />
            <ProfileMenuItem
              icon="settings-outline"
              label="Configuración"
              iconColor="#EA580C"
              onPress={() => navigation.navigate('Settings')}
            />
          </Card>
        </View>

        {/* Sección Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <Card style={styles.menuCard}>
            <ProfileMenuItem
              icon="help-circle-outline"
              label="Centro de ayuda"
              iconColor="#16A34A"
              onPress={() => navigation.navigate('Help')}
            />
            <ProfileMenuItem
              icon="chatbubbles-outline"
              label="Enviar feedback"
              iconColor="#16A34A"
              onPress={() => {
                showToast.info('Feedback', 'Próximamente podrás enviarnos tus comentarios.');
              }}
            />
            <ProfileMenuItem
              icon="shield-checkmark-outline"
              label="Términos y privacidad"
              iconColor="#16A34A"
              onPress={() => {
                showToast.info('Legal', 'Próximamente: Términos y Política de Privacidad.');
              }}
            />
          </Card>
        </View>

        {/* Botón Cerrar sesión */}
        <Card style={styles.logoutCard}>
          <ProfileMenuItem
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={handleLogout}
            showChevron={false}
            isDestructive
          />
        </Card>

        {/* Versión de la app */}
        <Text style={styles.appVersion}>Viatio v1.0.0</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#003580',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRightWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItemLast: {
    borderRightWidth: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primaryLight,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  menuCard: {
    padding: 0,
  },
  logoutCard: {
    padding: 0,
    marginBottom: theme.spacing.lg,
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
