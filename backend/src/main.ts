import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { readAppConfig } from './config/app-config';

config({ quiet: true });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  configureApp(app);
  const cfg = readAppConfig();
  await app.listen(cfg.port, '0.0.0.0');
  Logger.log(`TecnoBray API escuchando en http://localhost:${cfg.port} (docs: /docs)`, 'Bootstrap');
}

bootstrap().catch((err: Error) => {
  // Fallo rápido con mensaje claro (p. ej. variables de entorno faltantes).
  console.error(`\n[TecnoBray] No se pudo iniciar el backend:\n${err.message}\n`);
  process.exit(1);
});
