import { arr, asRecord, bool, num, optStr, str, toPaginated } from '@/shared/api/normalize';
import type { Order, OrderStatus, Paginated } from '@/shared/types/domain';
import { toOrder, toOrderStatus } from '@/features/orders/adapters/order.adapter';

export interface AdminOrderListItem {
  id: string;
  number: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export interface AdminOrderEvent {
  id: string;
  type: 'created' | 'status_change' | 'note' | string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  note?: string;
  userName?: string;
  createdAt: string;
}

export interface AdminOrderDetail extends Order {
  itemsCount: number;
  stockApplied: boolean;
  events: AdminOrderEvent[];
  allowedTransitions: OrderStatus[];
  customerWhatsappUrl?: string;
}

export function toAdminOrderListItem(raw: unknown): AdminOrderListItem {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    number: str(r.number),
    status: toOrderStatus(r.status),
    customerName: str(r.customerName ?? asRecord(r.customer).name),
    phone: str(r.phone ?? asRecord(r.customer).phone),
    email: optStr(r.email ?? asRecord(r.customer).email),
    city: str(r.city ?? asRecord(r.customer).city),
    total: num(r.total),
    itemsCount: num(r.itemsCount, arr(r.items).length),
    createdAt: str(r.createdAt),
  };
}

export function toAdminOrdersPage(raw: unknown): Paginated<AdminOrderListItem> {
  return toPaginated(raw, toAdminOrderListItem);
}

function toEvent(raw: unknown): AdminOrderEvent {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    type: str(r.type, 'note'),
    fromStatus: r.fromStatus ? toOrderStatus(r.fromStatus) : null,
    toStatus: r.toStatus ? toOrderStatus(r.toStatus) : null,
    note: optStr(r.note),
    userName: optStr(r.userName),
    createdAt: str(r.createdAt),
  };
}

export function toAdminOrderDetail(raw: unknown): AdminOrderDetail {
  const r = asRecord(raw);
  const base = toOrder(raw);
  return {
    ...base,
    customer: {
      ...base.customer,
      name: str(r.customerName, base.customer.name),
      phone: str(r.phone, base.customer.phone),
      email: optStr(r.email) ?? base.customer.email,
      city: str(r.city, base.customer.city),
      address: str(r.address, base.customer.address),
    },
    itemsCount: num(r.itemsCount, base.items.length),
    stockApplied: bool(r.stockApplied),
    events: arr(r.events)
      .map(toEvent)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    allowedTransitions: arr(r.allowedTransitions).map(toOrderStatus),
    customerWhatsappUrl: optStr(r.whatsappUrl),
  };
}
