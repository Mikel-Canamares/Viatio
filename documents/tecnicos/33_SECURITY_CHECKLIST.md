# Security Checklist (pre-release)

## App móvil
- [ ] Variables `EXPO_PUBLIC_*` configuradas en CI/CD.
- [ ] Reglas Firestore/Storage revisadas y auditadas.
- [ ] Validación de inputs en formularios críticos.
- [ ] Verificación de permisos de ubicación/notificaciones.

## Backend IA
- [ ] `GEMINI_API_KEY` configurada y rotada.
- [ ] CORS configurado con orígenes mínimos.
- [ ] Rate limiting validado.
- [ ] Logs sin datos sensibles.

## Infraestructura
- [ ] TLS habilitado en despliegue.
- [ ] Backup de datos críticos (si aplica).


