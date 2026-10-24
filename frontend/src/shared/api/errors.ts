import { asRecord, str } from './normalize';

export class ApiError extends Error {
  readonly status: number;
  /** Mensajes legibles (cuando `details` es una lista de textos). */
  readonly details: string[];
  /** `details` tal como lo envió el backend (p. ej. objetos de stock en 409). */
  readonly rawDetails: unknown;
  readonly code?: string;

  constructor(status: number, message: string, details: string[] = [], code?: string, rawDetails?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
    this.rawDetails = rawDetails;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Revisa los datos enviados.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'La información entra en conflicto con datos existentes.',
  413: 'El archivo es demasiado grande.',
  422: 'Revisa los datos enviados.',
  429: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
};

/** Convierte el cuerpo de error típico de NestJS ({statusCode, message, error}) en ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  const r = asRecord(body);
  const rawMessage = r.message;
  const source = Array.isArray(r.details) ? r.details : Array.isArray(rawMessage) ? rawMessage : [];
  const details = source.map((m) => (typeof m === 'string' ? m : '')).filter(Boolean);
  const message =
    (typeof rawMessage === 'string' && rawMessage) ||
    details[0] ||
    STATUS_MESSAGES[status] ||
    (status >= 500 ? 'Ocurrió un error en el servidor. Intenta más tarde.' : 'No se pudo completar la solicitud.');
  return new ApiError(status, message, details, str(r.code) || str(r.error) || undefined, r.details);
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) {
    if (error.message === 'Failed to fetch') return 'No hay conexión con el servidor.';
    return error.message;
  }
  return fallback;
}
