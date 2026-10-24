import { asRecord, bool, optStr, str } from '@/shared/api/normalize';

export type AdminRole = 'admin' | 'editor';

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export function toAdminUser(raw: unknown): AdminUser {
  const r = asRecord(raw);
  const user = asRecord(r.user ?? raw);
  const role = str(user.role).toLowerCase();
  return {
    id: str(user.id),
    email: str(user.email),
    name: str(user.name, str(user.email)),
    role: role === 'admin' ? 'admin' : 'editor',
    active: bool(user.active ?? user.isActive, true),
    lastLoginAt: optStr(user.lastLoginAt),
    createdAt: optStr(user.createdAt),
  };
}

export function isAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === 'admin';
}
