import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { endpoints } from '@/shared/api/endpoints';
import { ApiError } from '@/shared/api/errors';
import { serverFetch } from '@/shared/api/server-client';
import { toAdminUser, type AdminUser } from '../adapters/user.adapter';

/** Verifica la sesión contra el backend (GET /auth/me) reenviando las cookies del navegador. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const cookie = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!cookie) return null;
  try {
    const raw = await serverFetch(endpoints.auth.me, { cookie });
    const user = toAdminUser(raw);
    return user.id && user.active ? user : null;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
});
