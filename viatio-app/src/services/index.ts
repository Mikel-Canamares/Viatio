/**
 * SERVICES
 *
 * Lógica de negocio y conexión con APIs externas.
 * Servicios para Firebase Auth, Google Maps, Gemini AI, etc.
 *
 * Ejemplos: authService, mapsService, geminiService, etc.
 */

export {
  createViaje,
  getViajesByUsuario,
  getViajeById,
  updateViaje,
  deleteViaje,
  getViajeStats,
  repairViajesSinDias,
} from './viajesService';

export {
  archiveViaje,
  unarchiveViaje,
  autoArchiveFinishedTrips,
  deleteViajeFiles,
  deleteViajeCompletely,
  getViajeRelatedCounts,
} from './archiveService';

export { getReservaById, updateReserva } from './reservasService';

export {
  pickDocument,
  pickMultipleDocuments,
  pickImage,
  readFileAsBase64,
  isImageFile,
  isPdfFile,
  formatFileSize,
  getFileExtension,
} from './fileService';
export type { DocumentInfo, ImageInfo } from './fileService';

export { extractReservaFromImage } from './ai/ocrService';

export {
  createDocumento,
  getDocumentosByViajeId,
  getDocumentosByCategoria,
  getDocumentoById,
  getDocumentoUri,
  deleteDocumento,
  detectTipoArchivo,
} from './documentosService';

export {
  createGasto,
  getGastosByViajeId,
  getGastoById,
  getGastosByCategoria,
  updateGasto,
  deleteGasto,
  getResumenGastos,
} from './gastosService';
