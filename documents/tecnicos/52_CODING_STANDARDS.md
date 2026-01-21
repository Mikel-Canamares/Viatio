# Coding Standards

## Lenguaje y tooling
- **TypeScript** con `strict: true` en app y backend.
- App con resolución de módulos `bundler` y alias `@/*`.
- Backend con `moduleResolution: NodeNext`.

## Convenciones observadas
- Separación por capas (`services`, `database`, `screens`).
- Logs con `console.log`/`console.error`.
- Uso de `async/await` para IO.

## Linting/format
- Backend expone script `lint` (ESLint), configuración no encontrada en repo.
- App no declara scripts de lint en `package.json`.

## Recomendaciones
- Definir reglas ESLint/Prettier y aplicar en ambos proyectos.


