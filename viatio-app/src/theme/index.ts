/**
 * THEME MODULE
 *
 * Re-exporta el tema desde config para permitir imports desde @/theme
 */

export { theme, colors, typography, spacing, radius, shadows } from '@/config/theme';
export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadows,
} from '@/config/theme';
