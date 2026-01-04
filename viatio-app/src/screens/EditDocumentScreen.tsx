/**
 * EDIT DOCUMENT SCREEN
 *
 * Pantalla para editar el nombre de un documento.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  PageHeader,
  Input,
  PrimaryButton,
} from '@/components';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import { useDocumentosStore } from '@/store/documentosStore';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditDocument'>;

export default function EditDocumentScreen({ route, navigation }: Props) {
  const { documentoId, nombreActual } = route.params;
  const { updateDocumento } = useDocumentosStore();

  const [nombre, setNombre] = useState(nombreActual);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validar que el nombre no esté vacío
    if (!nombre.trim()) {
      showToast.error('Error', 'El nombre del documento no puede estar vacío');
      return;
    }

    // Si no cambió el nombre, solo volver
    if (nombre.trim() === nombreActual) {
      navigation.goBack();
      return;
    }

    setSaving(true);

    try {
      const success = await updateDocumento(documentoId, nombre.trim());

      if (success) {
        showToast.success('Éxito', 'Documento actualizado correctamente');
        navigation.goBack();
      } else {
        showToast.error('Error', 'No se pudo actualizar el documento');
      }
    } catch (error) {
      showToast.error('Error', 'Ocurrió un error al actualizar el documento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Editar documento" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <View style={styles.content}>
          <Input
            label="Nombre del documento"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Pasaporte, Boleto de avión..."
          />

          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </PrimaryButton>
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
  },
});
