import { adminApi } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { toQueryString, type QueryValue } from '@/shared/lib/query-string';
import type { OrderStatus } from '@/shared/types/domain';
import { toAdminOrderDetail, toAdminOrdersPage } from '../adapters/admin-order.adapter';

export interface AdminOrderFilters {
  q?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const ordersService = {
  list: async (f: AdminOrderFilters) =>
    toAdminOrdersPage(await adminApi.get(`${endpoints.admin.orders}${toQueryString(f as Record<string, QueryValue>)}`)),
  get: async (id: string) => toAdminOrderDetail(await adminApi.get(endpoints.admin.order(id))),
  changeStatus: async (id: string, status: OrderStatus, note?: string) =>
    toAdminOrderDetail(await adminApi.patch(endpoints.admin.orderStatus(id), { status, ...(note ? { note } : {}) })),
  addNote: async (id: string, note: string) => toAdminOrderDetail(await adminApi.post(endpoints.admin.orderNotes(id), { note })),
};
