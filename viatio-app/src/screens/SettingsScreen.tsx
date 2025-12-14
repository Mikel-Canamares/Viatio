/**
 * SETTINGS SCREEN
 *
 * Pantalla de configuración de la aplicación.
 * Permite al usuario personalizar preferencias de idioma, tema, moneda, etc.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { SelectItem, SelectOption } from '@/components/SelectItem';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { useConfiguracionStore } from '@/store/useConfiguracionStore';
import { IDIOMAS_DISPONIBLES, MONEDAS_DISPONIBLES } from '@/types/perfil';
import { theme } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { config, isLoading, loadConfig, updateConfig, resetConfig } = useConfiguracionStore();
  const [cacheSize, setCacheSize] = useState<string>('Calculando...');

  // Cargar configuración al montar
  useEffect(() => {
    loadConfig();
    calculateCacheSize();
  }, []);

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

  // Handlers de cambio
  const handleTemaChange = async (tema: string) => {
    try {
      await updateConfig({ tema: tema as 'light' | 'dark' | 'system' });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el tema');
    }
  };

  const handleIdiomaChange = async (idioma: string) => {
    try {
      await updateConfig({ idioma });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el idioma');
    }
  };

  const handleMonedaChange = async (monedaDefault: string) => {
    try {
      await updateConfig({ monedaDefault });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la moneda');
    }
  };

  const handleUnidadDistanciaChange = async (unidad: string) => {
    try {
      await updateConfig({ unidadDistancia: unidad as 'km' | 'mi' });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la unidad de distancia');
    }
  };

  const handleFormatoFechaChange = async (formato: string) => {
    try {
      await updateConfig({ formatoFecha: formato as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el formato de fecha');
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
              Alert.alert('Éxito', 'Caché limpiada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar la caché');
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

  // Convertir opciones de idioma y moneda al formato SelectOption
  const idiomasOptions: SelectOption[] = IDIOMAS_DISPONIBLES.map((idioma) => ({
    value: idioma.code,
    label: idioma.label,
  }));

  const monedasOptions: SelectOption[] = MONEDAS_DISPONIBLES.map((moneda) => ({
    value: moneda.code,
    label: `${moneda.label} (${moneda.symbol})`,
  }));

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

        {/* PREFERENCIAS */}
        <SectionTitle title="Preferencias" />
        <Card padding={0} style={styles.card}>
          <SelectItem
            label="Moneda predeterminada"
            value={config.monedaDefault}
            options={monedasOptions}
            onSelect={handleMonedaChange}
            icon="cash-outline"
          />
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
});
