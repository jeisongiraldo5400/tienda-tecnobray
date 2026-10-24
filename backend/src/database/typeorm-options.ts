import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { databaseSsl } from '../config/database-ssl';
import { ENTITIES } from './entities';

/** Opciones compartidas por la app Nest y la CLI de TypeORM. Nunca usa synchronize. */
export function buildTypeOrmOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    uuidExtension: 'pgcrypto',
    host: env.DB_HOST,
    port: Number(env.DB_PORT ?? 5432),
    database: env.DB_NAME,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    ssl: databaseSsl(env),
    entities: ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    logging: env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
    extra: { max: Number(env.DB_POOL_MAX ?? 10), application_name: 'tecnobray-tienda' },
  };
}
