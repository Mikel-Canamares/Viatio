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

export { getReservaById, updateReserva } from './reservasService';

export {
  pickDocument,
  pickImage,
  readFileAsBase64,
  isImageFile,
  isPdfFile,
  formatFileSize,
  getFileExtension,
} from './fileService';
export type { DocumentInfo, ImageInfo } from './fileService';

export { extractReservaFromImage } from './ai/ocrService';
