import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult } from '@/types/googlePlaces';
import { searchPlacesByText } from '@/services/googlePlacesService';
import { theme } from '@/config/theme';
import debounce from 'lodash/debounce';

interface PlaceSearchBarProps {
  onSelectPlace: (place: PlaceResult) => void;
  latitude?: number;
  longitude?: number;
  placeholder?: string;
}

export function PlaceSearchBar({
  onSelectPlace,
  latitude,
  longitude,
  placeholder = 'Buscar lugares...',
}: PlaceSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Búsqueda con debounce (incrementado de 500ms a 800ms para reducir costes)
  const searchPlaces = useCallback(
    debounce(async (text: string) => {
      if (text.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const places = await searchPlacesByText(text, {
          latitude,
          longitude,
          radiusMeters: 50000, // 50km
          maxResults: 5, // Reducido de 8 a 5 para reducir costes
        });
        setResults(places);
      } catch (error) {
        console.error('Error buscando lugares:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 800), // Incrementado de 500ms a 800ms
    [latitude, longitude]
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    setShowResults(true);
    searchPlaces(text);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setQuery(place.name);
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();
    onSelectPlace(place);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setShowResults(true);
    if (query.trim().length >= 2) {
      searchPlaces(query);
    }
  };

  const handleBlur = () => {
    // Pequeño delay para permitir que se registre el tap en resultados
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const renderResultItem = ({ item }: { item: PlaceResult }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => handleSelectPlace(item)}
    >
      <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
      <View style={styles.resultContent}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.resultAddress} numberOfLines={1}>
          {item.shortAddress || item.address}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Input de búsqueda */}
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color={theme.colors.primaryLight} />
        )}
        {query.length > 0 && !loading && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Resultados */}
      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.placeId}
            renderItem={renderResultItem}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
          />
        </View>
      )}

      {/* Sin resultados */}
      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No se encontraron lugares</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  resultAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
