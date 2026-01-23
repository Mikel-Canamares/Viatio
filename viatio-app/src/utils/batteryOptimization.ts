/**
 * BATTERY OPTIMIZATION UTILS
 *
 * Utilidades para ayudar al usuario a desactivar la optimización de batería
 * en Android, que puede impedir la entrega de notificaciones.
 *
 * NOTA: Este módulo es una utilidad (no un componente React).
 * Actualmente usa Alert.alert para mostrar información, pero esto debería
 * refactorizarse para usar callbacks que permitan a los componentes que
 * lo usen mostrar CustomModal en su lugar.
 *
 * TODO: Refactorizar para pasar callbacks como parámetros:
 * - showBatteryOptimizationAlert(onConfirm, onCancel)
 * - showNotificationDeliveryTips(onConfigure, onDismiss)
 * Esto permitirá que los componentes muestren modales personalizados.
 */

import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Abre la configuración de optimización de batería en Android
 * Guía al usuario para desactivar la optimización de batería para Viatio
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.log('[BatteryOptimization] Solo disponible en Android');
    return;
  }

  try {
    console.log('[BatteryOptimization] Abriendo configuración de batería...');

    // Intentar abrir configuración específica de optimización de batería
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
    );

    console.log('[BatteryOptimization] ✅ Configuración abierta');
  } catch (error) {
    console.error('[BatteryOptimization] Error abriendo configuración específica:', error);

    // Fallback: Abrir configuración general
    try {
      await Linking.openSettings();
      console.log('[BatteryOptimization] ✅ Configuración general abierta');
    } catch (fallbackError) {
      console.error('[BatteryOptimization] Error abriendo configuración general:', fallbackError);
    }
  }
}

/**
 * Muestra una alerta explicando cómo desactivar la optimización de batería
 * y ofrece llevar al usuario a la configuración
 */
export function showBatteryOptimizationAlert(): void {
  if (Platform.OS !== 'android') {
    return;
  }

  Alert.alert(
    'Optimización de batería',
    'Para recibir notificaciones de manera confiable, te recomendamos desactivar la optimización de batería para Viatio.\n\n' +
    'Pasos:\n' +
    '1. Busca "Viatio" en la lista\n' +
    '2. Selecciona "No optimizar" o "Sin restricciones"\n' +
    '3. Confirma el cambio',
    [
      {
        text: 'Ahora no',
        style: 'cancel',
      },
      {
        text: 'Ir a configuración',
        onPress: () => openBatteryOptimizationSettings(),
      },
    ]
  );
}

/**
 * Verifica si el dispositivo es Android y muestra consejos para mejorar
 * la entrega de notificaciones
 */
export function showNotificationDeliveryTips(): void {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'Notificaciones',
      'Asegúrate de que las notificaciones estén habilitadas en Configuración > Notificaciones.',
      [{ text: 'Entendido' }]
    );
    return;
  }

  Alert.alert(
    'Consejos para notificaciones',
    'Para recibir notificaciones de manera confiable:\n\n' +
    '✓ Permite notificaciones para Viatio\n' +
    '✓ Desactiva la optimización de batería\n' +
    '✓ Asegúrate de que Viatio no esté en la lista de apps restringidas\n' +
    '✓ En algunos dispositivos (Xiaomi, Huawei), desactiva "Modo Ultra ahorro"',
    [
      {
        text: 'Entendido',
        style: 'cancel',
      },
      {
        text: 'Configurar ahora',
        onPress: () => showBatteryOptimizationAlert(),
      },
    ]
  );
}

/**
 * Obtiene información sobre el estado de optimización de batería
 * (Nota: No podemos verificar programáticamente el estado, solo guiar al usuario)
 */
export function getBatteryOptimizationInfo(): {
  canCheck: boolean;
  platform: string;
  recommendation: string;
} {
  return {
    canCheck: Platform.OS === 'android',
    platform: Platform.OS,
    recommendation:
      Platform.OS === 'android'
        ? 'Se recomienda desactivar la optimización de batería para recibir notificaciones de manera confiable'
        : 'Asegúrate de que las notificaciones estén habilitadas en la configuración del sistema',
  };
}
