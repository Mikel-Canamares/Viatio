/**
 * PLACE AUTOCOMPLETE INPUT
 *
 * Input con autocompletado de destinos usando Google Places API.
 * Filtra solo ciudades y países.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { autocompleteDestinations, AutocompleteSuggestion } from '@/services/googlePlacesService';

interface PlaceAutocompleteInputProps {
  /** Label que se muestra arriba del input */
  label: string;

  /** Valor actual del input */
  value: string;

  /** Función que se ejecuta cuando cambia el texto */
  onChangeText: (text: string) => void;

  /** Placeholder del input */
  placeholder?: string;

  /** Mensaje de error a mostrar debajo del input */
  error?: string;
}

export function PlaceAutocompleteInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
}: PlaceAutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Función para buscar sugerencias con debouncing
  const searchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    const results = await autocompleteDestinations(query);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setIsLoading(false);
  }, []);

  // Efecto para debouncing de búsqueda
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchSuggestions(value);
    }, 300); // 300ms de debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, searchSuggestions]);

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    onChangeText(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Determinar estilo del borde según estado
  const getBorderStyle = () => {
    if (error) {
      return { borderColor: '#DC2626', borderWidth: 1 };
    }
    if (isFocused) {
      return { borderColor: theme.colors.primaryLight, borderWidth: 2 };
    }
    return { borderColor: '#D1D5DB', borderWidth: 1 };
  };

  // Determinar icono según tipo de lugar
  const getPlaceIcon = (types: string[]): keyof typeof Ionicons.glyphMap => {
    if (types.includes('country')) {
      return 'globe-outline';
    }
    if (types.includes('locality')) {
      return 'business-outline';
    }
    return 'location-outline';
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input container */}
      <View style={[styles.inputContainer, getBorderStyle()]}>
        {/* Icono de ubicación */}
        <Ionicons
          name="location-outline"
          size={20}
          color="#6B7280"
          style={styles.leftIcon}
        />

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay mayor para permitir clic en sugerencia
            setTimeout(() => setShowSuggestions(false), 300);
          }}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primaryLight}
            style={styles.loader}
          />
        )}

        {/* Clear button */}
        {value.length > 0 && !isLoading && (
          <Pressable
            onPress={() => {
              onChangeText('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.placeId}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                activeOpacity={0.7}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons
                  name={getPlaceIcon(item.types)}
                  size={18}
                  color={theme.colors.primaryLight}
                  style={styles.suggestionIcon}
                />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText}>{item.mainText}</Text>
                  {item.secondaryText && (
                    <Text style={styles.suggestionSecondaryText}>
                      {item.secondaryText}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 250,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },
});
