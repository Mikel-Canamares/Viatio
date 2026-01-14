import { ImageSourcePropType } from 'react-native';

// Interfaces
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  relatedScreens?: string[];
  images?: ImageSourcePropType[];
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  faqs: FAQItem[];
}

// ===================================
// FAQs por categoría
// ===================================

const inicioConfiguracionFAQs: FAQItem[] = [
  {
    id: 'crear-cuenta',
    question: '¿Cómo creo una cuenta en Viatio?',
    answer:
      'Puedes registrarte con email y contraseña desde la pantalla inicial, o usar el botón "Continuar con Google" para un registro instantáneo. Recibirás un email de verificación que debes confirmar antes de usar todas las funciones.',
    category: 'inicio-config',
    keywords: ['registro', 'cuenta', 'email', 'google', 'crear', 'sign up', 'verificación'],
    relatedScreens: ['Register', 'Login'],
  },
  {
    id: 'cambiar-idioma',
    question: '¿Cómo cambio el idioma de la app?',
    answer:
      'Ve a **Perfil** → **Configuración** → **Idioma**. Viatio está disponible en 6 idiomas: Español, Inglés, Francés, Alemán, Italiano y Portugués.',
    category: 'inicio-config',
    keywords: ['idioma', 'language', 'configuración', 'settings', 'español', 'inglés', 'francés'],
    relatedScreens: ['Profile', 'Settings'],
  },
  {
    id: 'cambiar-moneda',
    question: '¿Puedo cambiar la moneda predeterminada?',
    answer:
      'Sí, en **Perfil** → **Configuración** → **Moneda**. Puedes elegir entre EUR, USD, GBP, MXN, ARS, COP. Los gastos se mostrarán en esta moneda, aunque cada gasto puede tener su propia moneda.',
    category: 'inicio-config',
    keywords: ['moneda', 'currency', 'euro', 'dólar', 'peso', 'libra', 'configuración'],
    relatedScreens: ['Profile', 'Settings'],
  },
  {
    id: 'modo-oscuro',
    question: '¿Cómo activo el modo oscuro?',
    answer:
      'En **Perfil** → **Configuración** → **Tema**, elige entre Claro, Oscuro o Sistema (se ajusta automáticamente según tu dispositivo).',
    category: 'inicio-config',
    keywords: ['tema', 'dark mode', 'modo oscuro', 'claro', 'theme', 'apariencia'],
    relatedScreens: ['Profile', 'Settings'],
  },
  {
    id: 'estadisticas',
    question: '¿Dónde veo mis estadísticas de viajes?',
    answer:
      'En tu pantalla de **Perfil** verás: total de viajes, viajes completados, próximos viajes, países visitados y total gastado.',
    category: 'inicio-config',
    keywords: ['estadísticas', 'stats', 'perfil', 'viajes', 'gastos', 'países'],
    relatedScreens: ['Profile'],
  },
  {
    id: 'recuperar-password',
    question: '¿Cómo recupero mi contraseña?',
    answer:
      'En la pantalla de inicio de sesión, toca "¿Olvidaste tu contraseña?" e ingresa tu email. Recibirás un enlace para crear una nueva contraseña.',
    category: 'inicio-config',
    keywords: ['contraseña', 'password', 'recuperar', 'olvidé', 'reset', 'email'],
    relatedScreens: ['Login', 'ForgotPassword'],
  },
];

const gestionViajesFAQs: FAQItem[] = [
  {
    id: 'crear-viaje',
    question: '¿Cómo creo un nuevo viaje?',
    answer:
      'Toca el botón **+** en la pantalla de Viajes. Completa:\n- Destino (con autocompletado de Google Places)\n- Fechas de inicio y fin\n- Presupuesto y moneda\n- Número de viajeros\n- Descripción (opcional)\n- Imagen (opcional)',
    category: 'viajes',
    keywords: ['crear', 'nuevo viaje', 'destino', 'fechas', 'presupuesto'],
    relatedScreens: ['TripList', 'CreateTrip'],
  },
  {
    id: 'editar-viaje',
    question: '¿Puedo editar un viaje después de crearlo?',
    answer:
      'Sí, abre el viaje y toca el ícono de edición (lápiz). Puedes cambiar cualquier dato excepto si es compartido (requiere permisos de administrador).',
    category: 'viajes',
    keywords: ['editar', 'modificar', 'cambiar', 'actualizar', 'viaje'],
    relatedScreens: ['TripDetail'],
  },
  {
    id: 'viaje-compartido-vs-individual',
    question: '¿Qué es un viaje compartido vs individual?',
    answer:
      '- **Individual**: Solo tú tienes acceso. Datos almacenados localmente con backup opcional en la nube.\n- **Compartido**: Múltiples usuarios pueden ver y editar. Sincronización en tiempo real con Firestore. Gastos con repartos entre miembros.',
    category: 'viajes',
    keywords: ['compartido', 'individual', 'diferencia', 'shared', 'colaborativo'],
    relatedScreens: ['CreateTrip', 'SharedTrips'],
  },
  {
    id: 'archivar-viaje',
    question: '¿Cómo archivo un viaje finalizado?',
    answer:
      'En la lista de viajes, desliza la tarjeta del viaje hacia la izquierda y toca **Archivar**. Podrás verlos en **Perfil** → **Viajes archivados**.',
    category: 'viajes',
    keywords: ['archivar', 'finalizado', 'completado', 'historial', 'archive'],
    relatedScreens: ['TripList', 'ArchivedTrips'],
  },
  {
    id: 'calendario-global',
    question: '¿Qué es el calendario global?',
    answer:
      'Es una vista de calendario que muestra TODOS tus viajes y reservas en una sola pantalla. Accede desde el tab **Calendario** en la navegación inferior.',
    category: 'viajes',
    keywords: ['calendario', 'calendar', 'global', 'todos', 'vista'],
    relatedScreens: ['Calendar'],
  },
  {
    id: 'eliminar-viaje',
    question: '¿Puedo eliminar un viaje permanentemente?',
    answer:
      'Sí, en la pantalla de detalle del viaje, ve a opciones (⋮) y selecciona **Eliminar viaje**. Esta acción es irreversible.',
    category: 'viajes',
    keywords: ['eliminar', 'borrar', 'delete', 'permanente', 'irreversible'],
    relatedScreens: ['TripDetail'],
  },
];

const reservasAgendaFAQs: FAQItem[] = [
  {
    id: 'tipos-reservas',
    question: '¿Qué tipos de reservas puedo añadir?',
    answer:
      'Viatio soporta 6 categorías:\n- **Transporte**: Avión, tren, autobús, ferry, taxi, coche\n- **Alojamiento**: Hotel, aparthotel, apartamento, habitación, camping\n- **Comida**: Restaurantes\n- **Actividades**: Turismo, cultura, deportes, naturaleza, entretenimiento, vida nocturna\n- **Compras**: Shopping\n- **Otros**: Cualquier otro tipo',
    category: 'reservas',
    keywords: ['tipos', 'categorías', 'reserva', 'transporte', 'hotel', 'actividad'],
    relatedScreens: ['AddReservation'],
  },
  {
    id: 'añadir-reserva-manual',
    question: '¿Cómo añado una reserva manualmente?',
    answer:
      'Desde el detalle del viaje, ve al tab **Reservas** → botón **+**. Completa:\n- Categoría y tipo\n- Nombre (ej: "Vuelo Madrid-París")\n- Proveedor (ej: "Iberia")\n- Fechas y horarios\n- Ubicación (con búsqueda de Google Places)\n- Precio y moneda\n- Número de confirmación\n- Metadatos específicos (número de vuelo, asiento, check-in, etc.)',
    category: 'reservas',
    keywords: ['añadir', 'crear', 'manual', 'reserva', 'booking'],
    relatedScreens: ['TripReservations', 'AddReservation'],
  },
  {
    id: 'escanear-reserva',
    question: '¿Cómo funciona el escaneo inteligente de reservas?',
    answer:
      'Toca **Escanear reserva** en la pantalla de Reservas. Puedes:\n1. **Tomar foto** del billete/confirmación\n2. **Subir imagen** desde galería\n3. **Subir PDF** con la confirmación\n\nEl OCR con IA (Gemini) extrae automáticamente: fechas, horarios, proveedor, número de confirmación, ubicaciones, precio. Revisa los datos y guarda.',
    category: 'reservas',
    keywords: ['escanear', 'OCR', 'inteligente', 'IA', 'foto', 'PDF', 'Gemini'],
    relatedScreens: ['ScanReservation'],
  },
  {
    id: 'pkpass',
    question: '¿Qué es un archivo .pkpass y cómo lo proceso?',
    answer:
      'Los archivos .pkpass son pases de Apple Wallet (billetes de avión, entradas, etc.). Viatio puede extraer la información de estos archivos automáticamente. Selecciona el archivo .pkpass y se procesará igual que con OCR.',
    category: 'reservas',
    keywords: ['pkpass', 'apple wallet', 'wallet', 'pass', 'billete'],
    relatedScreens: ['ScanReservation'],
  },
  {
    id: 'asociar-documento',
    question: '¿Puedo asociar un documento a una reserva?',
    answer:
      'Sí, al crear/editar una reserva, en la sección de documentos puedes seleccionar un archivo ya subido o subir uno nuevo. Útil para tener el PDF de confirmación vinculado.',
    category: 'reservas',
    keywords: ['documento', 'asociar', 'PDF', 'vincular', 'attach'],
    relatedScreens: ['AddReservation', 'EditReservation'],
  },
  {
    id: 'agenda-viaje',
    question: '¿Qué es la Agenda del viaje?',
    answer:
      'Es una vista cronológica de TODAS tus actividades: reservas + eventos personalizados, organizados por día. Accede desde el tab **Agenda** en el detalle del viaje.',
    category: 'reservas',
    keywords: ['agenda', 'itinerario', 'cronología', 'día', 'timeline'],
    relatedScreens: ['TripAgenda'],
  },
  {
    id: 'crear-evento',
    question: '¿Cómo creo un evento personalizado?',
    answer:
      'Desde la Agenda, toca **+** → **Crear evento**. Puedes añadir:\n- Título y descripción\n- Fecha y hora\n- Ubicación\n- Categoría\n- Recordatorio\n\nPerfecto para agendar reuniones, comidas informales, tiempo libre, etc.',
    category: 'reservas',
    keywords: ['evento', 'personalizado', 'custom', 'crear', 'agenda'],
    relatedScreens: ['TripAgenda', 'AddEvento'],
  },
  {
    id: 'editar-eliminar-reserva',
    question: '¿Cómo edito o elimino una reserva?',
    answer:
      '- **Editar**: Toca la reserva → ícono de lápiz\n- **Eliminar**: Desliza la tarjeta hacia la izquierda → **Eliminar** (o desde el detalle → opciones → Eliminar)',
    category: 'reservas',
    keywords: ['editar', 'eliminar', 'borrar', 'modificar', 'reserva'],
    relatedScreens: ['ReservationDetail', 'EditReservation'],
  },
  {
    id: 'metadatos-reserva',
    question: '¿Qué metadatos puedo añadir según el tipo de reserva?',
    answer:
      'Cada categoría tiene campos específicos:\n- **Vuelos**: Aerolínea, número de vuelo, terminal, puerta, asiento, clase\n- **Hoteles**: Tipo de habitación, número de noches, check-in/out\n- **Restaurantes**: Número de personas, tipo de comida\n- **Actividades**: Duración, qué incluye\n- **General**: Contacto, teléfono, email, web, política de cancelación',
    category: 'reservas',
    keywords: ['metadatos', 'campos', 'vuelo', 'hotel', 'detalles'],
    relatedScreens: ['AddReservation'],
  },
];

const viajesCompartidosFAQs: FAQItem[] = [
  {
    id: 'crear-viaje-compartido',
    question: '¿Cómo creo un viaje compartido?',
    answer:
      'Al crear un viaje, activa la opción **"Viaje compartido"**. Esto:\n- Habilita sincronización en tiempo real\n- Permite invitar a otros usuarios\n- Activa gastos compartidos con repartos\n- Genera un código de invitación',
    category: 'compartido',
    keywords: ['crear', 'compartido', 'shared', 'colaborativo', 'grupo'],
    relatedScreens: ['CreateSharedTrip'],
  },
  {
    id: 'invitar-personas',
    question: '¿Cómo invito a personas a mi viaje?',
    answer:
      'Desde el detalle del viaje compartido, toca **Miembros** → **Invitar** → ingresa el email de la persona. Recibirá una notificación y puede aceptar/rechazar.',
    category: 'compartido',
    keywords: ['invitar', 'email', 'invite', 'miembros', 'personas'],
    relatedScreens: ['TripMembers', 'InviteToTrip'],
  },
  {
    id: 'codigo-invitacion',
    question: '¿Qué es el código de invitación?',
    answer:
      'Es un código único de 6-8 caracteres que puedes compartir. Otros usuarios pueden unirse desde **Viajes** → **Unirse con código** sin necesidad de invitación por email.',
    category: 'compartido',
    keywords: ['código', 'invitación', 'code', 'join', 'unirse'],
    relatedScreens: ['JoinTripByCode'],
  },
  {
    id: 'admin-vs-miembro',
    question: '¿Qué diferencia hay entre admin y miembro?',
    answer:
      '- **Admin**: Puede editar viaje, invitar/remover miembros, eliminar el viaje, cambiar permisos\n- **Miembro**: Puede ver y añadir reservas/gastos/documentos, pero no modificar configuración del viaje ni gestionar miembros',
    category: 'compartido',
    keywords: ['admin', 'miembro', 'permisos', 'roles', 'administrador'],
    relatedScreens: ['TripMembers'],
  },
  {
    id: 'ver-cambios',
    question: '¿Puedo ver quién hizo cambios en el viaje?',
    answer:
      'Sí, en viajes compartidos cada reserva/gasto/documento muestra quién lo creó y cuándo. Además, la sincronización muestra actividad reciente.',
    category: 'compartido',
    keywords: ['cambios', 'actividad', 'historial', 'quién', 'log'],
    relatedScreens: ['SharedTripDetail'],
  },
  {
    id: 'abandonar-viaje',
    question: '¿Cómo abandono un viaje compartido?',
    answer:
      'Ve a **Miembros** → tu nombre → **Abandonar viaje**. Perderás acceso a todos los datos. Si eres el único admin, debes asignar otro admin primero.',
    category: 'compartido',
    keywords: ['abandonar', 'salir', 'leave', 'dejar'],
    relatedScreens: ['TripMembers'],
  },
  {
    id: 'sincronizacion-realtime',
    question: '¿Cómo funciona la sincronización en tiempo real?',
    answer:
      'Cuando otro miembro añade/edita algo, verás los cambios automáticamente sin refrescar. Usa Firebase Firestore con listeners en tiempo real. Si no hay internet, los cambios se sincronizan cuando vuelvas a tener conexión.',
    category: 'compartido',
    keywords: ['sincronización', 'realtime', 'tiempo real', 'sync', 'automático'],
    relatedScreens: ['SharedTripDetail'],
  },
  {
    id: 'migrar-viaje',
    question: '¿Puedo convertir un viaje individual en compartido?',
    answer:
      'Sí, usa la función **Migrar a Firestore** en opciones del viaje. Esto subirá todos los datos (reservas, gastos, documentos) a la nube y lo convertirá en compartido.',
    category: 'compartido',
    keywords: ['migrar', 'convertir', 'individual', 'compartido', 'firestore'],
    relatedScreens: ['TripDetail'],
  },
];

const gastosLiquidacionesFAQs: FAQItem[] = [
  {
    id: 'registrar-gasto-individual',
    question: '¿Cómo registro un gasto individual?',
    answer:
      'Desde el detalle del viaje, tab **Gastos** → **+**. Completa:\n- Descripción\n- Monto y moneda\n- Categoría (transporte, alojamiento, comida, actividades, compras, otros)\n- Fecha\n- Opcionalmente: asociar a reserva o día específico',
    category: 'gastos',
    keywords: ['gasto', 'expense', 'registrar', 'añadir', 'individual'],
    relatedScreens: ['Expenses', 'AddExpense'],
  },
  {
    id: 'gasto-compartido',
    question: '¿Qué es un gasto compartido?',
    answer:
      'En viajes compartidos, puedes crear gastos que se reparten entre varios miembros. Por ejemplo: "Cena grupal" pagada por ti, repartida entre 4 personas.',
    category: 'gastos',
    keywords: ['gasto', 'compartido', 'shared', 'expense', 'reparto'],
    relatedScreens: ['SharedExpenses', 'AddSharedExpense'],
  },
  {
    id: 'metodos-reparto',
    question: '¿Qué métodos de reparto existen?',
    answer:
      'Viatio ofrece 4 métodos flexibles:\n1. **Partes iguales (equal)**: Divide el monto entre todos por igual\n2. **Montos exactos (exact)**: Especificas el monto exacto que debe cada uno\n3. **Porcentajes (percentage)**: Asignas % a cada miembro (ej: 60%-40%)\n4. **Partes/shares (shares)**: Asignas "partes" (ej: 2 partes, 1 parte) y calcula proporcionalmente',
    category: 'gastos',
    keywords: ['reparto', 'split', 'dividir', 'partes', 'porcentaje', 'exacto'],
    relatedScreens: ['AddSharedExpense'],
  },
  {
    id: 'ver-balances',
    question: '¿Cómo veo los balances entre miembros?',
    answer:
      'En **Gastos compartidos** → **Balances**. Verás quién debe a quién y cuánto. Los saldos se calculan automáticamente sumando todos los gastos y repartos.',
    category: 'gastos',
    keywords: ['balance', 'saldo', 'debe', 'balances', 'cuentas'],
    relatedScreens: ['SharedExpenses'],
  },
  {
    id: 'sugerencias-liquidacion',
    question: '¿Qué son las sugerencias de liquidación?',
    answer:
      'Viatio analiza los balances y te sugiere el mínimo número de transferencias para saldar todas las cuentas. Por ejemplo: "Ana paga 45€ a Carlos" en lugar de múltiples transacciones pequeñas.',
    category: 'gastos',
    keywords: ['liquidación', 'settlement', 'sugerencias', 'pagar', 'simplificar'],
    relatedScreens: ['TripSettlements'],
  },
  {
    id: 'registrar-pago',
    question: '¿Cómo registro un pago entre miembros?',
    answer:
      'En **Liquidaciones** → **Registrar pago**. Selecciona:\n- Quién paga\n- Quién recibe\n- Monto\n- Fecha\n- Notas (opcional)\n\nEl balance se actualiza automáticamente y el saldo se marca como completado.',
    category: 'gastos',
    keywords: ['pago', 'registrar', 'liquidación', 'settlement', 'completar'],
    relatedScreens: ['RecordSettlement'],
  },
  {
    id: 'filtrar-gastos',
    question: '¿Puedo filtrar gastos por categoría?',
    answer:
      'Sí, en la pantalla de Gastos usa el filtro por categoría. También puedes ver gráficos de distribución por categoría.',
    category: 'gastos',
    keywords: ['filtrar', 'categoría', 'filter', 'buscar', 'gráfico'],
    relatedScreens: ['Expenses'],
  },
  {
    id: 'comparar-presupuesto',
    question: '¿Cómo comparo gastos con el presupuesto?',
    answer:
      'En el detalle del viaje verás un indicador visual del presupuesto:\n- Verde: Dentro del presupuesto\n- Amarillo: Cerca del límite (>80%)\n- Rojo: Superado\n\nTambién muestra el monto restante.',
    category: 'gastos',
    keywords: ['presupuesto', 'budget', 'comparar', 'límite', 'indicador'],
    relatedScreens: ['TripDetail'],
  },
  {
    id: 'categorias-gastos',
    question: '¿Las categorías de gastos son personalizables?',
    answer:
      'Actualmente Viatio usa 6 categorías fijas alineadas con tipos de reservas. En futuras versiones se podrán crear categorías custom.',
    category: 'gastos',
    keywords: ['categorías', 'personalizar', 'custom', 'tipos'],
    relatedScreens: ['AddExpense'],
  },
];

const documentosFAQs: FAQItem[] = [
  {
    id: 'tipos-documentos',
    question: '¿Qué tipos de documentos puedo subir?',
    answer:
      'Soportamos:\n- PDFs (confirmaciones, billetes, seguros)\n- Imágenes (JPG, PNG) de pasaportes, visas, mapas, etc.\n- Límite: 10MB por archivo',
    category: 'documentos',
    keywords: ['documentos', 'tipos', 'PDF', 'imagen', 'subir', 'límite'],
    relatedScreens: ['TripDocuments', 'AddDocument'],
  },
  {
    id: 'subir-documento',
    question: '¿Cómo subo un documento?',
    answer:
      'Desde el detalle del viaje, tab **Documentos** → **+**. Elige:\n- Tomar foto con cámara\n- Seleccionar desde galería\n- Elegir PDF de archivos\n\nLuego asigna nombre, categoría y descripción.',
    category: 'documentos',
    keywords: ['subir', 'upload', 'documento', 'foto', 'PDF', 'galería'],
    relatedScreens: ['TripDocuments', 'AddDocument'],
  },
  {
    id: 'categorias-documentos',
    question: '¿Qué categorías de documentos hay?',
    answer:
      '- Identificación (pasaportes, DNI, visas)\n- Reservas y billetes\n- Seguros\n- Itinerarios\n- Mapas\n- Otros',
    category: 'documentos',
    keywords: ['categorías', 'tipos', 'documento', 'pasaporte', 'billete', 'seguro'],
    relatedScreens: ['TripDocuments'],
  },
  {
    id: 'ver-documentos-categoria',
    question: '¿Puedo ver documentos organizados por categoría?',
    answer:
      'Sí, en la pantalla de Documentos hay acordeones por categoría. Toca la categoría para ver solo esos documentos.',
    category: 'documentos',
    keywords: ['organizar', 'categoría', 'acordeón', 'filtrar', 'ver'],
    relatedScreens: ['TripDocuments'],
  },
  {
    id: 'editar-eliminar-documento',
    question: '¿Cómo edito o elimino un documento?',
    answer:
      '- **Editar metadatos**: Toca el documento → ícono de lápiz (puedes cambiar nombre, categoría, descripción)\n- **Eliminar**: Desliza hacia la izquierda → **Eliminar**, o desde el detalle → opciones → Eliminar',
    category: 'documentos',
    keywords: ['editar', 'eliminar', 'modificar', 'borrar', 'documento'],
    relatedScreens: ['TripDocuments', 'EditDocument'],
  },
  {
    id: 'sincronizar-documentos',
    question: '¿Los documentos se sincronizan en viajes compartidos?',
    answer:
      'Sí, todos los miembros pueden ver y subir documentos. Se almacenan en Firebase Storage y se sincronizan automáticamente.',
    category: 'documentos',
    keywords: ['sincronizar', 'compartido', 'storage', 'firebase', 'sync'],
    relatedScreens: ['TripDocuments'],
  },
  {
    id: 'descargar-documento',
    question: '¿Puedo descargar documentos a mi dispositivo?',
    answer:
      'Sí, desde el detalle del documento, usa la opción **Compartir/Descargar** para guardarlo en tu dispositivo.',
    category: 'documentos',
    keywords: ['descargar', 'download', 'guardar', 'compartir', 'export'],
    relatedScreens: ['TripDocuments'],
  },
];

const mapaLugaresFAQs: FAQItem[] = [
  {
    id: 'ver-mapa',
    question: '¿Cómo veo mis reservas en el mapa?',
    answer:
      'En el detalle del viaje, tab **Mapa**. Verás todas las ubicaciones de tus reservas marcadas con pins de colores según la categoría.',
    category: 'mapa',
    keywords: ['mapa', 'map', 'reservas', 'pins', 'ubicaciones'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'guardar-lugares',
    question: '¿Puedo guardar lugares de interés?',
    answer:
      'Sí, usa la búsqueda de lugares (powered by Google Places) y toca **Guardar lugar**. Aparecerá en el mapa con un pin especial.',
    category: 'mapa',
    keywords: ['guardar', 'lugar', 'interés', 'place', 'favorito'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'buscar-lugares',
    question: '¿Cómo busco lugares cercanos?',
    answer:
      'En el Mapa, usa la barra de búsqueda. Puedes buscar:\n- Por nombre: "Museo del Prado"\n- Por tipo: "restaurantes", "hoteles", "farmacias"\n- Por dirección\n\nLos resultados se muestran en el mapa con info detallada.',
    category: 'mapa',
    keywords: ['buscar', 'lugares', 'search', 'google places', 'cercanos'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'obtener-direcciones',
    question: '¿Cómo obtengo direcciones a un lugar?',
    answer:
      'Toca un marcador en el mapa → **Obtener direcciones**. Elige el modo de transporte:\n- Coche\n- Transporte público\n- A pie\n\nSe mostrará la ruta calculada por Google Directions API.',
    category: 'mapa',
    keywords: ['direcciones', 'ruta', 'directions', 'navegación', 'cómo llegar'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'abrir-navegacion',
    question: '¿Puedo abrir el lugar en mi app de navegación favorita?',
    answer:
      'Sí, desde el detalle del lugar toca **Navegar**. Se abrirá un modal para elegir entre:\n- Google Maps\n- Apple Maps (iOS)\n- Waze (si está instalado)',
    category: 'mapa',
    keywords: ['navegar', 'google maps', 'waze', 'apple maps', 'navegación'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'filtrar-dia',
    question: '¿Cómo veo los lugares de un día específico?',
    answer:
      'En el Mapa, filtra por día usando el selector de días. Solo se mostrarán las reservas y lugares de ese día.',
    category: 'mapa',
    keywords: ['filtrar', 'día', 'fecha', 'filter', 'selector'],
    relatedScreens: ['TripMap'],
  },
  {
    id: 'ruta-diaria',
    question: '¿Qué es una ruta diaria?',
    answer:
      'Si tienes múltiples lugares en un mismo día, puedes ver la ruta optimizada que conecta todos los puntos. Útil para planificar el recorrido del día.',
    category: 'mapa',
    keywords: ['ruta', 'diaria', 'optimizada', 'recorrido', 'itinerario'],
    relatedScreens: ['TripMap'],
  },
];

const copilotFAQs: FAQItem[] = [
  {
    id: 'que-es-copilot',
    question: '¿Qué es el Viatio Copilot?',
    answer:
      'Es tu asistente de viaje con IA (Gemini Flash). Puede:\n- Responder preguntas sobre tu viaje\n- Sugerir itinerarios personalizados\n- Buscar lugares según tus preferencias\n- Crear eventos en tu agenda\n- Dar recomendaciones contextuales\n- Ayudarte a planificar actividades',
    category: 'copilot',
    keywords: ['copilot', 'asistente', 'IA', 'AI', 'gemini', 'chat'],
    relatedScreens: ['Assistant'],
  },
  {
    id: 'acceder-copilot',
    question: '¿Cómo accedo al Copilot?',
    answer:
      '- **FAB flotante** (botón con ícono de IA) en múltiples pantallas\n- **Tab Copilot** en el detalle del viaje\n- **Pantalla standalone** desde el menú principal',
    category: 'copilot',
    keywords: ['acceder', 'abrir', 'FAB', 'botón', 'asistente'],
    relatedScreens: ['Assistant', 'TripDetail'],
  },
  {
    id: 'informacion-copilot',
    question: '¿Qué información tiene acceso el Copilot?',
    answer:
      'El Copilot conoce:\n- Fechas de tu viaje y destino\n- Reservas y agenda completa\n- Lugares guardados\n- Documentos\n- Tus preferencias de viaje configuradas\n- Restricciones alimentarias\n- Presupuesto',
    category: 'copilot',
    keywords: ['información', 'contexto', 'datos', 'acceso', 'privacidad'],
    relatedScreens: ['Assistant'],
  },
  {
    id: 'personalizar-tono',
    question: '¿Puedo personalizar el tono del Copilot?',
    answer:
      'Sí, en **Configuración del Copilot** elige:\n- **Profesional**: Respuestas formales y directas\n- **Amigable**: Conversacional y cercano\n- **Conciso**: Respuestas breves al grano',
    category: 'copilot',
    keywords: ['tono', 'personalizar', 'configuración', 'estilo', 'preferencias'],
    relatedScreens: ['CopilotSettings'],
  },
  {
    id: 'preferencias-viaje',
    question: '¿Cómo configuro mis preferencias de viaje?',
    answer:
      'En **Perfil** → **Copilot** → **Preferencias de viaje**:\n- **Ritmo**: Relajado, Balanceado, Intenso\n- **Intereses**: Cultura, gastronomía, naturaleza, aventura, playa, historia, arte, etc.\n- **Restricciones alimentarias**: Vegetariano, vegano, sin gluten, halal, kosher, etc.\n- **Movilidad**: Completa, limitada, silla de ruedas\n- **Presupuesto**: Económico, moderado, lujo\n- **Evitar**: Lista personalizada',
    category: 'copilot',
    keywords: ['preferencias', 'configurar', 'intereses', 'restricciones', 'personalizar'],
    relatedScreens: ['CopilotSettings'],
  },
  {
    id: 'acciones-copilot',
    question: '¿Qué acciones puede ejecutar el Copilot?',
    answer:
      'El Copilot puede proponer y ejecutar (con tu aprobación):\n- **create_agenda_item**: Añadir evento a tu agenda\n- **update_agenda_item**: Modificar evento existente\n- **delete_agenda_item**: Eliminar evento\n- **search_places**: Buscar lugares de interés\n- **get_directions**: Calcular ruta\n- **add_place_to_saved**: Guardar lugar\n- **suggest_itinerary**: Proponer itinerario completo\n- **navigate_to**: Llevarte a otra pantalla\n- **show_on_map**: Mostrar ubicación en mapa',
    category: 'copilot',
    keywords: ['acciones', 'ejecutar', 'comandos', 'funciones', 'capacidades'],
    relatedScreens: ['Assistant'],
  },
  {
    id: 'conversaciones-copilot',
    question: '¿El Copilot guarda conversaciones?',
    answer:
      'Sí, puedes ver el historial de conversaciones en **Conversaciones guardadas**. Cada conversación está asociada a un viaje específico y puedes retomarla cuando quieras.',
    category: 'copilot',
    keywords: ['conversaciones', 'historial', 'guardar', 'chat', 'historial'],
    relatedScreens: ['Assistant'],
  },
  {
    id: 'emojis-copilot',
    question: '¿Puedo usar emojis en las respuestas?',
    answer:
      'Sí, en la configuración del Copilot hay una opción **Usar emojis** que puedes activar/desactivar según tu preferencia.',
    category: 'copilot',
    keywords: ['emojis', 'emoticones', 'configuración', 'activar'],
    relatedScreens: ['CopilotSettings'],
  },
  {
    id: 'idiomas-copilot',
    question: '¿En qué idiomas funciona el Copilot?',
    answer:
      'El Copilot responde en el idioma configurado en tu app (español, inglés, francés, alemán, italiano, portugués) o puedes configurarlo para usar el idioma del dispositivo.',
    category: 'copilot',
    keywords: ['idiomas', 'language', 'multilingüe', 'español', 'inglés'],
    relatedScreens: ['CopilotSettings'],
  },
];

const notificacionesSyncFAQs: FAQItem[] = [
  {
    id: 'tipos-notificaciones',
    question: '¿Qué tipos de notificaciones puedo recibir?',
    answer:
      '- **Recordatorios de viaje**: X tiempo antes de la fecha de inicio\n- **Recordatorios de reserva**: X tiempo antes de cada reserva\n- **Actualizaciones de viajes compartidos**: Cuando otros miembros hacen cambios\n- **Alertas de documentos**: Si caduca un pasaporte o visa\n- **Resumen semanal**: Resumen de tus próximos viajes\n- **Promociones**: Novedades de Viatio (desactivables)',
    category: 'notificaciones',
    keywords: ['notificaciones', 'tipos', 'recordatorios', 'alertas', 'avisos'],
    relatedScreens: ['NotificationSettings'],
  },
  {
    id: 'configurar-avisos',
    question: '¿Cómo configuro los tiempos de aviso?',
    answer:
      'En **Perfil** → **Notificaciones**:\n- **Tiempo de aviso de viaje**: Desactivado, 1h, 3h, 1 día, 3 días, 1 semana\n- **Tiempo de aviso de reserva**: Mismas opciones\n\nCada tipo de notificación puede tener su propio tiempo de aviso.',
    category: 'notificaciones',
    keywords: ['configurar', 'tiempo', 'aviso', 'antes', 'recordatorio'],
    relatedScreens: ['NotificationSettings'],
  },
  {
    id: 'desactivar-notificaciones',
    question: '¿Puedo desactivar notificaciones específicas?',
    answer:
      'Sí, en la configuración de notificaciones puedes activar/desactivar cada tipo:\n- ✓/✗ Recordatorios de viaje\n- ✓/✗ Actualizaciones de reservas\n- ✓/✗ Alertas de documentos\n- ✓/✗ Resumen semanal\n- ✓/✗ Promociones',
    category: 'notificaciones',
    keywords: ['desactivar', 'desabilitar', 'apagar', 'disable', 'off'],
    relatedScreens: ['NotificationSettings'],
  },
  {
    id: 'uso-offline',
    question: '¿Puedo usar Viatio sin internet?',
    answer:
      '¡SÍ! Viatio funciona **offline-first**:\n- Todos tus viajes, reservas, gastos y documentos están en tu dispositivo (SQLite)\n- Puedes crear/editar/eliminar sin conexión\n- Los cambios se sincronizan automáticamente cuando tengas internet\n- Solo las funciones que requieren internet (OCR, búsqueda de lugares, Copilot) necesitan conexión',
    category: 'notificaciones',
    keywords: ['offline', 'sin internet', 'conexión', 'local', 'sqlite'],
    relatedScreens: ['TripList'],
  },
  {
    id: 'sincronizacion-automatica',
    question: '¿Cómo funciona la sincronización automática?',
    answer:
      '- **Viajes individuales**: Opcional, puedes activar backup en la nube\n- **Viajes compartidos**: Sincronización automática en tiempo real con Firestore\n- **Conflictos**: Si dos usuarios editan lo mismo, se resuelve por última modificación (last-write-wins)\n- **Delta sync**: Solo se sincronizan los cambios, no todo el viaje',
    category: 'notificaciones',
    keywords: ['sincronización', 'sync', 'automática', 'firestore', 'backup'],
    relatedScreens: ['SharedTripDetail'],
  },
  {
    id: 'conflictos-sync',
    question: '¿Qué pasa si hay conflictos de sincronización?',
    answer:
      'Viatio usa la estrategia "última modificación gana" (last-write-wins). Si dos usuarios editan la misma reserva, la versión más reciente se mantiene. Se notifica a los usuarios afectados del cambio.',
    category: 'notificaciones',
    keywords: ['conflictos', 'sincronización', 'resolver', 'last-write-wins', 'edición'],
    relatedScreens: ['SharedTripDetail'],
  },
];

// ===================================
// Categorías con sus FAQs
// ===================================

export const faqCategories: FAQCategory[] = [
  {
    id: 'inicio-config',
    title: 'Inicio y Configuración',
    icon: 'settings-outline',
    color: '#3B82F6', // blue
    faqs: inicioConfiguracionFAQs,
  },
  {
    id: 'viajes',
    title: 'Gestión de Viajes',
    icon: 'airplane-outline',
    color: '#10B981', // green
    faqs: gestionViajesFAQs,
  },
  {
    id: 'reservas',
    title: 'Reservas y Agenda',
    icon: 'calendar-outline',
    color: '#F59E0B', // amber
    faqs: reservasAgendaFAQs,
  },
  {
    id: 'compartido',
    title: 'Viajes Compartidos',
    icon: 'people-outline',
    color: '#8B5CF6', // purple
    faqs: viajesCompartidosFAQs,
  },
  {
    id: 'gastos',
    title: 'Gastos y Liquidaciones',
    icon: 'cash-outline',
    color: '#EF4444', // red
    faqs: gastosLiquidacionesFAQs,
  },
  {
    id: 'documentos',
    title: 'Documentos',
    icon: 'document-text-outline',
    color: '#6366F1', // indigo
    faqs: documentosFAQs,
  },
  {
    id: 'mapa',
    title: 'Mapa y Lugares',
    icon: 'map-outline',
    color: '#14B8A6', // teal
    faqs: mapaLugaresFAQs,
  },
  {
    id: 'copilot',
    title: 'Asistente Viatio Copilot',
    icon: 'sparkles-outline',
    color: '#EC4899', // pink
    faqs: copilotFAQs,
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones y Sincronización',
    icon: 'notifications-outline',
    color: '#F97316', // orange
    faqs: notificacionesSyncFAQs,
  },
];

// ===================================
// Utilidades
// ===================================

/**
 * Obtiene todas las FAQs en una lista plana
 */
export const getAllFAQs = (): FAQItem[] => {
  return faqCategories.flatMap((category) => category.faqs);
};

/**
 * Busca FAQs por término (en question, answer, keywords)
 */
export const searchFAQs = (query: string): FAQItem[] => {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  const allFAQs = getAllFAQs();

  return allFAQs.filter((faq) => {
    const matchesQuestion = faq.question.toLowerCase().includes(normalizedQuery);
    const matchesAnswer = faq.answer.toLowerCase().includes(normalizedQuery);
    const matchesKeywords = faq.keywords.some((keyword) =>
      keyword.toLowerCase().includes(normalizedQuery)
    );

    return matchesQuestion || matchesAnswer || matchesKeywords;
  });
};

/**
 * Obtiene una categoría por ID
 */
export const getCategoryById = (categoryId: string): FAQCategory | undefined => {
  return faqCategories.find((cat) => cat.id === categoryId);
};

/**
 * Obtiene un FAQ por ID
 */
export const getFAQById = (faqId: string): FAQItem | undefined => {
  return getAllFAQs().find((faq) => faq.id === faqId);
};
