/**
 * THEME - VIATIO DESIGN SYSTEM
 *
 * Sistema de diseño centralizado para la aplicación.
 * Incluye colores, tipografía, espaciado, bordes y sombras.
 *
 * Inspirado en la paleta de Booking.com con adaptaciones para Viatio.
 */

import { TextStyle, ViewStyle } from 'react-native';

// ============================================
// COLORS (del prototipo web)
// ============================================
const colors = {
  // Primary - Azul oscuro (headers, fondos principales)
  primary: '#003580',
  primaryLight: '#0066CC', // Azul medio - botones, enlaces, focus
  primaryDark: '#0052A3', // Hover de botones
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#F5F5F5',
  secondaryForeground: '#1A1A1A',

  // Background
  background: '#F5F5F5', // Gris claro - fondo de páginas
  surface: '#FFFFFF', // Blanco - cards
  card: '#FFFFFF',

  // Border
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(229, 231, 235, 0.5)',

  // Accent - Amarillo (FAB, highlights)
  accent: '#FFC043',
  accentHover: '#FFB400',
  accentForeground: '#1A1A1A',

  // Text
  text: '#1A1A1A',
  textPrimary: '#1A1A1A', // Alias para text
  textSecondary: '#6B6B6B',
  textTertiary: '#9CA3AF', // Gris claro (para texto menos importante)
  textMuted: '#9CA3AF', // Alias para textTertiary

  // Status
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',

  // Categorías de gastos
  categories: {
    transport: '#0066CC',
    accommodation: '#16A34A',
    food: '#EA580C',
    activity: '#9333EA',
    other: '#6B7280',
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================
const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
} as const;

// ============================================
// SPACING
// ============================================
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ============================================
// RADIUS
// ============================================
const radius = {
  sm: 6,
  md: 10,
  lg: 16, // Estándar para cards y botones (del prototipo)
  xl: 24,
  full: 9999, // Para badges y avatares
} as const;

// ============================================
// SHADOWS (del prototipo)
// ============================================
/**
 * Sombras para iOS y Android
 * iOS usa shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android usa elevation
 */
const shadows = {
  // Sombra suave para cards (0 2px 8px rgba(0,0,0,0.08))
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
  // Sombra elevada (0 4px 16px rgba(0,102,204,0.15))
  elevated: {
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  } as ViewStyle,
  // Sombra FAB (0 4px 16px rgba(255,192,67,0.4))
  fab: {
    shadowColor: '#FFC043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
} as const;

// ============================================
// THEME OBJECT
// ============================================
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

// ============================================
// TYPESCRIPT TYPES
// ============================================
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeShadows = typeof shadows;

// Export individual parts for convenience
export { colors, typography, spacing, radius, shadows };
