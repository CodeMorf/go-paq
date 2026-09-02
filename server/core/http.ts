import { NextFunction, Request, RequestHandler, Response } from 'express';
import crypto from 'crypto';

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id');
  const id = incoming && /^[a-zA-Z0-9._:-]{8,120}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('x-request-id', id);
  res.locals.requestId = id;
  next();
}

export function publicError(error: unknown): string {
  if (error instanceof Error && process.env.NODE_ENV !== 'production') return error.message;
  return 'Error interno del servidor GoPaq.';
}
