# 📸 Guía Rápida - Generar Capturas de Pantalla

## Objetivo

Generar **10-15 capturas de pantalla** de alta calidad para el Centro de Ayuda de Viatio.

---

## ⚡ Inicio Rápido (5 minutos)

```bash
# 1. Iniciar app
cd viatio-app
npm start

# 2. Abrir en simulador/dispositivo
# iOS: i
# Android: a

# 3. Navegar y capturar (ver lista abajo)

# 4. Optimizar imágenes
# Usar https://tinypng.com/ o ImageOptim

# 5. Renombrar y mover
# Nomenclatura: help_nombre_descriptivo.png
# Destino: viatio-app/assets/help/
```

---

## 📋 Capturas Prioritarias (15)

### Alta Prioridad (5) - Hacer Primero

#### 1. `help_crear_viaje.png`
**Pantalla:** CreateTripScreen - Formulario completo
**Contenido:**
- Formulario de creación visible
- Campos llenos con datos de ejemplo
- Botón "Crear viaje" visible

**Navegación:** Home → Botón "+" → Formulario

---

#### 2. `help_escanear_reserva.png`
**Pantalla:** ScanReservationScreen - OCR en proceso
**Contenido:**
- Pantalla de escaneo
- Opción de cámara/galería/PDF visible
- (Opcional) Vista previa de imagen escaneada

**Navegación:** Viaje → Reservas → Escanear reserva

---

#### 3. `help_gastos_compartidos.png`
**Pantalla:** AddSharedExpenseScreen - Selector de reparto
**Contenido:**
- Formulario de gasto compartido
- Selector de método de reparto expandido
- Opciones: Equal, Exact, Percentage, Shares visibles

**Navegación:** Viaje Compartido → Gastos → "+" → Gasto compartido

---

#### 4. `help_copilot_chat.png`
**Pantalla:** AssistantScreen - Conversación activa
**Contenido:**
- Chat con 2-3 mensajes del usuario
- 2-3 respuestas del Copilot
- Input de mensaje visible
- FAB o header "Viatio Copilot"

**Navegación:** Viaje → Tab Copilot / FAB Copilot

---

#### 5. `help_invitar_miembros.png`
**Pantalla:** InviteToTripScreen - Modal de invitación
**Contenido:**
- Modal de invitación abierto
- Campo de email
- Botón "Enviar invitación"
- (Opcional) Código de invitación visible

**Navegación:** Viaje Compartido → Miembros → Invitar

---

### Media Prioridad (5) - Hacer Segundo

#### 6. `help_configuracion.png`
**Pantalla:** SettingsScreen
**Contenido:**
- Lista de opciones de configuración
- Idioma, Moneda, Tema visibles
- Al menos 4-5 opciones en pantalla

**Navegación:** Perfil → Configuración

---

#### 7. `help_balances.png`
**Pantalla:** SharedExpensesScreen - Vista de balances
**Contenido:**
- Tabla/lista de balances entre miembros
- "Ana debe 45€ a Carlos" (ejemplos)
- Indicador de saldos positivos/negativos

**Navegación:** Viaje Compartido → Gastos → Balances

---

#### 8. `help_mapa_pins.png`
**Pantalla:** TripMapScreen
**Contenido:**
- Mapa con 3-5 pins de reservas
- Pins de diferentes colores (categorías)
- Mapa centrado mostrando ubicaciones

**Navegación:** Viaje → Tab Mapa

---

#### 9. `help_calendario_global.png`
**Pantalla:** CalendarScreen
**Contenido:**
- Vista de calendario mensual
- 2-3 viajes marcados en diferentes días
- Eventos/reservas visibles

**Navegación:** Tab Calendario (navegación inferior)

---

#### 10. `help_agenda_viaje.png`
**Pantalla:** TripAgendaScreen
**Contenido:**
- Lista cronológica de eventos
- Agrupado por día
- Mezcla de reservas y eventos personalizados

**Navegación:** Viaje → Tab Agenda

---

### Baja Prioridad (5) - Hacer Tercero (opcional)

#### 11. `help_documentos_categoria.png`
**Pantalla:** TripDocumentsScreen
**Contenido:**
- Acordeones de categorías
- Al menos 2 categorías expandidas
- 2-3 documentos visibles

**Navegación:** Viaje → Tab Documentos

---

#### 12. `help_notificaciones.png`
**Pantalla:** NotificationSettingsScreen
**Contenido:**
- Lista de tipos de notificaciones
- Switches on/off
- Tiempos de aviso visibles

**Navegación:** Perfil → Notificaciones

---

#### 13. `help_liquidaciones.png`
**Pantalla:** SettlementsScreen - Sugerencias
**Contenido:**
- Lista de sugerencias de liquidación
- "Ana paga 45€ a Carlos" (simplificado)
- Botón "Registrar pago"

**Navegación:** Viaje Compartido → Liquidaciones

---

#### 14. `help_lugares_guardados.png`
**Pantalla:** TripMapScreen - Con lugares guardados
**Contenido:**
- Mapa con pins de lugares guardados
- Pins diferenciados de reservas
- Al menos 2-3 lugares

**Navegación:** Viaje → Mapa → Lugares guardados

---

#### 15. `help_perfil_estadisticas.png`
**Pantalla:** ProfileScreen
**Contenido:**
- Header con foto/nombre
- Estadísticas: Total viajes, Completados, Países, etc.
- Menú de opciones visible

**Navegación:** Tab Perfil

---

## 🎨 Requisitos de Calidad

### Datos de Ejemplo
- ✅ Usar nombres ficticios: "Ana García", "Carlos López"
- ✅ Destinos genéricos: "París", "Barcelona", "Roma"
- ✅ Fechas futuras: 2026
- ❌ NO usar datos personales reales
- ❌ NO usar emails reales
- ❌ NO mostrar información sensible

### Estética
- ✅ Pantalla completa (incluir barra de estado)
- ✅ Modo claro preferido (o consistente)
- ✅ Sin notificaciones intrusivas
- ✅ UI limpia y organizada
- ✅ Textos legibles

### Técnica
- **Formato:** PNG
- **Tamaño máximo:** 300KB por imagen
- **Resolución:** Nativa del dispositivo
- **Optimización:** Usar TinyPNG o ImageOptim

---

## 🛠️ Herramientas

### iOS Simulator
```bash
# Captura de pantalla
Cmd + S

# Ubicación por defecto
~/Desktop/Simulator Screen Shot...
```

### Android Emulator
```bash
# Captura de pantalla
Ctrl + S (Windows/Linux)
Cmd + S (Mac)

# O usar botones del emulator
```

### Dispositivo Físico

**iOS:**
- Botón lateral + Volumen arriba
- Screenshots → Fotos app

**Android:**
- Botón power + Volumen abajo
- Screenshots → Galería

---

## 📦 Optimización de Imágenes

### Opción 1: TinyPNG (Online)
1. Ir a https://tinypng.com/
2. Arrastrar imágenes
3. Descargar optimizadas
4. Verificar que estén <300KB

### Opción 2: ImageOptim (Mac)
```bash
# Instalar
brew install imageoptim-cli

# Optimizar
imageoptim help_*.png
```

### Opción 3: Manual
- Abrir en editor (Photoshop, GIMP, etc.)
- Exportar como PNG
- Calidad: 80-90%
- Verificar tamaño <300KB

---

## 📝 Checklist de Proceso

### Por Cada Imagen:

- [ ] Navegar a pantalla correcta
- [ ] Poblar con datos de ejemplo
- [ ] Verificar UI limpia
- [ ] Tomar captura (Cmd+S / Ctrl+S)
- [ ] Optimizar imagen (<300KB)
- [ ] Renombrar: `help_nombre.png`
- [ ] Mover a `viatio-app/assets/help/`
- [ ] Verificar en carpeta
- [ ] Tachar de lista

### Al Finalizar:

- [ ] 10-15 imágenes generadas
- [ ] Todas <300KB
- [ ] Nomenclatura correcta
- [ ] En carpeta `assets/help/`
- [ ] Listas para integrar

---

## 🔗 Integración en helpContent.ts

Una vez generadas las capturas, asociarlas a las FAQs:

```typescript
// Ejemplo: FAQ "¿Cómo creo un nuevo viaje?"

{
  id: 'crear-viaje',
  question: '¿Cómo creo un nuevo viaje?',
  answer: 'Toca el botón **+** en la pantalla de Viajes...',
  category: 'viajes',
  keywords: ['crear', 'nuevo viaje', 'destino', 'fechas'],
  images: [
    require('../../assets/help/help_crear_viaje.png') // ← AÑADIR ESTA LÍNEA
  ],
}
```

### FAQs a Asociar (prioridad):

1. **help_crear_viaje.png** → FAQ id: `crear-viaje`
2. **help_escanear_reserva.png** → FAQ id: `escanear-reserva`
3. **help_gastos_compartidos.png** → FAQ id: `metodos-reparto`
4. **help_copilot_chat.png** → FAQ id: `que-es-copilot`
5. **help_invitar_miembros.png** → FAQ id: `invitar-personas`
6. **help_configuracion.png** → FAQ id: `cambiar-idioma` (u otra de config)
7. **help_balances.png** → FAQ id: `ver-balances`
8. **help_mapa_pins.png** → FAQ id: `ver-mapa`
9. **help_calendario_global.png** → FAQ id: `calendario-global`
10. **help_agenda_viaje.png** → FAQ id: `agenda-viaje`

---

## ⏱️ Tiempo Estimado

- **Preparar datos de ejemplo:** 10 min
- **Navegar y capturar (15 fotos):** 30 min
- **Optimizar imágenes:** 10 min
- **Renombrar y mover:** 5 min
- **Integrar en código:** 10 min

**TOTAL: ~1 hora**

---

## ✅ Checklist Final

- [ ] 10-15 capturas generadas
- [ ] Todas optimizadas (<300KB)
- [ ] Nomenclatura correcta (`help_*.png`)
- [ ] En carpeta `assets/help/`
- [ ] Integradas en `helpContent.ts`
- [ ] App compila sin errores
- [ ] Imágenes se muestran correctamente
- [ ] Zoom funciona en modal

---

## 🐛 Troubleshooting

### Imagen no se muestra
**Causa:** Ruta incorrecta en `require()`
**Solución:** Verificar que el path relativo es correcto desde `helpContent.ts`

### Imagen muy grande
**Causa:** No optimizada
**Solución:** Usar TinyPNG o reducir resolución

### Error al compilar
**Causa:** Typo en nombre de archivo
**Solución:** Verificar que el nombre coincide exactamente

### Imagen borrosa
**Causa:** Resolución muy baja
**Solución:** Usar resolución nativa del dispositivo

---

**¡Listo! Con esta guía podrás generar todas las capturas en ~1 hora.**
