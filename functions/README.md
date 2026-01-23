# Firebase Cloud Functions - Viatio

Funciones serverless para enviar notificaciones push cuando se comparten viajes.

## Estructura

```
functions/
├── src/
│   └── index.ts          # Función principal para enviar push notifications
├── package.json          # Dependencias
├── tsconfig.json         # Configuración TypeScript
└── README.md            # Este archivo
```

## Funciones Desplegadas

### `sendPushNotification`
- **Trigger**: Firestore onCreate en `notifications/{userId}/notifications/{notificationId}`
- **Descripción**: Se ejecuta cuando se crea una nueva notificación en Firestore
- **Acción**:
  1. Obtiene el push token del usuario desde `users/{userId}/pushToken`
  2. Valida que sea un token válido de Expo
  3. Envía la notificación usando Expo Push Notification Service
  4. Guarda el ticket de entrega en la notificación

### `checkPushReceipts` (Opcional)
- **Trigger**: Cron job cada 24 horas
- **Descripción**: Verifica qué notificaciones fueron entregadas exitosamente
- **Estado**: Placeholder para implementación futura si se necesita tracking avanzado

## Instalación

```bash
cd functions
npm install
```

## Desarrollo Local

```bash
# Compilar TypeScript
npm run build

# Ejecutar emuladores de Firebase
npm run serve

# Abrir shell interactiva
npm run shell
```

## Despliegue

```bash
# Desplegar todas las funciones
npm run deploy

# Ver logs en producción
npm run logs
```

## Variables de Entorno

Las Cloud Functions usan las credenciales de Firebase Admin SDK automáticamente.
No se requieren variables de entorno adicionales.

## Testing

Para probar localmente:

1. Inicia los emuladores: `npm run serve`
2. Crea una notificación en Firestore (emulador o producción)
3. La función se ejecutará automáticamente

## Logs

```bash
# Ver logs en tiempo real
firebase functions:log --only sendPushNotification

# Ver logs de todas las funciones
npm run logs
```

## Notas Importantes

- **Dispositivos físicos únicamente**: Las notificaciones push solo funcionan en dispositivos físicos, no en simuladores/emuladores
- **Tokens de Expo**: Los tokens se obtienen y guardan automáticamente al hacer login en la app móvil
- **Rate limits**: Expo Push Service tiene límites gratuitos de ~1M notificaciones/mes
- **Receipts**: Los tickets de entrega se guardan en la notificación para debugging

## Troubleshooting

### Error: "No EAS project ID"
- Verifica que `app.config.js` tenga configurado `extra.eas.projectId`

### Error: "Invalid Expo push token"
- El token debe empezar con `ExponentPushToken[`
- Si el token es inválido, se elimina automáticamente de Firestore

### Notificaciones no llegan
1. Verifica que el usuario tenga un pushToken en Firestore
2. Revisa los logs de la Cloud Function
3. Verifica que el dispositivo sea físico (no emulador)
4. Verifica permisos de notificaciones en el dispositivo
