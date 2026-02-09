/**
 * COMPONENT: PLACE MATCH NOTIFICATION
 *
 * Componente para mostrar notificaciones y confirmaciones de matching de lugares.
 * Maneja diferentes tipos de resultados: exact, suggested, multiple, none.
 */

import { useEffect, useState } from 'react';
import type { PlaceMatchResult } from '@/types/placeMatching';
import type { PlaceResult } from '@/types/googlePlaces';
import type { CategoriaLugar } from '@/types/lugar';
import { CustomModal } from './CustomModal';

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

type ModalState = {
  visible: boolean;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
};

/**
 * Componente para manejar notificaciones de place matching
 * Usa CustomModal en lugar de Alert nativo
 */
export function PlaceMatchNotification({
  placeMatch,
  onConfirmSuggestion,
  onReject,
  onNavigateToMap,
  autoShow = true,
}: PlaceMatchNotificationProps) {
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!placeMatch || !autoShow) return;

    switch (placeMatch.type) {
      case 'exact':
        showExactMatchModal(placeMatch, onNavigateToMap, setModalState);
        break;

      case 'suggested':
        showSuggestedMatchModal(placeMatch, onConfirmSuggestion, onReject, setModalState);
        break;

      case 'multiple':
        showMultipleMatchesModal(placeMatch, onConfirmSuggestion, onReject, setModalState);
        break;

      case 'none':
        // No mostrar nada para 'none'
        console.log('[PlaceMatchNotification] No match found, no notification shown');
        break;
    }
  }, [placeMatch, autoShow, onConfirmSuggestion, onReject, onNavigateToMap]);

  return (
    <CustomModal
      visible={modalState.visible}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      onClose={() => setModalState(prev => ({ ...prev, visible: false }))}
      primaryButton={modalState.primaryButton}
      secondaryButton={modalState.secondaryButton}
    />
  );
}

/**
 * Muestra modal de match exacto (lugar creado/encontrado automáticamente)
 */
function showExactMatchModal(
  placeMatch: PlaceMatchResult,
  onNavigateToMap: (() => void) | undefined,
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>
) {
  if (!placeMatch.lugar) return;

  const message = placeMatch.message || `"${placeMatch.lugar.nombre}" se ha añadido al mapa automáticamente`;

  setModalState({
    visible: true,
    type: 'success',
    title: 'Lugar añadido al mapa',
    message,
    primaryButton: {
      text: 'OK',
      onPress: () => {},
    },
    secondaryButton: onNavigateToMap ? {
      text: 'Ver en mapa',
      onPress: onNavigateToMap,
    } : undefined,
  });
}

/**
 * Muestra modal de sugerencia única (requiere confirmación)
 */
function showSuggestedMatchModal(
  placeMatch: PlaceMatchResult,
  onConfirmSuggestion: ((place: PlaceResult) => void) | undefined,
  onReject: (() => void) | undefined,
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>
) {
  if (!placeMatch.suggestions || placeMatch.suggestions.length === 0) return;

  const suggestion = placeMatch.suggestions[0];
  const message = `Encontramos "${suggestion.name}"\n${suggestion.shortAddress || suggestion.address}\n\n¿Quieres añadirlo al mapa del viaje?`;

  setModalState({
    visible: true,
    type: 'info',
    title: '¿Añadir lugar al mapa?',
    message,
    primaryButton: {
      text: 'Sí, añadir',
      onPress: () => onConfirmSuggestion?.(suggestion),
    },
    secondaryButton: {
      text: 'No',
      onPress: () => onReject?.(),
    },
  });
}

/**
 * Muestra modal con múltiples opciones (requiere selección)
 * NOTA: CustomModal solo soporta 2 botones, por lo que mostramos el primer resultado
 * y damos opción de rechazar. Para casos de múltiples opciones, se recomienda
 * crear una pantalla de selección dedicada.
 */
function showMultipleMatchesModal(
  placeMatch: PlaceMatchResult,
  onConfirmSuggestion: ((place: PlaceResult) => void) | undefined,
  onReject: (() => void) | undefined,
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>
) {
  if (!placeMatch.suggestions || placeMatch.suggestions.length === 0) return;

  // Mostrar el primer resultado con opción de confirmar o rechazar
  const suggestion = placeMatch.suggestions[0];
  const message = `Encontramos ${placeMatch.suggestions.length} lugares.\n\nMostrando el primero:\n"${suggestion.name}"\n${suggestion.shortAddress || suggestion.address}\n\n¿Añadir este lugar al mapa?`;

  setModalState({
    visible: true,
    type: 'info',
    title: 'Varios lugares encontrados',
    message,
    primaryButton: {
      text: 'Añadir',
      onPress: () => onConfirmSuggestion?.(suggestion),
    },
    secondaryButton: {
      text: 'Ninguno',
      onPress: () => onReject?.(),
    },
  });
}

/**
 * Hook para manejar place matching de forma imperativa
 */
export function useHandlePlaceMatch() {
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handlePlaceMatch = (
    placeMatch: PlaceMatchResult | undefined,
    onConfirmSuggestion?: (place: PlaceResult) => void,
    onReject?: () => void,
    onNavigateToMap?: () => void
  ) => {
    if (!placeMatch) return;

    switch (placeMatch.type) {
      case 'exact':
        showExactMatchModal(placeMatch, onNavigateToMap, setModalState);
        break;

      case 'suggested':
        showSuggestedMatchModal(placeMatch, onConfirmSuggestion, onReject, setModalState);
        break;

      case 'multiple':
        showMultipleMatchesModal(placeMatch, onConfirmSuggestion, onReject, setModalState);
        break;

      case 'none':
        // Opcionalmente mostrar un toast informativo
        console.log('[PlaceMatch] No se encontró lugar para matching');
        break;
    }
  };

  const ModalComponent = () => (
    <CustomModal
      visible={modalState.visible}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      onClose={() => setModalState(prev => ({ ...prev, visible: false }))}
      primaryButton={modalState.primaryButton}
      secondaryButton={modalState.secondaryButton}
    />
  );

  return { handlePlaceMatch, PlaceMatchModal: ModalComponent };
}

export default PlaceMatchNotification;
