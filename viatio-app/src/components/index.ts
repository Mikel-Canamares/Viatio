/**
 * COMPONENTS
 *
 * Componentes reutilizables de UI.
 * Componentes sin estado o con lógica mínima que se usan en múltiples pantallas.
 *
 * Ejemplos: Button, Card, Input, LoadingSpinner, etc.
 */

export { ScreenContainer } from './ScreenContainer';
export { PageHeader } from './PageHeader';
export { PrimaryButton } from './PrimaryButton';
export { SecondaryButton } from './SecondaryButton';
export { Card } from './Card';
export { Input } from './Input';
export { DateInput } from './DateInput';
export { DatePickerInput } from './DatePickerInput';
export { TimeInput } from './TimeInput';
export { DateRangePicker } from './DateRangePicker';
export { CategoryBadge, CATEGORY_COLORS, getCategoryConfig } from './CategoryBadge';
export type { CategoryType } from './CategoryBadge';
export { SectionHeader } from './SectionHeader';
export { FloatingActionButton } from './FloatingActionButton';
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingOverlay } from './LoadingOverlay';
export { TripCard } from './TripCard';
export { default as ReservationCard } from './ReservationCard';
export { default as DocumentCard } from './DocumentCard';
export { default as AgendaCard } from './AgendaCard';
export { default as NavigationChoiceModal } from './NavigationChoiceModal';
export { SubtypeSelector } from './SubtypeSelector';
export { EventoCategoriaSelector } from './EventoCategoriaSelector';
export { TimePickerInput } from './TimePickerInput';
export { DayPicker, useDiasViaje } from './DayPicker';
export type { DiaViaje } from './DayPicker';
export { SwipeableCard } from './SwipeableCard';
export { SwipeActions } from './SwipeActions';
export { SwipeActionsDocument } from './SwipeActionsDocument';
export { SwipeActionsReservation } from './SwipeActionsReservation';

// Componentes de Google Places (Fase 11)
export { PlaceSearchBar } from './PlaceSearchBar';
export { PlaceDetailCard } from './PlaceDetailCard';
export { AddToTripModal } from './AddToTripModal';
export { SavedPlacesAccordion } from './SavedPlacesAccordion';
export { PlaceMatchNotification, useHandlePlaceMatch } from './PlaceMatchNotification';
export { PlaceAutocompleteInput } from './PlaceAutocompleteInput';

// Componentes de Calendario
export { CalendarDay } from './CalendarDay';
export { DayEventsModal } from './DayEventsModal';
export type { EventoAgendaCalendario } from './DayEventsModal';

// Componentes de Gastos
export { ExpensesSummary } from './ExpensesSummary';
export { ExpenseCategoryGroup } from './ExpenseCategoryGroup';

// Componentes de Documentos
export { DocumentCategoryGroup } from './DocumentCategoryGroup';

// Componentes de Perfil/Configuración
export { ProfileMenuItem } from './ProfileMenuItem';
export { SectionTitle } from './SectionTitle';
export { SelectItem } from './SelectItem';
export type { SelectOption } from './SelectItem';
export { Accordion } from './Accordion';

// Componentes de Asistente IA (Copilot)
export { ChatBubble } from './ChatBubble';
export { SuggestionChips } from './SuggestionChips';
export { TypingIndicator } from './TypingIndicator';
export { SmartFAB } from './SmartFAB';
export { AssistantBottomSheet } from './AssistantBottomSheet';
export { ConversationHistoryList } from './ConversationHistoryList';
export { ActionButton, ActionButtonsContainer } from './ActionButton';
export { SwitchItem } from './SwitchItem';
export { CopilotFAB } from './CopilotFAB';

// Componentes de Viajes Compartidos
export { MembersSection } from './MembersSection';
export { ShareTripModal } from './ShareTripModal';

// Componentes de Autenticación
export { GoogleSignInButton } from './GoogleSignInButton';
export { LinkAccountModal } from './LinkAccountModal';

// Los siguientes se crearán en fases posteriores:
// export { EmptyState } from './EmptyState';
