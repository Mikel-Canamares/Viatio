# Testing del Centro de Ayuda - Viatio

## Checklist de Verificación Completa

### ✅ Fase 1: Navegación Básica

- [ ] Abrir app y navegar a **Perfil**
- [ ] Tap en **"Centro de ayuda"**
- [ ] Verificar que la pantalla carga sin errores
- [ ] Verificar header "Centro de ayuda" con botón atrás
- [ ] Verificar estadísticas muestran "67 Preguntas" y "9 Categorías"

### ✅ Fase 2: Categorías

#### Verificar 9 Categorías Presentes:

- [ ] 📱 **Inicio y Configuración** (Azul) - 6 FAQs
- [ ] ✈️ **Gestión de Viajes** (Verde) - 6 FAQs
- [ ] 🎫 **Reservas y Agenda** (Ámbar) - 9 FAQs
- [ ] 👥 **Viajes Compartidos** (Púrpura) - 8 FAQs
- [ ] 💰 **Gastos y Liquidaciones** (Rojo) - 9 FAQs
- [ ] 📄 **Documentos** (Índigo) - 7 FAQs
- [ ] 🗺️ **Mapa y Lugares** (Verde azulado) - 7 FAQs
- [ ] 🤖 **Asistente Viatio Copilot** (Rosa) - 9 FAQs
- [ ] 🔔 **Notificaciones y Sincronización** (Naranja) - 6 FAQs

#### Funcionalidad de Categorías:

- [ ] Cada categoría muestra ícono con color de fondo tenue
- [ ] Badge con número de FAQs
- [ ] Tap en categoría → Expande suavemente
- [ ] Chevron rota 180° al expandir
- [ ] Solo una categoría expandida a la vez (opcional)
- [ ] Scroll suave entre categorías

### ✅ Fase 3: FAQs Individuales

#### Seleccionar 5 FAQs aleatorias y verificar:

**FAQ 1: ¿Cómo creo un nuevo viaje?**
- [ ] Pregunta visible con ícono de interrogación
- [ ] Tap → Expande con animación
- [ ] Respuesta muestra formato correcto
- [ ] Bullets (•) con sangría
- [ ] Texto en **negrita** se ve diferenciado
- [ ] Chevron rota al expandir

**FAQ 2: ¿Qué métodos de reparto existen?**
- [ ] Lista numerada (1. 2. 3. 4.) se muestra correctamente
- [ ] Cada método con su nombre en negrita
- [ ] Spacing entre líneas adecuado

**FAQ 3: ¿Qué es el Viatio Copilot?**
- [ ] Lista de bullets correcta
- [ ] Texto multi-línea formateado

**FAQ 4: ¿Puedo usar Viatio sin internet?**
- [ ] Texto con **offline-first** en negrita
- [ ] Lectura clara y espaciado

**FAQ 5: ¿Cómo invito a personas a mi viaje?**
- [ ] Path de navegación claro (Miembros → Invitar)
- [ ] Texto formateado correctamente

### ✅ Fase 4: Búsqueda Avanzada

#### Test de Búsqueda por Términos:

**Búsqueda: "crear"**
- [ ] Input de búsqueda responde
- [ ] Contador de resultados aparece (ej: "8 resultados")
- [ ] Texto "para 'crear'" debajo del contador
- [ ] Resultados incluyen:
  - [ ] ¿Cómo creo un nuevo viaje?
  - [ ] ¿Cómo creo un viaje compartido?
  - [ ] ¿Cómo creo un evento personalizado?
- [ ] Cada resultado muestra badge de categoría con color
- [ ] Ícono de categoría en badge

**Búsqueda: "OCR"**
- [ ] Encuentra FAQ de escaneo de reservas
- [ ] Badge "Reservas y Agenda" visible
- [ ] Resultado único o pocos resultados

**Búsqueda: "compartido"**
- [ ] Múltiples resultados (8+)
- [ ] Mayoría con badge "Viajes Compartidos"
- [ ] Algunos de "Gastos y Liquidaciones"

**Búsqueda: "xyzabc123"** (término inexistente)
- [ ] Muestra "Sin resultados"
- [ ] Ícono de lupa grande
- [ ] Mensaje: "No se encontraron resultados para 'xyzabc123'"
- [ ] Hint: "Intenta con otros términos de búsqueda"

**Búsqueda: "presupuesto"**
- [ ] Encuentra FAQs de gastos
- [ ] Keywords funcionan (no solo question/answer)

#### Funcionalidad de Búsqueda:

- [ ] Botón X aparece cuando hay texto
- [ ] Tap en X limpia búsqueda
- [ ] Estadísticas desaparecen durante búsqueda
- [ ] Return key type es "search"
- [ ] Búsqueda case-insensitive

### ✅ Fase 5: Navegación a Pantallas (opcional)

**Nota:** Algunas pantallas pueden no existir aún

- [ ] Tap en "Ir a CreateTrip" (si existe enlace)
- [ ] Verifica si navega o muestra toast informativo
- [ ] Toast debe decir "Esta pantalla aún no está disponible: [nombre]"
- [ ] No debe crashear la app

### ✅ Fase 6: Imágenes (cuando se añadan)

**Cuando se agreguen las capturas de pantalla:**

- [ ] Ver FAQ con imagen
- [ ] Carrusel horizontal visible
- [ ] Tap en thumbnail → Modal fullscreen
- [ ] Modal con fondo oscuro (95% opacidad)
- [ ] Botón X en esquina superior izquierda
- [ ] Contador "1 / 3" (si hay múltiples imágenes)
- [ ] Pinch-to-zoom funciona
- [ ] Swipe/botones para navegar entre imágenes
- [ ] Cerrar modal → Vuelve a FAQ
- [ ] Indicador "3 imágenes" debajo del carrusel

### ✅ Fase 7: Sección de Contacto

- [ ] SectionTitle "Contacto" visible
- [ ] Card con 3 opciones:
  - [ ] **Enviar email** (ícono mail)
  - [ ] **Chat de soporte** (ícono chat) - badge "Próximamente"
  - [ ] **Reportar un problema** (ícono bug)

**Test de Enviar Email:**
- [ ] Tap en "Enviar email"
- [ ] Abre cliente de correo del sistema
- [ ] Email: soporte@viatio.com
- [ ] Subject: "Consulta desde Viatio"
- [ ] Si no hay cliente → Toast de error informativo

**Test de Chat:**
- [ ] Tap en "Chat de soporte"
- [ ] Alert: "El chat en vivo estará disponible próximamente..."
- [ ] Botón OK

**Test de Reportar Problema:**
- [ ] Tap en "Reportar un problema"
- [ ] Alert con descripción
- [ ] Opción "Cancelar" y "Enviar email"
- [ ] "Enviar email" → Abre cliente de correo

### ✅ Fase 8: Footer

- [ ] Título "ENLACES ÚTILES" (mayúsculas, gris)
- [ ] Link "Términos de servicio"
  - [ ] Tap → Intenta abrir https://viatio.com/terminos-de-servicio
- [ ] Link "Política de privacidad"
  - [ ] Tap → Intenta abrir https://viatio.com/politica-de-privacidad
- [ ] Texto "Versión X.X.X" centrado
- [ ] Versión coincide con package.json

### ✅ Fase 9: Rendimiento y UX

#### Rendimiento:
- [ ] Scroll fluido con 67 FAQs (FlatList)
- [ ] No lag al expandir categorías
- [ ] Búsqueda instantánea (sin delay)
- [ ] Animaciones suaves (200ms)
- [ ] Transiciones sin jank

#### Responsive:
- [ ] Probado en pantalla pequeña (iPhone SE)
- [ ] Probado en pantalla grande (iPad/tablet)
- [ ] Texto legible en ambos tamaños
- [ ] Spacing adecuado

#### Accesibilidad:
- [ ] Tap targets mínimo 44x44 pt
- [ ] Contraste de colores adecuado
- [ ] Texto legible (min 14px)

### ✅ Fase 10: Edge Cases

- [ ] Rotar dispositivo → Layout se adapta
- [ ] Navegar atrás → Vuelve a Perfil
- [ ] Abrir categoría, salir de ayuda, volver → Estado limpio
- [ ] Buscar, salir, volver → Búsqueda limpia
- [ ] Modo oscuro (si está implementado) → Colores correctos
- [ ] Idioma español → Todo en español

### ✅ Fase 11: Verificación de Datos

#### Contar FAQs por Categoría:
- [ ] Inicio y Configuración: **6** ✓
- [ ] Gestión de Viajes: **6** ✓
- [ ] Reservas y Agenda: **9** ✓
- [ ] Viajes Compartidos: **8** ✓
- [ ] Gastos y Liquidaciones: **9** ✓
- [ ] Documentos: **7** ✓
- [ ] Mapa y Lugares: **7** ✓
- [ ] Asistente Viatio Copilot: **9** ✓
- [ ] Notificaciones y Sincronización: **6** ✓

**Total: 67 FAQs ✓**

#### Verificar Contenido de Muestra:

**FAQ Críticas que DEBEN existir:**
- [ ] ¿Cómo creo una cuenta en Viatio?
- [ ] ¿Cómo creo un nuevo viaje?
- [ ] ¿Cómo funciona el escaneo inteligente de reservas?
- [ ] ¿Cómo creo un viaje compartido?
- [ ] ¿Qué métodos de reparto existen?
- [ ] ¿Qué es el Viatio Copilot?
- [ ] ¿Puedo usar Viatio sin internet?

### ✅ Fase 12: Testing de Regresión

**Verificar que NO se rompió nada:**
- [ ] ProfileScreen sigue funcionando
- [ ] Navegación a otras pantallas desde Perfil funciona
- [ ] Otros componentes de la app no afectados
- [ ] No hay console errors en Metro
- [ ] No hay warnings de deprecación
- [ ] Build de producción exitoso (opcional)

---

## Bugs Conocidos / Pendientes

### Capturas de Pantalla
- [ ] Generar 10-15 capturas de pantalla
- [ ] Optimizar tamaño (max 300KB)
- [ ] Asociar a FAQs en `helpContent.ts`

### Mejoras Futuras (v2)
- [ ] Sistema de feedback "¿Te ayudó?"
- [ ] Analytics de búsquedas populares
- [ ] Internacionalización (i18n)
- [ ] Resaltado de términos en búsqueda (SearchHighlight)
- [ ] Historial de búsquedas recientes
- [ ] Compartir FAQ por WhatsApp/email

---

## Criterios de Aceptación

### ✅ Mínimo Viable
- [x] 67 FAQs implementadas
- [x] 9 categorías con íconos y colores
- [x] Búsqueda funcional con keywords
- [x] Navegación suave y animada
- [x] Rendimiento óptimo (FlatList)
- [x] TypeScript sin errores
- [ ] Testing manual completo

### 🎯 Completo
- [x] Todo lo de Mínimo Viable
- [ ] Capturas de pantalla integradas
- [ ] Testing en dispositivo real
- [ ] Testing en modo oscuro
- [ ] Verificación de accesibilidad

### 🚀 Excelencia
- [ ] Todo lo de Completo
- [ ] i18n implementado
- [ ] Analytics implementado
- [ ] Sistema de feedback
- [ ] Testing automatizado (opcional)

---

## Instrucciones para Testing Manual

### Setup:
1. Iniciar Metro bundler: `npm start`
2. Abrir app en simulador/dispositivo
3. Navegar a Perfil → Centro de ayuda

### Proceso:
1. Seguir checklist en orden
2. Marcar cada item al verificar
3. Anotar bugs/issues encontrados
4. Tomar screenshots de problemas
5. Reportar al finalizar

### Criterio PASS/FAIL:
- **PASS**: ≥95% items verificados sin bugs críticos
- **FAIL**: <95% o bugs críticos encontrados

---

## Reporte Final

**Fecha:** _______________
**Tester:** _______________
**Dispositivo:** _______________
**OS:** _______________

**Items Verificados:** ___ / 100+
**Bugs Encontrados:** ___
**Bugs Críticos:** ___
**Resultado:** PASS / FAIL

**Notas:**
________________________________________________________________
________________________________________________________________
________________________________________________________________
