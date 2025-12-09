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
export { CategoryBadge, CATEGORY_COLORS, getCategoryConfig } from './CategoryBadge';
export type { CategoryType } from './CategoryBadge';
export { SectionHeader } from './SectionHeader';
export { FloatingActionButton } from './FloatingActionButton';
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingOverlay } from './LoadingOverlay';
export { TripCard } from './TripCard';
export { default as ReservationCard } from './ReservationCard';
export { default as DocumentCard } from './DocumentCard';

// Componentes de Google Places (Fase 11)
export { PlaceSearchBar } from './PlaceSearchBar';
export { PlaceDetailCard } from './PlaceDetailCard';
export { AddToTripModal } from './AddToTripModal';
export { SavedPlacesAccordion } from './SavedPlacesAccordion';

// Componentes de Calendario
export { CalendarDay } from './CalendarDay';
export { DayEventsModal } from './DayEventsModal';
export type { EventoAgendaCalendario } from './DayEventsModal';

// Los siguientes se crearán en fases posteriores:
// export { EmptyState } from './EmptyState';
