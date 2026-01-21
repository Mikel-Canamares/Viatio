# Observability — Viatio

Estado actual de observabilidad, logging y monitoring del sistema.

**Última actualización**: 2026-01-21

---

## Resumen ejecutivo

**Estado actual**: 🟡 **Básico** — Logging en consola + health check + rate limiting

**Gap crítico**: Sin instrumentación de métricas, crash reporting ni alertas proactivas.

---

## Backend — Estado actual

### Logging

**Implementación**: Console logging básico
```typescript
// viatio-backend/src/index.ts
console.log(`🚀 Server running on port ${config.port}`);

// viatio-backend/src/middleware/errorHandler.ts
console.error('Error:', {
  message: err.message,
  stack: err.stack,
  path: req.path,
  method: req.method,
});
```

**Referencia**: `viatio-backend/src/middleware/errorHandler.ts:13-18`

**Limitaciones**:
- ❌ No hay niveles de log (debug, info, warn, error)
- ❌ No hay estructura JSON
- ❌ No hay request ID para tracing

---

### Health check

**Endpoint**: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2026-01-21T10:30:00.000Z",
  "uptime": 3600
}
```

**Referencia**: `viatio-backend/src/routes/health.ts`

**Uso**: Railway health check (cada 30s)

**Limitaciones**:
- ❌ No valida conectividad con Gemini API
- ❌ No valida Firebase Admin SDK

---

### Rate limiting

**Implementación**: `express-rate-limit`

| Limiter | Window | Max requests | Endpoints |
|---------|--------|--------------|-----------|
| `apiLimiter` | 15 min | 100 | Todos (global) |
| `aiLimiter` | 1 min | 10 | `/api/extract-reserva`, `/api/assistant`, `/api/copilot` |

**Referencia**: `viatio-backend/src/middleware/rateLimiter.ts`

**Limitaciones**:
- ❌ Store en memoria (no funciona con múltiples réplicas)
- ❌ No hay logging de rate limit hits

---

### Métricas y crash reporting

**Estado**: ❌ **NO IMPLEMENTADO**

- No hay instrumentación de métricas (Prometheus, StatsD)
- No hay integración con Sentry, Rollbar u otro crash reporting
- No hay distributed tracing

---

## App móvil — Estado actual

### Logging

**Implementación**: Console logging básico en services
```typescript
console.log('[Sync] Uploading changes:', changes.length);
console.error('[Sync] Error uploading:', error);
```

**Referencia**: `viatio-app/src/services/sync/uploadChanges.ts`

**Limitaciones**:
- ❌ Logs no persisten (solo durante debugging)
- ❌ No hay remote logging
- ❌ No hay crash reporting

---

### Crash reporting y analytics

**Estado**: ❌ **NO IMPLEMENTADO**

- No hay integración con Sentry React Native
- No hay integración con Firebase Crashlytics
- No hay Firebase Analytics (eventos de producto)

---

## Railway — Observability integrada

Railway provee métricas básicas:

| Métrica | Descripción |
|---------|-------------|
| CPU usage | % de CPU utilizado |
| Memory usage | RAM usada vs disponible |
| Network I/O | Incoming/Outgoing traffic |
| Logs | Retención: 7 días (Hobby), 30 días (Pro) |

**Acceso**:
- Dashboard: https://railway.app/project/<PROJECT_ID>
- CLI: `railway logs --follow`

---

## Roadmap de observability (P0 — Crítico)

### 1. Crash reporting (Sentry)

**Backend**:
```bash
npm install @sentry/node @sentry/tracing
```

**App móvil**:
```bash
npx expo install @sentry/react-native
```

**Coste**: $26/mes (plan Team, 100K events)

---

### 2. Structured logging (Pino)

```bash
npm install pino pino-http
```

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Uso
logger.info({ userId, action: 'create_trip' }, 'Trip created');
logger.error({ err, userId }, 'Failed to upload to Firebase');
```

---

### 3. Health check mejorado

```typescript
router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION,
    checks: {
      gemini: await checkGemini(),  // Ping a Gemini API
    },
  };

  const allOk = Object.values(checks.checks).every(c => c === 'ok');
  res.status(allOk ? 200 : 503).json(checks);
});
```

---

### 4. Firebase Analytics (app móvil)

```typescript
import analytics from '@react-native-firebase/analytics';

// Eventos clave
await analytics().logEvent('trip_created', { trip_id, is_shared });
await analytics().logEvent('reservation_scanned', { category });
await analytics().logEvent('copilot_query', { query_type });
```

---

## Mejores prácticas

### Logging

✅ **DO**:
- Usar structured logging (JSON)
- Incluir request ID
- Loggear errores con stack traces

❌ **DON'T**:
- Loggear secrets (API keys, tokens)
- Loggear PII sin enmascarar
- Usar `console.log` en producción

### Alertas

✅ **DO**:
- Error rate > 5% en 5 min → alert
- CPU > 80% durante 5 min → alert
- Health check failed 3 veces → alert

---

## Costes estimados

| Herramienta | Coste/mes |
|-------------|-----------|
| Sentry (crash reporting) | $26 |
| Railway metrics | $0 (incluido) |
| Firebase Analytics | $0 |

**Total mínimo**: ~$26/mes

---

## Referencias

- **Sentry**: https://docs.sentry.io
- **Pino**: https://github.com/pinojs/pino
- **Railway Observability**: https://docs.railway.app/reference/observability
- **Firebase Analytics**: https://firebase.google.com/docs/analytics

---

**Última actualización**: 2026-01-21
