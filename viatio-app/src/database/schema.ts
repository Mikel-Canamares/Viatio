/**
 * DATABASE SCHEMA
 *
 * Define las tablas y estructura de la base de datos SQLite.
 * Incluye migraciones y versionado del esquema.
 */

// ============================================
// VERSIÓN DEL ESQUEMA
// ============================================

export const CURRENT_SCHEMA_VERSION = 8;

// ============================================
// CREACIÓN DE TABLAS
// ============================================

const CREATE_VIAJES_TABLE = `
  CREATE TABLE IF NOT EXISTS viajes (
    id TEXT PRIMARY KEY NOT NULL,
    usuarioId TEXT NOT NULL,
    destino TEXT NOT NULL,
    destinoPlaceId TEXT,
    fechaInicio TEXT NOT NULL,
    fechaFin TEXT NOT NULL,
    descripcion TEXT,
    imagenUrl TEXT,
    presupuesto REAL,
    moneda TEXT DEFAULT 'EUR',
    numViajeros INTEGER DEFAULT 1,
    archived INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;

const CREATE_DIAS_VIAJE_TABLE = `
  CREATE TABLE IF NOT EXISTS dias_viaje (
    id TEXT PRIMARY KEY NOT NULL,
    viajeId TEXT NOT NULL,
    fecha TEXT NOT NULL,
    notas TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE
  );
`;

const CREATE_RESERVAS_TABLE = `
  CREATE TABLE IF NOT EXISTS reservas (
    id TEXT PRIMARY KEY NOT NULL,
    viajeId TEXT NOT NULL,
    diaId TEXT,
    categoria TEXT NOT NULL,
    nombre TEXT NOT NULL,
    proveedor TEXT,
    numeroConfirmacion TEXT,
    fechaInicio TEXT,
    horaInicio TEXT,
    fechaFin TEXT,
    horaFin TEXT,
    ubicacion TEXT,
    direccion TEXT,
    latitud REAL,
    longitud REAL,
    precio REAL,
    moneda TEXT DEFAULT 'EUR',
    estadoPago TEXT DEFAULT 'pending',
    notas TEXT,
    metadatos TEXT,
    documentoId TEXT,
    lugarId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE,
    FOREIGN KEY (diaId) REFERENCES dias_viaje(id) ON DELETE SET NULL,
    FOREIGN KEY (documentoId) REFERENCES documentos(id) ON DELETE SET NULL,
    FOREIGN KEY (lugarId) REFERENCES lugares(id) ON DELETE SET NULL
  );
`;

const CREATE_LUGARES_TABLE = `
  CREATE TABLE IF NOT EXISTS lugares (
    id TEXT PRIMARY KEY NOT NULL,
    viajeId TEXT NOT NULL,
    diaId TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    direccion TEXT,
    latitud REAL,
    longitud REAL,
    googlePlaceId TEXT,
    orden INTEGER DEFAULT 0,
    visitado INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE,
    FOREIGN KEY (diaId) REFERENCES dias_viaje(id) ON DELETE SET NULL
  );
`;

const CREATE_DOCUMENTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS documentos (
    id TEXT PRIMARY KEY NOT NULL,
    viajeId TEXT NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipoArchivo TEXT NOT NULL,
    rutaArchivo TEXT NOT NULL,
    tamano INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE
  );
`;

const CREATE_GASTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY NOT NULL,
    viajeId TEXT NOT NULL,
    diaId TEXT,
    reservaId TEXT,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    moneda TEXT DEFAULT 'EUR',
    fecha TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (viajeId) REFERENCES viajes(id) ON DELETE CASCADE,
    FOREIGN KEY (diaId) REFERENCES dias_viaje(id) ON DELETE SET NULL,
    FOREIGN KEY (reservaId) REFERENCES reservas(id) ON DELETE CASCADE
  );
`;

const CREATE_RESERVAS_DOCUMENTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS reservas_documentos (
    id TEXT PRIMARY KEY NOT NULL,
    reservaId TEXT NOT NULL,
    documentoId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (reservaId) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (documentoId) REFERENCES documentos(id) ON DELETE CASCADE,
    UNIQUE(reservaId, documentoId)
  );
`;

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL,
    appliedAt TEXT NOT NULL
  );
`;

export const CREATE_TABLES_SQL = [
  CREATE_VIAJES_TABLE,
  CREATE_DIAS_VIAJE_TABLE,
  CREATE_RESERVAS_TABLE,
  CREATE_LUGARES_TABLE,
  CREATE_DOCUMENTOS_TABLE,
  CREATE_GASTOS_TABLE,
  CREATE_RESERVAS_DOCUMENTOS_TABLE,
  CREATE_MIGRATIONS_TABLE,
];

// ============================================
// ÍNDICES
// ============================================

const INDEX_VIAJES_USUARIO = `
  CREATE INDEX IF NOT EXISTS idx_viajes_usuarioId
  ON viajes(usuarioId);
`;

const INDEX_VIAJES_FECHAS = `
  CREATE INDEX IF NOT EXISTS idx_viajes_fechas
  ON viajes(fechaInicio, fechaFin);
`;

const INDEX_VIAJES_ARCHIVED = `
  CREATE INDEX IF NOT EXISTS idx_viajes_archived
  ON viajes(archived);
`;

const INDEX_DIAS_VIAJE = `
  CREATE INDEX IF NOT EXISTS idx_dias_viajeId
  ON dias_viaje(viajeId);
`;

const INDEX_DIAS_FECHA = `
  CREATE INDEX IF NOT EXISTS idx_dias_fecha
  ON dias_viaje(fecha);
`;

const INDEX_RESERVAS_VIAJE = `
  CREATE INDEX IF NOT EXISTS idx_reservas_viajeId
  ON reservas(viajeId);
`;

const INDEX_RESERVAS_DIA = `
  CREATE INDEX IF NOT EXISTS idx_reservas_diaId
  ON reservas(diaId);
`;

const INDEX_RESERVAS_CATEGORIA = `
  CREATE INDEX IF NOT EXISTS idx_reservas_categoria
  ON reservas(categoria);
`;

const INDEX_LUGARES_VIAJE = `
  CREATE INDEX IF NOT EXISTS idx_lugares_viajeId
  ON lugares(viajeId);
`;

const INDEX_LUGARES_DIA = `
  CREATE INDEX IF NOT EXISTS idx_lugares_diaId
  ON lugares(diaId);
`;

const INDEX_DOCUMENTOS_VIAJE = `
  CREATE INDEX IF NOT EXISTS idx_documentos_viajeId
  ON documentos(viajeId);
`;

const INDEX_DOCUMENTOS_CATEGORIA = `
  CREATE INDEX IF NOT EXISTS idx_documentos_categoria
  ON documentos(categoria);
`;

const INDEX_GASTOS_VIAJE = `
  CREATE INDEX IF NOT EXISTS idx_gastos_viajeId
  ON gastos(viajeId);
`;

const INDEX_GASTOS_DIA = `
  CREATE INDEX IF NOT EXISTS idx_gastos_diaId
  ON gastos(diaId);
`;

const INDEX_GASTOS_FECHA = `
  CREATE INDEX IF NOT EXISTS idx_gastos_fecha
  ON gastos(fecha);
`;

const INDEX_GASTOS_CATEGORIA = `
  CREATE INDEX IF NOT EXISTS idx_gastos_categoria
  ON gastos(categoria);
`;

const INDEX_GASTOS_RESERVA = `
  CREATE INDEX IF NOT EXISTS idx_gastos_reservaId
  ON gastos(reservaId);
`;

const INDEX_LUGARES_GOOGLE_PLACE = `
  CREATE INDEX IF NOT EXISTS idx_lugares_googlePlaceId
  ON lugares(googlePlaceId);
`;

const INDEX_LUGARES_COORDS = `
  CREATE INDEX IF NOT EXISTS idx_lugares_coords
  ON lugares(latitud, longitud);
`;

const INDEX_RESERVAS_LUGAR = `
  CREATE INDEX IF NOT EXISTS idx_reservas_lugarId
  ON reservas(lugarId);
`;

const INDEX_RESERVAS_COORDS = `
  CREATE INDEX IF NOT EXISTS idx_reservas_coords
  ON reservas(latitud, longitud);
`;

const INDEX_RESERVAS_DOCUMENTOS_RESERVA = `
  CREATE INDEX IF NOT EXISTS idx_reservas_documentos_reservaId
  ON reservas_documentos(reservaId);
`;

const INDEX_RESERVAS_DOCUMENTOS_DOCUMENTO = `
  CREATE INDEX IF NOT EXISTS idx_reservas_documentos_documentoId
  ON reservas_documentos(documentoId);
`;

export const CREATE_INDEXES_SQL = [
  INDEX_VIAJES_USUARIO,
  INDEX_VIAJES_FECHAS,
  INDEX_VIAJES_ARCHIVED,
  INDEX_DIAS_VIAJE,
  INDEX_DIAS_FECHA,
  INDEX_RESERVAS_VIAJE,
  INDEX_RESERVAS_DIA,
  INDEX_RESERVAS_CATEGORIA,
  INDEX_RESERVAS_LUGAR,
  INDEX_RESERVAS_COORDS,
  INDEX_LUGARES_VIAJE,
  INDEX_LUGARES_DIA,
  INDEX_LUGARES_GOOGLE_PLACE,
  INDEX_LUGARES_COORDS,
  INDEX_DOCUMENTOS_VIAJE,
  INDEX_DOCUMENTOS_CATEGORIA,
  INDEX_GASTOS_VIAJE,
  INDEX_GASTOS_DIA,
  INDEX_GASTOS_FECHA,
  INDEX_GASTOS_CATEGORIA,
  INDEX_GASTOS_RESERVA,
  INDEX_RESERVAS_DOCUMENTOS_RESERVA,
  INDEX_RESERVAS_DOCUMENTOS_DOCUMENTO,
];
