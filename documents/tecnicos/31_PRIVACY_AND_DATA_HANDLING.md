# Privacidad y manejo de datos — Viatio

Política de privacidad técnica, retención de datos y control de acceso.

**Última actualización**: 2026-01-21

---

## Resumen ejecutivo

**Enfoque**: Privacy-by-design con arquitectura offline-first + sync opcional

| Aspecto | Viajes privados | Viajes compartidos |
|---------|-----------------|-------------------|
| **Almacenamiento** | SQLite local | SQLite + Firebase/Firestore |
| **Acceso** | Solo el usuario | Solo miembros invitados |
| **Cifrado en tránsito** | N/A | HTTPS/TLS |
| **Cifrado en reposo** | Protegido por SO | Firebase AES-256 |
| **Retención** | Hasta eliminar | Hasta que owner elimine* |

\* 🚀 **Roadmap**: política de retención automática pendiente de implementar

---

## Datos personales tratados

### Identidad (Firebase Auth)
- `uid`, `email`, `displayName`, `photoURL` (opcional)
- **Uso**: Autenticación + identificación en viajes compartidos

### Viajes (SQLite + Firestore)
- destino, fechas, descripción, presupuesto, moneda
- reservas, lugares, documentos (metadata), gastos, eventos

**Referencia**: `viatio-app/src/database/schema.ts`

### Documentos (Firebase Storage)
- PDFs, imágenes (max 10MB)
- **Storage path**: `/trips/{tripId}/documents/{docId}`
- **Contenido**: Viatio NO accede; solo almacena cifrado

**Referencia**: `viatio-app/storage.rules`

---

## Control de acceso (Firestore Security Rules)

### Modelo de roles

| Rol | Permisos |
|-----|----------|
| `owner` | Todos + gestionar miembros |
| `admin` | Todos excepto degradar/eliminar owner |
| `member` | Leer + escribir |
| `read_only` | Solo lectura |

### Reglas implementadas

**Viajes privados**:
- ✅ Solo en dispositivo del usuario (SQLite)
- ✅ No sincronizados con la nube
- ✅ No accesibles por otros ni por Viatio

**Viajes compartidos**:
```javascript
// Solo miembros pueden leer
allow read: if isTripMember(tripId);

// Solo owner/admin/member pueden escribir
allow create, update, delete: if canWrite(tripId);
```

**Storage Rules**:
```javascript
// Solo miembros pueden leer archivos
allow read: if isTripMember(tripId);

// Solo miembros pueden subir (max 10MB, PDF/imagen)
allow create: if canWriteToTrip(tripId) &&
                 isValidSize() &&
                 isValidFileType();

// Archivos inmutables
allow update: if false;
```

**Referencia**: `viatio-app/firestore.rules`, `viatio-app/storage.rules`

---

## Retención de datos

### Política actual

| Dato | Retención | Borrado |
|------|-----------|---------|
| Viajes privados | Indefinida | Manual por usuario |
| Viajes compartidos | Indefinida | Manual por owner |
| Documentos Storage | Vinculada al viaje | Al eliminar viaje |
| Cuenta usuario | Indefinida | Delete account |

### Retención propuesta (🚀 Roadmap)

- Viajes finalizados: sugerencia de archivado tras 1 año
- Viajes compartidos inactivos: notificación tras 6 meses sin actividad
- Cuentas inactivas: notificación + eliminación tras 2 años sin login

**Estado**: ⚠️ **PENDIENTE / TODO** — Requiere Cloud Functions

---

## Minimización de datos

✅ **Aplicado**:
- Solo campos esenciales (no historial completo, no logs de usuario)
- Ubicación GPS solo si usuario marca explícitamente
- Métricas agregadas y anónimas (si se implementan)

❌ **Áreas de mejora**:
- Logs de backend incluyen IPs → anonimizar
- Imágenes escaneadas con IA → eliminar tras procesamiento

---

## Procesamiento con IA (Gemini)

### Flujo de escaneo de reservas

1. Usuario toma foto → app envía base64 a backend
2. Backend envía a Gemini API
3. Gemini extrae datos
4. Backend devuelve datos estructurados
5. **Imagen NO se almacena** en backend ni Gemini

**Retención en Gemini**: < 24h para abuse prevention (no training)

**Referencia**: `viatio-backend/src/routes/extractReserva.ts`

---

## Transferencias internacionales

| Servicio | Ubicación | Propósito |
|----------|-----------|-----------|
| Firebase | Multi-region | Auth, Firestore, Storage |
| Gemini AI | us-central1 | OCR reservas |
| Railway | us-west1 | Backend |

**Cumplimiento**: ✅ Todos los servicios son GDPR-compliant con SCCs

---

## Derechos GDPR

| Derecho | Estado |
|---------|--------|
| Acceso | ✅ En app |
| Rectificación | ✅ Edición en app |
| Supresión | ✅ Delete account |
| Portabilidad | ⚠️ Parcial (exportación de gastos) |
| Oposición | ✅ N/A (no marketing automatizado) |

---

## Cifrado

- **En tránsito**: HTTPS/TLS para todas las comunicaciones
- **En reposo**:
  - Firebase: AES-256 automático
  - SQLite local: protegido por sandboxing del SO (🚀 considerar expo-sqlite-encrypted)

---

## Roadmap de privacidad (P1)

- [ ] Formalizar política de retención en Firestore
- [ ] Implementar exportación completa de viajes (GDPR)
- [ ] Añadir audit logging de eventos críticos
- [ ] Documentar protocolo de respuesta a incidentes
- [ ] Cloud Functions para cleanup automático

---

## Referencias

- **Firestore Rules**: `viatio-app/firestore.rules`
- **Storage Rules**: `viatio-app/storage.rules`
- **Firebase GDPR**: https://firebase.google.com/support/privacy
- **Gemini Terms**: https://ai.google.dev/gemini-api/terms

---

**Última actualización**: 2026-01-21
