/**
 * TIMEZONE PICKER
 *
 * Modal para seleccionar una timezone IANA.
 * Muestra una lista de timezones populares con su offset actual.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { getPopularTimeZones, type TimeZoneOption } from '@/services/timezoneService';

interface TimeZonePickerProps {
  /** Timezone IANA seleccionada actualmente */
  value: string | undefined;

  /** Callback cuando se selecciona una timezone */
  onChange: (timeZone: string) => void;

  /** Callback cuando se cierra el modal */
  onClose: () => void;
}

export function TimeZonePicker({ value, onChange, onClose }: TimeZonePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const allTimeZones = useMemo(() => getPopularTimeZones(), []);

  // Filtrar timezones según búsqueda
  const filteredTimeZones = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTimeZones;
    }

    const query = searchQuery.toLowerCase();
    return allTimeZones.filter((tz) =>
      tz.label.toLowerCase().includes(query) || tz.value.toLowerCase().includes(query)
    );
  }, [searchQuery, allTimeZones]);

  // Manejar selección
  const handleSelect = (timeZone: string) => {
    onChange(timeZone);
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar Timezone</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ciudad o timezone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Lista de timezones */}
        <FlatList
          data={filteredTimeZones}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
                item.value === value && styles.itemSelected,
              ]}
              onPress={() => handleSelect(item.value)}
            >
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
              {item.value === value && (
                <Ionicons name="checkmark" size={24} color={theme.colors.primaryLight} />
              )}
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="globe-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No se encontraron timezones</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemPressed: {
    backgroundColor: '#F3F4F6',
  },
  itemSelected: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#DBEAFE',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
