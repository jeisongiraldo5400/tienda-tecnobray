import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

/**
 * Bloqueo por cuenta (además del límite por IP del throttler): tras 8 intentos
 * fallidos en 15 minutos, el correo queda bloqueado 15 minutos. En memoria por instancia.
 */
@Injectable()
export class LoginAttemptsService {
  private readonly failures = new Map<string, number[]>();

  assertNotLocked(email: string, now = Date.now()): void {
    const recent = this.recent(email, now);
    if (recent.length >= MAX_FAILURES) {
      throw new HttpException(
        'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  registerFailure(email: string, now = Date.now()): void {
    const recent = this.recent(email, now);
    recent.push(now);
    this.failures.set(email, recent);
    if (this.failures.size > 10_000) this.failures.clear();
  }

  reset(email: string): void {
    this.failures.delete(email);
  }

  private recent(email: string, now: number): number[] {
    return (this.failures.get(email) ?? []).filter((t) => now - t < WINDOW_MS);
  }
}
