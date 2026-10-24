import { adminApi } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { toQueryString } from '@/shared/lib/query-string';
import { toCustomersPage } from '../adapters/customer.adapter';

export const customersService = {
  list: async (f: { q?: string; page?: number; pageSize?: number }) =>
    toCustomersPage(await adminApi.get(`${endpoints.admin.customers}${toQueryString(f)}`)),
};
