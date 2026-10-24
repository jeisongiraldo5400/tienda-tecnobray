import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../src/database/typeorm-options';
import { initStorage } from '../src/scripts/storage-init';
import { applyE2eEnv } from './e2e-env';

/** Recrea el esquema de la BD de pruebas con las migraciones y prepara el bucket de MinIO. */
export default async function globalSetup(): Promise<void> {
  applyE2eEnv();
  const ds = new DataSource({ ...buildTypeOrmOptions(), dropSchema: true });
  try {
    await ds.initialize();
  } catch (err) {
    throw new Error(
      `No se pudo conectar a Postgres de pruebas (127.0.0.1:55440). ¿Corriste "docker compose --profile test up -d"? ${(err as Error).message}`,
      { cause: err },
    );
  }
  await ds.runMigrations({ transaction: 'all' });
  await ds.destroy();
  await initStorage();
}
