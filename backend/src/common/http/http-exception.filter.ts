import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Formato único de error:
 * { statusCode, error, message, details?, path, timestamp }
 * `message` es siempre un texto en español apto para mostrar al usuario.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.message)) {
          message = 'Hay datos inválidos en la solicitud.';
          details = b.message;
        } else if (typeof b.message === 'string') message = b.message;
        if (b.details !== undefined) details = b.details;
      }
      if (status === HttpStatus.TOO_MANY_REQUESTS) message = 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as QueryFailedError & { driverError?: { code?: string } }).driverError?.code;
      if (code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con ese valor único (slug, SKU o correo).';
      } else if (code === '23503') {
        status = HttpStatus.CONFLICT;
        message = 'El registro está en uso por otros datos y no se puede eliminar.';
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      ...(details !== undefined ? { details } : {}),
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
