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
// COLORS
// ============================================
const colors = {
  // Primary - Azul Booking
  primary: '#003580',
  primaryLight: '#0057B8',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#F5F5F5',
  secondaryForeground: '#1A1A1A',

  // Background
  background: '#FFFFFF',
  surface: '#FAFAFA',
  card: '#FFFFFF',

  // Border
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Accent - Amarillo
  accent: '#FFC043',
  accentForeground: '#1A1A1A',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9E9E9E',

  // Status
  success: '#1F8A70',
  error: '#D32F2F',
  warning: '#F59E0B',
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
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ============================================
// SHADOWS
// ============================================
/**
 * Sombras para iOS y Android
 * iOS usa shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android usa elevation
 */
const shadows = {
  card: {
    // Sombra suave para cards
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  elevated: {
    // Sombra más pronunciada para elementos elevados
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
