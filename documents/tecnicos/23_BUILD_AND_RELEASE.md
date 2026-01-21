# Build & Release

## App móvil (Expo/EAS)
### Configuración de builds
- EAS config en `viatio-app/eas.json` con perfiles `development`, `preview`, `production`.
- Existe un `eas.json` en la raíz para configuraciones generales de build.

### Comandos principales
```bash
cd viatio-app
npm run prebuild
```

### Checklist de release (app)
- [ ] Variables de entorno configuradas.
- [ ] Revisión de reglas Firestore/Storage.
- [ ] Build EAS en perfil correcto.
- [ ] Verificación manual en dispositivo.

## Backend IA
### Build
```bash
cd viatio-backend
npm run build
```

### Release
```bash
cd viatio-backend
npm run start
```

### Checklist de release (backend)
- [ ] GEMINI_API_KEY configurada.
- [ ] CORS_ORIGINS configurado.
- [ ] Rate limits revisados.


