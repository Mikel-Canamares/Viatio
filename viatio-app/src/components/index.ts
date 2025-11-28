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
export { CategoryBadge, CATEGORY_COLORS, getCategoryConfig } from './CategoryBadge';
export type { CategoryType } from './CategoryBadge';
export { SectionHeader } from './SectionHeader';
export { FloatingActionButton } from './FloatingActionButton';

// Los siguientes se crearán en fases posteriores:
// export { LoadingOverlay } from './LoadingOverlay';
// export { ErrorBoundary } from './ErrorBoundary';
// export { EmptyState } from './EmptyState';
