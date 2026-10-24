import { apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import type { Order } from '@/shared/types/domain';
import { toOrder } from '@/features/orders/adapters/order.adapter';
import type { CreateOrderRequest } from '../adapters/order-request';

export async function createOrder(request: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
  const raw = await apiRequest(endpoints.store.orders, { method: 'POST', body: request, idempotencyKey });
  return toOrder(raw);
}

export async function trackOrder(number: string, phone: string): Promise<Order> {
  const raw = await apiRequest(endpoints.store.trackOrder, { method: 'POST', body: { number, phone } });
  return toOrder(raw);
}
