import { asRecord, num, optStr, str, toPaginated } from '@/shared/api/normalize';
import type { Paginated } from '@/shared/types/domain';

export interface Customer {
  phone: string;
  name: string;
  email?: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
}

export function toCustomer(raw: unknown): Customer {
  const r = asRecord(raw);
  return {
    phone: str(r.phone),
    name: str(r.name),
    email: optStr(r.email),
    city: str(r.city),
    ordersCount: num(r.ordersCount),
    totalSpent: num(r.totalSpent),
    firstOrderAt: optStr(r.firstOrderAt),
    lastOrderAt: optStr(r.lastOrderAt),
  };
}

export function toCustomersPage(raw: unknown): Paginated<Customer> {
  return toPaginated(raw, toCustomer);
}
