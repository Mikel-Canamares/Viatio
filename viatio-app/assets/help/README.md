# Capturas de Pantalla para Centro de Ayuda

Esta carpeta contiene las capturas de pantalla utilizadas en las FAQs del Centro de Ayuda.

## Imágenes Necesarias (10-15)

### Prioridad Alta
1. `help_crear_viaje.png` - Formulario de creación de viaje
2. `help_escanear_reserva.png` - Pantalla de escaneo de reserva con OCR
3. `help_gastos_compartidos.png` - Selector de método de reparto de gastos
4. `help_copilot_chat.png` - Ejemplo de conversación con Copilot
5. `help_invitar_miembros.png` - Modal de invitación a viaje compartido

### Prioridad Media
6. `help_configuracion.png` - Pantalla de configuración (idioma, moneda, tema)
7. `help_balances.png` - Vista de balances entre miembros
8. `help_mapa_pins.png` - Mapa con pins de reservas
9. `help_calendario_global.png` - Calendario global con múltiples viajes
10. `help_agenda_viaje.png` - Vista de agenda cronológica del viaje

### Prioridad Baja
11. `help_documentos_categoria.png` - Documentos organizados por categoría
12. `help_notificaciones.png` - Configuración de notificaciones
13. `help_liquidaciones.png` - Sugerencias de liquidación
14. `help_lugares_guardados.png` - Lugares guardados en el mapa
15. `help_perfil_estadisticas.png` - Pantalla de perfil con estadísticas

## Especificaciones Técnicas

- **Formato**: PNG
- **Tamaño máximo**: 300KB por imagen
- **Resolución**: Captura nativa del dispositivo (se redimensionará automáticamente)
- **Contenido**: Sin datos personales (usar datos de ejemplo/demo)
- **Estado**: Consistente (mismo tema, mismos datos ficticios)

## Nomenclatura

- Usar snake_case con prefijo `help_`
- Nombres descriptivos y cortos
- Evitar caracteres especiales

## Implementación

Una vez generadas las imágenes, se pueden asociar a las FAQs editando el archivo:
`viatio-app/src/data/helpContent.ts`

Ejemplo:
```typescript
{
  id: 'crear-viaje',
  question: '¿Cómo creo un nuevo viaje?',
  answer: '...',
  images: [require('../../assets/help/help_crear_viaje.png')],
}
```

## Generación Automática

Para generar las capturas automáticamente, ejecutar la app en modo desarrollo y navegar a las pantallas correspondientes usando herramientas de screenshot o comandos de Expo/React Native.
