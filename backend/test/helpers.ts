import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import sharp from 'sharp';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { hashPassword } from '../src/modules/users/domain/password';
import { Role } from '../src/modules/users/domain/role';
import { UserEntity } from '../src/modules/users/infrastructure/persistence/user.entity';
import { E2E_ENV } from './e2e-env';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return app;
}

export async function createUser(app: INestApplication, email: string, password: string, role: Role): Promise<void> {
  const repo = app.get(DataSource).getRepository(UserEntity);
  await repo.delete({ email });
  await repo.save(repo.create({ email, name: `Usuario ${role}`, role, active: true, passwordHash: await hashPassword(password) }));
}

export function cookieValue(res: request.Response, name: string): string | undefined {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  const found = (raw ?? []).find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split(';')[0].slice(name.length + 1)) : undefined;
}

/** Inicia sesión con un agente (guarda cookies) y devuelve el token CSRF vigente. */
export async function login(agent: ReturnType<typeof request.agent>, email: string, password: string): Promise<string> {
  const c = await agent.get('/api/auth/csrf').expect(200);
  const res = await agent.post('/api/auth/login').set('X-CSRF-Token', c.body.csrfToken).send({ email, password }).expect(200);
  return cookieValue(res, 'tb_csrf')!;
}

export const testPng = (w = 1200, h = 900) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#0f62fe' } }).png().toBuffer();

export function minioClient(): S3Client {
  return new S3Client({
    region: E2E_ENV.AWS_REGION,
    endpoint: E2E_ENV.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: E2E_ENV.AWS_ACCESS_KEY_ID, secretAccessKey: E2E_ENV.AWS_SECRET_ACCESS_KEY },
  });
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await minioClient().send(new HeadObjectCommand({ Bucket: E2E_ENV.S3_BUCKET_NAME, Key: `${E2E_ENV.S3_PREFIX}/${key}` }));
    return true;
  } catch {
    return false;
  }
}
