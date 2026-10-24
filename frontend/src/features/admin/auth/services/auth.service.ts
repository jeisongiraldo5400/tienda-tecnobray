import { apiRequest, setCsrfToken } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { toAdminUser, type AdminUser } from '../adapters/user.adapter';

/** Asegura la cookie CSRF (double-submit) antes de cualquier POST de autenticación. */
export async function ensureCsrf(): Promise<string | null> {
  const data = await apiRequest<{ csrfToken?: string }>(endpoints.auth.csrf);
  const token = data?.csrfToken ?? null;
  setCsrfToken(token);
  return token;
}

export async function login(email: string, password: string): Promise<AdminUser> {
  await ensureCsrf();
  const raw = await apiRequest(endpoints.auth.login, { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
  return toAdminUser(raw);
}

export async function logout(): Promise<void> {
  try {
    await apiRequest(endpoints.auth.logout, { method: 'POST' });
  } finally {
    setCsrfToken(null);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest(endpoints.auth.password, { method: 'PATCH', body: { currentPassword, newPassword }, auth: true });
}
