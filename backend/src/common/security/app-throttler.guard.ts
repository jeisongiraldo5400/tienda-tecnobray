import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { clientIp, isTrustedBff } from './client-ip';

/**
 * Throttler que identifica al cliente por su IP real también detrás del BFF del frontend.
 * Las llamadas del BFF sin IP de cliente (render en servidor / ISR) no se limitan.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    return clientIp(req as unknown as Request) ?? 'bff-server';
  }

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (isTrustedBff(req) && clientIp(req) === null) return true;
    return super.shouldSkip(context);
  }
}
