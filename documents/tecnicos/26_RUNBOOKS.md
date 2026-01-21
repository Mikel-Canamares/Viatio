# Runbooks operativos

## Runbook: Backend IA no responde
**Síntomas**: errores 5xx en `/api/*`.

**Checklist**
1. Verificar salud: `GET /health`.
2. Revisar variables de entorno (`GEMINI_API_KEY`, `PORT`, `CORS_ORIGINS`).
3. Revisar logs del servidor (errores en Gemini API o rate limits).
4. Reiniciar servicio.

## Runbook: Fallos de sincronización Firestore
**Síntomas**: datos no se replican en viajes compartidos.

**Checklist**
1. Confirmar que el viaje tiene `isShared=1` y `firestoreId`.
2. Revisar reglas Firestore/Storage (archivo `firestore.rules`, `storage.rules`).
3. Validar conectividad y sesión Firebase del usuario.
4. Revisar logs de sync (`services/sync/*`).

## Runbook: Google Places no devuelve resultados
**Síntomas**: búsquedas sin resultados o errores 4xx.

**Checklist**
1. Verificar `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
2. Confirmar cuota y facturación en Google Cloud.
3. Revisar logs de `googlePlacesService`.

## Runbook: Conversión de divisas falla
**Síntomas**: error en conversiones de moneda.

**Checklist**
1. Verificar disponibilidad de `https://api.frankfurter.app`.
2. Confirmar caché local y tiempos de expiración.
3. Reintentar con otra divisa base.


