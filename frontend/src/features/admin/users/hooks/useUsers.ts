'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '@/features/admin/auth/adapters/user.adapter';
import { toCreateUserPayload, toUpdateUserPayload, type UserFormValues } from '../adapters/users.schema';
import { usersService } from '../services/users.service';

const key = ['admin', 'users'] as const;

export function useAdminUsers() {
  return useQuery({ queryKey: key, queryFn: usersService.list });
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id?: string; values: UserFormValues }>({
    mutationFn: ({ id, values }) => (id ? usersService.update(id, toUpdateUserPayload(values)) : usersService.create(toCreateUserPayload(values))),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => usersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
