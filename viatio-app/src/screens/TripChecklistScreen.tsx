/**
 * SCREEN: TRIP CHECKLIST
 *
 * Pantalla para gestionar checklist personal y grupal de un viaje.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '@/navigation/types';
import { useChecklistStore } from '@/store/checklistStore';
import { ChecklistItemCard } from '@/components/ChecklistItemCard';
import { ChecklistEmptyState } from '@/components/ChecklistEmptyState';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { theme } from '@/config/theme';
import { auth } from '@/config/firebase';
import { getViajeById } from '@/services/viajesService';
import { subscribeToChecklist } from '@/services/sync/syncRealtimeChecklist';
import type { SeccionChecklist } from '@/types/checklist';
import type { Viaje } from '@/types/viaje';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripChecklist'>;

type TabType = 'personal' | 'grupal';

export function TripChecklistScreen({ route, navigation }: Props) {
  const { viajeId } = route.params;

  const { items, loading, fetchItems, addItem, toggleCompletado, updateItem, removeItem } = useChecklistStore();
  const [selectedTab, setSelectedTab] = useState<TabType>('personal');
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viaje, setViaje] = useState<Viaje | null>(null);

  // Cargar viaje para verificar si es compartido
  useEffect(() => {
    const loadViaje = async () => {
      const v = await getViajeById(viajeId);
      setViaje(v);
    };
    loadViaje();
  }, [viajeId]);

  // Cargar items al montar
  useFocusEffect(
    useCallback(() => {
      fetchItems(viajeId);
    }, [viajeId, fetchItems])
  );

  // Listener en tiempo real para items grupales si el viaje es compartido
  useEffect(() => {
    if (!viaje || viaje.isShared !== 1 || !viaje.firestoreId) {
      return;
    }

    console.log('[TripChecklist] Iniciando listener para items grupales');
    const unsubscribe = subscribeToChecklist(viaje.firestoreId, viajeId, () => {
      fetchItems(viajeId);
    });

    return () => {
      console.log('[TripChecklist] Deteniendo listener');
      unsubscribe();
    };
  }, [viaje, viajeId, fetchItems]);

  // Filtrar items por sección
  const filteredItems = items.filter(item => item.seccion === selectedTab);

  // Añadir nuevo item
  const handleAddItem = async () => {
    if (!nuevoTexto.trim()) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para añadir items');
      return;
    }

    setIsAdding(true);
    try {
      await addItem(
        {
          viajeId,
          texto: nuevoTexto.trim(),
          seccion: selectedTab as SeccionChecklist,
        },
        user.uid
      );
      setNuevoTexto('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir el item');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle completado
  const handleToggle = async (id: string) => {
    await toggleCompletado(id);
  };

  // Editar texto del item
  const handleEdit = async (id: string, newText: string) => {
    await updateItem(id, { texto: newText });
  };

  // Eliminar item con confirmación
  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar item',
      '¿Estás seguro de que quieres eliminar este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Checklist" onBack={() => navigation.goBack()} />

      {/* Tabs Personal / Grupal */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            selectedTab === 'personal' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('personal')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'personal' && styles.tabTextActive,
            ]}
          >
            Personal
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            selectedTab === 'grupal' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('grupal')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'grupal' && styles.tabTextActive,
            ]}
          >
            Grupal
          </Text>
        </Pressable>
      </View>

      {/* Input para añadir nuevo item */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Añadir item ${selectedTab === 'personal' ? 'personal' : 'grupal'}...`}
          value={nuevoTexto}
          onChangeText={setNuevoTexto}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
          editable={!isAdding}
        />
        <Pressable
          onPress={handleAddItem}
          disabled={!nuevoTexto.trim() || isAdding}
          style={({ pressed }) => [
            styles.addButton,
            (!nuevoTexto.trim() || isAdding) && styles.addButtonDisabled,
            pressed && styles.addButtonPressed,
          ]}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="add" size={24} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* Lista de items */}
      {loading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChecklistItemCard
              item={item}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<ChecklistEmptyState seccion={selectedTab} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
