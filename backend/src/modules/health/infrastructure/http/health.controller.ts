import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

@ApiTags('Salud')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  async health(): Promise<{ status: 'ok'; db: 'ok' | 'error'; time: string }> {
    let db: 'ok' | 'error' = 'ok';
    try {
      await this.ds.query('SELECT 1');
    } catch {
      db = 'error';
    }
    return { status: 'ok', db, time: new Date().toISOString() };
  }
}
