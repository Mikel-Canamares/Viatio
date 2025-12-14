/**
 * EDIT PROFILE SCREEN
 *
 * Pantalla para editar el perfil del usuario.
 * Permite cambiar foto, nombre, teléfono.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/config';

type RootStackParamList = {
  EditProfile: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [telefono, setTelefono] = useState(''); // TODO: Cargar desde perfil extendido
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar cambios
  useEffect(() => {
    const nameChanged = displayName !== (user?.displayName || '');
    const photoChanged = photoURL !== (user?.photoURL || null);
    // TODO: agregar telefono cuando tengamos persistencia

    setHasChanges(nameChanged || photoChanged);
  }, [displayName, photoURL, user]);

  /**
   * Maneja el cambio de foto de perfil
   */
  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      // ActionSheet nativo en iOS
      const options = photoURL
        ? ['Tomar foto', 'Elegir de galería', 'Eliminar foto', 'Cancelar']
        : ['Tomar foto', 'Elegir de galería', 'Cancelar'];

      const destructiveButtonIndex = photoURL ? 2 : undefined;
      const cancelButtonIndex = photoURL ? 3 : 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await pickImageFromCamera();
          } else if (buttonIndex === 1) {
            await pickImageFromLibrary();
          } else if (buttonIndex === 2 && photoURL) {
            setPhotoURL(null);
          }
        }
      );
    } else {
      // Alert simple en Android
      Alert.alert(
        'Cambiar foto',
        'Elige una opción',
        [
          { text: 'Tomar foto', onPress: pickImageFromCamera },
          { text: 'Elegir de galería', onPress: pickImageFromLibrary },
          ...(photoURL
            ? [
                {
                  text: 'Eliminar foto',
                  onPress: () => setPhotoURL(null),
                  style: 'destructive' as const,
                },
              ]
            : []),
          { text: 'Cancelar', style: 'cancel' as const },
        ],
        { cancelable: true }
      );
    }
  };

  /**
   * Abre la cámara para tomar una foto
   */
  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a la cámara para tomar fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  /**
   * Abre la galería para elegir una foto
   */
  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a la galería para elegir fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al elegir foto:', error);
      Alert.alert('Error', 'No se pudo elegir la foto.');
    }
  };

  /**
   * Guarda los cambios del perfil
   */
  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

      // TODO: Subir foto a Firebase Storage si cambió y es una URI local
      // Por ahora solo actualizamos displayName

      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL || undefined,
      });

      // Refrescar el usuario en el contexto
      await refreshUser();

      Alert.alert('Éxito', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el botón de retroceso con confirmación si hay cambios
   */
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres salir sin guardar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  /**
   * Obtiene las iniciales del nombre para el avatar
   */
  const getInitials = () => {
    if (!displayName) return '?';
    const parts = displayName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <ScreenContainer scroll>
      <PageHeader title="Editar perfil" onBack={handleBack} />

      <View style={styles.content}>
        {/* Card de Avatar */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}

            {/* Botón de cámara superpuesto */}
            <Pressable style={styles.cameraButton} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>

          <Pressable onPress={handleChangePhoto} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </Pressable>
        </Card>

        {/* Card de Información */}
        <Card style={styles.infoCard}>
          <Input
            label="Nombre completo"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ingresa tu nombre"
            leftIcon="person-outline"
            autoCapitalize="words"
          />

          <Input
            label="Email"
            value={user?.email || ''}
            onChangeText={() => {}}
            placeholder="email@ejemplo.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            // TODO: Añadir prop editable={false} al componente Input
          />

          <Input
            label="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+34 600 123 456"
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Botón Guardar */}
        <PrimaryButton
          onPress={handleSaveChanges}
          disabled={!hasChanges || loading}
          loading={loading}
        >
          Guardar cambios
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.border,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: '600',
    color: theme.colors.primaryForeground,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
});
