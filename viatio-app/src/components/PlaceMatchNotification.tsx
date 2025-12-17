/**
 * COMPONENT: PLACE MATCH NOTIFICATION
 *
 * Componente para mostrar notificaciones y confirmaciones de matching de lugares.
 * Maneja diferentes tipos de resultados: exact, suggested, multiple, none.
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import type { PlaceMatchResult } from '@/types/placeMatching';
import type { PlaceResult } from '@/types/googlePlaces';
import type { CategoriaLugar } from '@/types/lugar';

interface PlaceMatchNotificationProps {
  /** Resultado del matching */
  placeMatch?: PlaceMatchResult;

  /** Callback cuando el usuario confirma una sugerencia */
  onConfirmSuggestion?: (placeResult: PlaceResult) => void;

  /** Callback cuando el usuario rechaza */
  onReject?: () => void;

  /** Callback para navegar al mapa */
  onNavigateToMap?: () => void;

  /** Si se debe mostrar automáticamente */
  autoShow?: boolean;
}

/**
 * Componente para manejar notificaciones de place matching
 * Usa Alerts nativos de React Native
 */
export function PlaceMatchNotification({
  placeMatch,
  onConfirmSuggestion,
  onReject,
  onNavigateToMap,
  autoShow = true,
}: PlaceMatchNotificationProps) {
  useEffect(() => {
    if (!placeMatch || !autoShow) return;

    switch (placeMatch.type) {
      case 'exact':
        showExactMatchAlert(placeMatch, onNavigateToMap);
        break;

      case 'suggested':
        showSuggestedMatchAlert(placeMatch, onConfirmSuggestion, onReject);
        break;

      case 'multiple':
        showMultipleMatchesAlert(placeMatch, onConfirmSuggestion, onReject);
        break;

      case 'none':
        // No mostrar nada para 'none'
        console.log('[PlaceMatchNotification] No match found, no notification shown');
        break;
    }
  }, [placeMatch, autoShow, onConfirmSuggestion, onReject, onNavigateToMap]);

  // Este componente no renderiza nada visible
  return null;
}

/**
 * Muestra alerta de match exacto (lugar creado/encontrado automáticamente)
 */
function showExactMatchAlert(
  placeMatch: PlaceMatchResult,
  onNavigateToMap?: () => void
) {
  if (!placeMatch.lugar) return;

  const message = placeMatch.message || `"${placeMatch.lugar.nombre}" se ha añadido al mapa automáticamente`;

  Alert.alert(
    '✓ Lugar añadido al mapa',
    message,
    [
      {
        text: 'OK',
        style: 'default',
      },
      ...(onNavigateToMap
        ? [
            {
              text: 'Ver en mapa',
              onPress: onNavigateToMap,
            },
          ]
        : []),
    ],
    { cancelable: true }
  );
}

/**
 * Muestra alerta de sugerencia única (requiere confirmación)
 */
function showSuggestedMatchAlert(
  placeMatch: PlaceMatchResult,
  onConfirmSuggestion?: (place: PlaceResult) => void,
  onReject?: () => void
) {
  if (!placeMatch.suggestions || placeMatch.suggestions.length === 0) return;

  const suggestion = placeMatch.suggestions[0];
  const message = `Encontramos "${suggestion.name}"\n${suggestion.shortAddress || suggestion.address}\n\n¿Quieres añadirlo al mapa del viaje?`;

  Alert.alert(
    '¿Añadir lugar al mapa?',
    message,
    [
      {
        text: 'No',
        style: 'cancel',
        onPress: onReject,
      },
      {
        text: 'Sí, añadir',
        style: 'default',
        onPress: () => onConfirmSuggestion?.(suggestion),
      },
    ],
    { cancelable: true }
  );
}

/**
 * Muestra alerta con múltiples opciones (requiere selección)
 */
function showMultipleMatchesAlert(
  placeMatch: PlaceMatchResult,
  onConfirmSuggestion?: (place: PlaceResult) => void,
  onReject?: () => void
) {
  if (!placeMatch.suggestions || placeMatch.suggestions.length === 0) return;

  // Crear botones para cada sugerencia
  const buttons = [
    ...placeMatch.suggestions.map((suggestion, index) => ({
      text: `${index + 1}. ${suggestion.name}`,
      onPress: () => {
        // Mostrar confirmación con más detalles
        Alert.alert(
          'Confirmar lugar',
          `${suggestion.name}\n${suggestion.shortAddress || suggestion.address}\n\n¿Añadir este lugar al mapa?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Añadir',
              onPress: () => onConfirmSuggestion?.(suggestion),
            },
          ]
        );
      },
    })),
    {
      text: 'Ninguno',
      style: 'cancel' as const,
      onPress: onReject,
    },
  ];

  Alert.alert(
    'Selecciona el lugar correcto',
    'Encontramos varios lugares. ¿Cuál es el correcto?',
    buttons,
    { cancelable: true }
  );
}

/**
 * Hook para manejar place matching de forma imperativa
 */
export function useHandlePlaceMatch() {
  const handlePlaceMatch = (
    placeMatch: PlaceMatchResult | undefined,
    onConfirmSuggestion?: (place: PlaceResult) => void,
    onReject?: () => void,
    onNavigateToMap?: () => void
  ) => {
    if (!placeMatch) return;

    switch (placeMatch.type) {
      case 'exact':
        showExactMatchAlert(placeMatch, onNavigateToMap);
        break;

      case 'suggested':
        showSuggestedMatchAlert(placeMatch, onConfirmSuggestion, onReject);
        break;

      case 'multiple':
        showMultipleMatchesAlert(placeMatch, onConfirmSuggestion, onReject);
        break;

      case 'none':
        // Opcionalmente mostrar un toast informativo
        console.log('[PlaceMatch] No se encontró lugar para matching');
        break;
    }
  };

  return { handlePlaceMatch };
}

export default PlaceMatchNotification;
