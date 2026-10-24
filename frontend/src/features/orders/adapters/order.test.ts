import { describe, expect, it } from 'vitest';
import { toAdminOrderDetail } from '@/features/admin/orders/adapters/admin-order.adapter';
import { toOrder, toOrderStatus } from './order.adapter';

describe('order adapters', () => {
  it('mapea TrackingView (timeline con at)', () => {
    const o = toOrder({
      number: 'TB-001001',
      status: 'enviado',
      statusLabel: 'Enviado',
      createdAt: '2026-10-23T10:00:00Z',
      city: 'Cali',
      items: [{ productName: 'Celular', quantity: 2, lineTotal: 200, imageUrl: null }],
      total: 200,
      timeline: [{ status: 'nuevo', label: 'Nuevo', at: '2026-10-23T10:00:00Z' }],
    });
    expect(o.status).toBe('enviado');
    expect(o.customer.city).toBe('Cali');
    expect(o.items[0]).toMatchObject({ name: 'Celular', quantity: 2, subtotal: 200 });
    expect(o.history[0]).toMatchObject({ status: 'nuevo', createdAt: '2026-10-23T10:00:00Z' });
  });

  it('acepta alias de estados', () => {
    expect(toOrderStatus('CANCELLED')).toBe('cancelado');
    expect(toOrderStatus('desconocido')).toBe('nuevo');
  });

  it('mapea AdminOrderDetail con eventos y transiciones', () => {
    const d = toAdminOrderDetail({
      id: 'o1',
      number: 'TB-1',
      status: 'nuevo',
      customerName: 'Ana',
      phone: '3001234567',
      email: null,
      city: 'Cali',
      address: 'Calle 1',
      notes: 'Portería',
      subtotal: 10,
      shippingCost: 0,
      total: 10,
      itemsCount: 1,
      stockApplied: false,
      items: [{ productId: 'p', productName: 'X', sku: 'S', unitPrice: 10, quantity: 1, lineTotal: 10 }],
      events: [{ id: 'e', type: 'created', fromStatus: null, toStatus: 'nuevo', note: null, userName: null, createdAt: '2026-01-01' }],
      allowedTransitions: ['confirmado', 'cancelado'],
      whatsappUrl: 'https://wa.me/573001234567',
    });
    expect(d.customer).toMatchObject({ name: 'Ana', city: 'Cali', address: 'Calle 1', notes: 'Portería' });
    expect(d.allowedTransitions).toEqual(['confirmado', 'cancelado']);
    expect(d.events[0]?.type).toBe('created');
    expect(d.customerWhatsappUrl).toContain('wa.me');
  });
});
