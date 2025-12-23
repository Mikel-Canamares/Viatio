/**
 * MapMarker - Marcador SVG para react-native-maps
 *
 * Usa SVG nativo que se renderiza correctamente sin clipping.
 * Estilo inspirado en Google Maps (pin con icono).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CategoriaLugar, LUGAR_MARKER_COLORS } from '@/types/lugar';

/**
 * Configuración de colores por categoría
 * Usa el sistema centralizado para mantener consistencia
 */
const CATEGORIA_CONFIG: Record<CategoriaLugar, { color: string }> = {
  restaurant: { color: LUGAR_MARKER_COLORS.restaurant },
  hotel: { color: LUGAR_MARKER_COLORS.hotel },
  attraction: { color: LUGAR_MARKER_COLORS.attraction },
  shopping: { color: LUGAR_MARKER_COLORS.shopping },
  transport: { color: LUGAR_MARKER_COLORS.transport },
  other: { color: LUGAR_MARKER_COLORS.other },
};

interface MapMarkerProps {
  categoria: CategoriaLugar;
  size?: number;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  categoria,
  size = 40
}) => {
  const config = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.other;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Sombra */}
        <Circle
          cx={size / 2}
          cy={size / 2 + 1}
          r={size * 0.38}
          fill="rgba(0,0,0,0.25)"
        />

        {/* Borde blanco exterior */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.38}
          fill="#FFFFFF"
        />

        {/* Círculo de color interior */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.32}
          fill={config.color}
        />

        {/* Punto central blanco (icono simplificado) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.12}
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
};

// Componente para lugar seleccionado
interface SelectedPlaceMarkerProps {
  color?: string;
  size?: number;
}

export const SelectedPlaceMarker: React.FC<SelectedPlaceMarkerProps> = ({
  color = '#003580',
  size = 40
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Sombra */}
        <Circle
          cx={size / 2}
          cy={size / 2 + 1}
          r={size * 0.42}
          fill="rgba(0,0,0,0.25)"
        />

        {/* Borde blanco exterior - más grande para destacar */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.42}
          fill="#FFFFFF"
        />

        {/* Círculo de color interior */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.36}
          fill={color}
        />

        {/* Punto central blanco - más grande para destacar */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.16}
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapMarker;
