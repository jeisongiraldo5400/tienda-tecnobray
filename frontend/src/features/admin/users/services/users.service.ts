import { adminApi } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { arr, asRecord } from '@/shared/api/normalize';
import { toAdminUser, type AdminUser } from '@/features/admin/auth/adapters/user.adapter';
import type { toCreateUserPayload, toUpdateUserPayload } from '../adapters/users.schema';

export const usersService = {
  list: async (): Promise<AdminUser[]> => {
    const raw = await adminApi.get(endpoints.admin.users);
    return arr(Array.isArray(raw) ? raw : asRecord(raw).items).map(toAdminUser);
  },
  create: async (p: ReturnType<typeof toCreateUserPayload>) => toAdminUser(await adminApi.post(endpoints.admin.users, p)),
  update: async (id: string, p: Partial<ReturnType<typeof toUpdateUserPayload>>) => toAdminUser(await adminApi.patch(endpoints.admin.user(id), p)),
  remove: (id: string) => adminApi.delete<void>(endpoints.admin.user(id)),
};
