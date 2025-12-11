import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const response: ApiError = {
    success: false,
    error: err.message || 'Error interno del servidor',
  };

  // En desarrollo, incluir más detalles
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      stack: err.stack,
      path: req.path,
      method: req.method,
    };
  }

  res.status(500).json(response);
}
