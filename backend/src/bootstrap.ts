import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { readAppConfig } from './config/app-config';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { CsrfMiddleware } from './common/security/csrf.middleware';

/** Configuración HTTP compartida por main.ts y las pruebas e2e. */
export function configureApp(app: INestApplication): void {
  const cfg = readAppConfig();
  const express = app as NestExpressApplication;
  express.set('trust proxy', cfg.trustProxy);
  express.disable('x-powered-by');
  express.useBodyParser('json', { limit: '1mb' });

  const apiHelmet = helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } });
  const docsHelmet = helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } });
  app.use((req: Request, res: Response, next: NextFunction) =>
    (req.path.startsWith('/docs') ? docsHelmet : apiHelmet)(req, res, next),
  );
  app.use(cookieParser());
  const csrf = new CsrfMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      csrf.use(req, res, next);
    } catch (err) {
      const e = err as { getStatus?: () => number; message: string };
      res.status(e.getStatus?.() ?? 403).json({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: e.message,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.enableCors({
    origin: cfg.frontendOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Idempotency-Key'],
    maxAge: 600,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const doc = new DocumentBuilder()
    .setTitle('TecnoBray API')
    .setDescription(
      'API de la tienda TecnoBray. Rutas /api/store/* públicas; /api/admin/* requieren sesión (cookie tb_at) ' +
        'y encabezado X-CSRF-Token igual a la cookie tb_csrf en métodos de escritura. Ver API.md.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('tb_at', { type: 'apiKey', in: 'cookie', name: 'tb_at' })
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, doc), {
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: 'TecnoBray API',
  });
}
