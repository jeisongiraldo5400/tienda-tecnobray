import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

/**
 * Configuración de las pruebas E2E.
 *
 * Las credenciales del administrador se leen de `backend/.env` (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
 * y los secretos del BFF de `frontend/.env.local`. Nunca se imprimen ni se escriben en los reportes.
 * Cualquier valor puede sobrescribirse con variables de entorno (E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD…).
 */
const FRONTEND_DIR = path.resolve(__dirname, '..', '..');
const BACKEND_ENV = process.env.E2E_BACKEND_ENV_FILE ?? path.resolve(FRONTEND_DIR, '..', 'backend', '.env');
const FRONTEND_ENV = path.resolve(FRONTEND_DIR, '.env.local');

function readEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  return parseEnv(readFileSync(file, 'utf8')) as Record<string, string>;
}

const backendEnv = readEnvFile(BACKEND_ENV);
const frontendEnv = readEnvFile(FRONTEND_ENV);

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Falta ${name} (defínelo en backend/.env o como variable de entorno).`);
  return value;
}

export const E2E = {
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3002',
  /** Backend directo (solo para sembrar/limpiar datos de prueba desde Node). */
  apiURL: (process.env.E2E_API_URL ?? frontendEnv.API_BASE_URL ?? 'http://127.0.0.1:4001').replace(/\/+$/, ''),
  apiPrefix: frontendEnv.API_PREFIX ?? '/api',
  get adminEmail(): string {
    return required(process.env.E2E_ADMIN_EMAIL ?? backendEnv.SEED_ADMIN_EMAIL, 'SEED_ADMIN_EMAIL');
  },
  get adminPassword(): string {
    return required(process.env.E2E_ADMIN_PASSWORD ?? backendEnv.SEED_ADMIN_PASSWORD, 'SEED_ADMIN_PASSWORD');
  },
  /** Mismo secreto que usa el BFF de Next con el backend (servidor a servidor). */
  get bffSecret(): string {
    return process.env.BFF_SHARED_SECRET ?? frontendEnv.BFF_SHARED_SECRET ?? backendEnv.BFF_SHARED_SECRET ?? '';
  },
  csrfCookie: frontendEnv.NEXT_PUBLIC_CSRF_COOKIE || 'tb_csrf',
  csrfHeader: frontendEnv.NEXT_PUBLIC_CSRF_HEADER || 'x-csrf-token',
  adminStorageState: path.resolve(FRONTEND_DIR, 'e2e', '.auth', 'admin.json'),
} as const;

/** Prefijo obligatorio de todo dato creado por las pruebas (higiene de la BD compartida). */
export const E2E_PREFIX = 'E2E ';
export const E2E_CUSTOMER = 'E2E Prueba';
/** Celular ficticio para los pedidos de prueba (agrupa al cliente "E2E Prueba"). */
export const E2E_PHONE = '3009990001';

/** Sufijo único por ejecución para evitar colisiones de slug/SKU entre corridas. */
export const RUN_ID = (process.env.E2E_RUN_ID ??= Date.now().toString(36));
