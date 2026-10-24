import type { OrderStatus } from '../domain/order-status';
import type { OrderEventType } from '../infrastructure/persistence/order-event.entity';

export interface OrderItemView {
  productId: string | null;
  productName: string;
  productSlug: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderConfirmationView {
  number: string;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  customer: { name: string; phone: string; email: string | null; city: string; address: string };
  notes: string | null;
  items: OrderItemView[];
  subtotal: number;
  shippingCost: number;
  total: number;
  whatsappUrl: string | null;
  /** true si la respuesta corresponde a un reintento con la misma Idempotency-Key. */
  replayed: boolean;
}

export interface TrackingView {
  number: string;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  city: string;
  items: Array<{ productName: string; quantity: number; lineTotal: number; imageUrl: string | null }>;
  total: number;
  timeline: Array<{ status: OrderStatus; label: string; at: string }>;
}

export interface AdminOrderListItem {
  id: string;
  number: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export interface OrderEventView {
  id: string;
  type: OrderEventType;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  note: string | null;
  userName: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  address: string;
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  stockApplied: boolean;
  items: OrderItemView[];
  events: OrderEventView[];
  allowedTransitions: OrderStatus[];
  whatsappUrl: string | null;
  updatedAt: string;
}

export interface CustomerView {
  phone: string;
  name: string;
  email: string | null;
  city: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
}
