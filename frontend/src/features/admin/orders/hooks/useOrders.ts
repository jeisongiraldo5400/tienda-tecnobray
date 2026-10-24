'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus } from '@/shared/types/domain';
import type { AdminOrderDetail } from '../adapters/admin-order.adapter';
import { ordersService, type AdminOrderFilters } from '../services/orders.service';

export const orderKeys = {
  all: ['admin', 'orders'] as const,
  list: (f: AdminOrderFilters) => ['admin', 'orders', 'list', f] as const,
  detail: (id: string) => ['admin', 'orders', 'detail', id] as const,
};

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery({ queryKey: orderKeys.list(filters), queryFn: () => ordersService.list(filters), placeholderData: keepPreviousData });
}

export function useAdminOrder(id: string) {
  return useQuery({ queryKey: orderKeys.detail(id), queryFn: () => ordersService.get(id) });
}

function useOrderMutation<V>(id: string, fn: (v: V) => Promise<AdminOrderDetail>) {
  const qc = useQueryClient();
  return useMutation<AdminOrderDetail, Error, V>({
    mutationFn: fn,
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(id), order);
      qc.invalidateQueries({ queryKey: [...orderKeys.all, 'list'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useChangeOrderStatus(id: string) {
  return useOrderMutation<{ status: OrderStatus; note?: string }>(id, ({ status, note }) => ordersService.changeStatus(id, status, note));
}

export function useAddOrderNote(id: string) {
  return useOrderMutation<string>(id, (note) => ordersService.addNote(id, note));
}
