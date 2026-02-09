/**
 * DUAL TIME DISPLAY
 *
 * Componente que muestra la hora en dos timezones: destino del viaje y casa.
 * Se actualiza cada minuto automáticamente.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { formatDualTime } from '@/services/timezoneService';

interface DualTimeDisplayProps {
  /** Timezone IANA del destino del viaje (ej: "Asia/Manila") */
  tripTimeZone: string;

  /** Timezone IANA del lugar casa del usuario (ej: "Europe/Madrid") */
  homeTimeZone: string;

  /** Estilo adicional para el contenedor */
  style?: any;
}

export function DualTimeDisplay({
  tripTimeZone,
  homeTimeZone,
  style,
}: DualTimeDisplayProps) {
  const [timeData, setTimeData] = useState(() =>
    formatDualTime(tripTimeZone, homeTimeZone)
  );

  // Actualizar cada minuto
  useEffect(() => {
    // Actualizar inmediatamente
    setTimeData(formatDualTime(tripTimeZone, homeTimeZone));

    // Actualizar cada 60 segundos
    const interval = setInterval(() => {
      setTimeData(formatDualTime(tripTimeZone, homeTimeZone));
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [tripTimeZone, homeTimeZone]);

  return (
    <View style={[styles.container, style]}>
      {/* Hora en destino */}
      <View style={styles.timeBlock}>
        <View style={styles.iconContainer}>
          <Ionicons name="airplane" size={16} color={theme.colors.primaryLight} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.timeLabel}>{timeData.destinationLabel}</Text>
          <Text style={styles.timeValue}>{timeData.destinationTime}</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Hora en casa */}
      <View style={styles.timeBlock}>
        <View style={styles.iconContainer}>
          <Ionicons name="home" size={16} color="#6B7280" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.timeLabel}>{timeData.homeLabel}</Text>
          <Text style={styles.timeValue}>{timeData.homeTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
});
