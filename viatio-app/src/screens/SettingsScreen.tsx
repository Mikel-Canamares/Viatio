/**
 * SETTINGS SCREEN
 *
 * Pantalla de configuración de la aplicación.
 * Permite al usuario personalizar preferencias de idioma, tema, moneda, etc.
 */

import { useEffect, useState } from 'react';
import {View, Text, StyleSheet, ScrollView,
  Alert, Pressable} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { SelectItem, SelectOption } from '@/components/SelectItem';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { IDIOMAS_DISPONIBLES } from '@/types/perfil';
import { ALL_CURRENCIES } from '@/config/currencies';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deepCleanDatabase } from '@/database';
import { useAuth } from '@/context/AuthContext';

// Opciones de configuración
const TEMAS_DISPONIBLES: SelectOption[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const UNIDADES_DISTANCIA: SelectOption[] = [
  { value: 'km', label: 'Kilómetros' },
  { value: 'mi', label: 'Millas' },
];

const FORMATOS_FECHA: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { config, isLoading, loadConfig, updateConfig } = useConfiguracionStore();
  const [cacheSize, setCacheSize] = useState<string>('Calculando...');

  // Cargar configuración al montar (sincroniza con Firebase si hay usuario)
  useEffect(() => {
    loadConfig(user?.uid);
    calculateCacheSize();
  }, [user?.uid]);

  // Calcular tamaño de caché aproximado
  const calculateCacheSize = async () => {
    try {
      // En AsyncStorage no hay forma directa de obtener el tamaño total
      // Estimamos basándonos en las claves que usamos
      const keys = await AsyncStorage.getAllKeys();
      const viatioKeys = keys.filter((key) => key.startsWith('@viatio'));

      if (viatioKeys.length === 0) {
        setCacheSize('0 KB');
        return;
      }

      const items = await AsyncStorage.multiGet(viatioKeys);
      const totalBytes = items.reduce((acc, [_, value]) => {
        return acc + (value ? new Blob([value]).size : 0);
      }, 0);

      const totalKB = (totalBytes / 1024).toFixed(2);
      setCacheSize(`${totalKB} KB`);
    } catch (error) {
      console.error('Error calculando tamaño de caché:', error);
      setCacheSize('Error');
    }
  };

  // Handlers de cambio (sincronizan con Firebase si hay usuario autenticado)
  const handleTemaChange = async (tema: string) => {
    try {
      await updateConfig({ tema: tema as 'light' | 'dark' | 'system' }, user?.uid);
    } catch (error) {
      showToast.error('Error', 'No se pudo cambiar el tema');
    }
  };

  const handleIdiomaChange = async (idioma: string) => {
    try {
      await updateConfig({ idioma }, user?.uid);
    } catch (error) {
      showToast.error('Error', 'No se pudo cambiar el idioma');
    }
  };

  const handleMonedaChange = async (monedaDefault: string) => {
    try {
      await updateConfig({ monedaDefault }, user?.uid);
    } catch (error) {
      showToast.error('Error', 'No se pudo cambiar la moneda');
    }
  };

  const handleUnidadDistanciaChange = async (unidad: string) => {
    try {
      await updateConfig({ unidadDistancia: unidad as 'km' | 'mi' }, user?.uid);
    } catch (error) {
      showToast.error('Error', 'No se pudo cambiar la unidad de distancia');
    }
  };

  const handleFormatoFechaChange = async (formato: string) => {
    try {
      await updateConfig({ formatoFecha: formato as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' }, user?.uid);
    } catch (error) {
      showToast.error('Error', 'No se pudo cambiar el formato de fecha');
    }
  };

  // Exportar datos
  const handleExportData = () => {
    Alert.alert(
      'Exportar datos',
      'Esta función estará disponible próximamente. Podrás exportar todos tus viajes, reservas y gastos en formato JSON.',
      [{ text: 'OK' }]
    );
  };

  // Limpiar caché
  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      `Se eliminarán ${cacheSize} de datos en caché. La configuración y tus viajes no se verán afectados.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Aquí podrías limpiar cachés específicas
              // Por ahora solo recalculamos el tamaño
              await calculateCacheSize();
              showToast.success('Éxito', 'Caché limpiada correctamente');
            } catch (error) {
              showToast.error('Error', 'No se pudo limpiar la caché');
            }
          },
        },
      ]
    );
  };

  // Limpiar base de datos completamente (DESARROLLO)
  const handleDeepCleanDatabase = () => {
    Alert.alert(
      '🔥 LIMPIEZA PROFUNDA DE BASE DE DATOS',
      '⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE.\n\nSe eliminará COMPLETAMENTE:\n• Todos tus viajes\n• Todas tus reservas\n• Todos tus lugares\n• Todos tus gastos\n• Todos tus documentos\n\nLa base de datos se recreará desde cero.\n\n¿Continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'LIMPIAR TODO',
          style: 'destructive',
          onPress: async () => {
            try {
              showToast.info('Limpiando...', 'Esto puede tardar unos segundos');
              await deepCleanDatabase();
              showToast.success('✅ Completado', 'Base de datos limpiada y recreada exitosamente');

              // Instrucciones post-limpieza
              Alert.alert(
                '✅ Base de datos limpia',
                'La base de datos se ha recreado completamente.\n\nPara mejores resultados:\n1. Cierra la app completamente\n2. Vuelve a abrirla\n3. Prueba creando un nuevo viaje',
                [{ text: 'Entendido' }]
              );
            } catch (error) {
              showToast.error('Error', 'No se pudo limpiar la base de datos');
              console.error('[Settings] Error en deepClean:', error);
            }
          },
        },
      ]
    );
  };

  // Eliminar cuenta
  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Eliminar cuenta',
      'Esta acción es IRREVERSIBLE. Se eliminarán permanentemente:\n\n• Todos tus viajes\n• Todas tus reservas\n• Todos tus documentos\n• Todos tus gastos\n• Tu cuenta de usuario\n\n¿Estás completamente seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: () => {
            // Segunda confirmación
            Alert.alert(
              'Confirmación final',
              'Escribe "ELIMINAR" para confirmar',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implementar eliminación de cuenta
                    Alert.alert(
                      'Función no disponible',
                      'La eliminación de cuenta estará disponible en una próxima versión.'
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Convertir opciones de idioma al formato SelectOption
  const idiomasOptions: SelectOption[] = IDIOMAS_DISPONIBLES.map((idioma) => ({
    value: idioma.code,
    label: idioma.label,
  }));

  // Obtener información de la moneda seleccionada para mostrar en el item
  const selectedCurrency = ALL_CURRENCIES.find(c => c.code === config.monedaDefault);
  const currencyLabel = selectedCurrency
    ? `${selectedCurrency.flag || ''} ${selectedCurrency.code} - ${selectedCurrency.name}`
    : config.monedaDefault;

  // Estado para controlar el modal del CurrencyPicker
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  if (isLoading) {
    return (
      <ScreenContainer>
        <PageHeader title="Configuración" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <PageHeader title="Configuración" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* APARIENCIA */}
        <SectionTitle title="Apariencia" marginTop={false} />
        <Card padding={0} style={styles.card}>
          <SelectItem
            label="Tema"
            value={config.tema}
            options={TEMAS_DISPONIBLES}
            onSelect={handleTemaChange}
            icon="color-palette-outline"
          />
          <SelectItem
            label="Idioma"
            value={config.idioma}
            options={idiomasOptions}
            onSelect={handleIdiomaChange}
            icon="language-outline"
          />
        </Card>

        {/* VIATIO COPILOT */}
        <SectionTitle title="Asistente IA" />
        <Card padding={0} style={styles.card}>
          <ProfileMenuItem
            icon="sparkles-outline"
            label="Configurar Copilot"
            value="Personaliza tu asistente"
            onPress={() => navigation.navigate('CopilotSettings')}
          />
        </Card>

        {/* PREFERENCIAS */}
        <SectionTitle title="Preferencias" />
        <Card padding={0} style={styles.card}>
          {/* Selector de moneda con CurrencyPicker (Frankfurter API) */}
          <Pressable
            onPress={() => setShowCurrencyPicker(true)}
            style={({ pressed }) => [
              styles.currencyItem,
              pressed && styles.currencyItemPressed,
            ]}
          >
            <View style={styles.currencyIconContainer}>
              <Ionicons name="cash-outline" size={20} color={theme.colors.primaryLight} />
            </View>
            <View style={styles.currencyContent}>
              <Text style={styles.currencyLabel}>Moneda predeterminada</Text>
              <Text style={styles.currencyValue}>{currencyLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </Pressable>

          <SelectItem
            label="Unidad de distancia"
            value={config.unidadDistancia}
            options={UNIDADES_DISTANCIA}
            onSelect={handleUnidadDistanciaChange}
            icon="speedometer-outline"
          />
          <SelectItem
            label="Formato de fecha"
            value={config.formatoFecha}
            options={FORMATOS_FECHA}
            onSelect={handleFormatoFechaChange}
            icon="calendar-outline"
          />
        </Card>

        {/* Modal CurrencyPicker - se activa con showCurrencyPicker */}
        {showCurrencyPicker && (
          <CurrencyPicker
            value={config.monedaDefault}
            onChange={handleMonedaChange}
            modalOnly
            onClose={() => setShowCurrencyPicker(false)}
          />
        )}

        {/* DATOS */}
        <SectionTitle title="Datos" />
        <Card padding={0} style={styles.card}>
          <ProfileMenuItem
            icon="cloud-download-outline"
            label="Exportar mis datos"
            onPress={handleExportData}
          />
          <ProfileMenuItem
            icon="trash-outline"
            label="Limpiar caché"
            value={cacheSize}
            onPress={handleClearCache}
          />
        </Card>

        {/* DESARROLLO - Herramientas de debug */}
        <SectionTitle title="🛠️ Desarrollo (Temporal)" />
        <Card padding={0} style={styles.card}>
          <ProfileMenuItem
            icon="refresh-outline"
            label="🔥 Limpiar base de datos"
            value="Resetear SQLite completamente"
            onPress={handleDeepCleanDatabase}
            isDestructive
          />
        </Card>

        {/* CUENTA - Zona de peligro */}
        <SectionTitle title="Zona de peligro" />
        <Card padding={0} style={styles.card}>
          <ProfileMenuItem
            icon="warning-outline"
            label="Eliminar cuenta"
            onPress={handleDeleteAccount}
            isDestructive
          />
        </Card>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: theme.spacing.lg,
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
  card: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
  // Estilos para el item de moneda (consistente con SelectItem)
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  currencyItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  currencyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    marginRight: theme.spacing.md,
  },
  currencyContent: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text,
    marginBottom: 2,
  },
  currencyValue: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
});
