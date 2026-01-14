/**
 * SEARCH HIGHLIGHT
 *
 * Componente para resaltar términos de búsqueda en texto.
 * Útil para mostrar resultados de búsqueda con coincidencias destacadas.
 */

import { Text, StyleSheet, TextStyle } from 'react-native';
import { theme } from '@/config';

interface SearchHighlightProps {
  /** Texto completo */
  text: string;

  /** Término de búsqueda a resaltar */
  searchTerm: string;

  /** Estilo del texto base */
  textStyle?: TextStyle;

  /** Estilo del texto resaltado */
  highlightStyle?: TextStyle;
}

export function SearchHighlight({
  text,
  searchTerm,
  textStyle,
  highlightStyle,
}: SearchHighlightProps) {
  // Si no hay término de búsqueda, mostrar texto normal
  if (!searchTerm || searchTerm.trim() === '') {
    return <Text style={textStyle}>{text}</Text>;
  }

  // Normalizar término de búsqueda
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  // Encontrar todas las coincidencias (case-insensitive)
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let currentIndex = 0;
  const lowerText = text.toLowerCase();

  while (currentIndex < text.length) {
    const matchIndex = lowerText.indexOf(normalizedSearchTerm, currentIndex);

    if (matchIndex === -1) {
      // No hay más coincidencias, añadir el resto del texto
      parts.push({
        text: text.substring(currentIndex),
        highlight: false,
      });
      break;
    }

    // Añadir texto antes de la coincidencia
    if (matchIndex > currentIndex) {
      parts.push({
        text: text.substring(currentIndex, matchIndex),
        highlight: false,
      });
    }

    // Añadir coincidencia resaltada
    parts.push({
      text: text.substring(matchIndex, matchIndex + normalizedSearchTerm.length),
      highlight: true,
    });

    currentIndex = matchIndex + normalizedSearchTerm.length;
  }

  return (
    <Text style={textStyle}>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.highlight ? [styles.highlight, highlightStyle] : undefined}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
