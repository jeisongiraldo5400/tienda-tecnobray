import { describe, expect, it } from 'vitest';
import type { CartItem } from '@/features/cart/store/cart.store';
import { toOrder } from '@/features/orders/adapters/order.adapter';
import { checkoutSchema, initialCheckoutValues, isValidColombianPhone, normalizeColombianPhone } from './checkout.schema';
import { buildOrderWhatsAppMessage, orderFingerprint, toCreateOrderRequest } from './order-request';
import { applyStockConflicts, parseStockConflicts } from './stock-conflicts';

const items: CartItem[] = [
  { productId: 'a', slug: 'a', name: 'Celular A', price: 1000, stock: 10, quantity: 2 },
  { productId: 'b', slug: 'b', name: 'Cargador B', price: 500, stock: 10, quantity: 3 },
];

describe('validación de teléfono colombiano', () => {
  it.each([
    ['300 123 4567', true],
    ['+57 300 123 4567', true],
    ['573001234567', true],
    ['601 234 5678', true],
    ['12345', false],
    ['2001234567', false],
    ['', false],
  ])('%s → %s', (value, ok) => {
    expect(isValidColombianPhone(value)).toBe(ok);
  });

  it('normaliza quitando el indicativo', () => {
    expect(normalizeColombianPhone('+57 (300) 123-4567')).toBe('3001234567');
  });
});

describe('checkoutSchema', () => {
  it('exige los campos obligatorios y aceptar términos', async () => {
    await expect(checkoutSchema.validate(initialCheckoutValues, { abortEarly: false })).rejects.toMatchObject({
      errors: expect.arrayContaining([
        'El nombre es obligatorio.',
        'El celular es obligatorio.',
        'La ciudad es obligatoria.',
        'La dirección es obligatoria.',
        'Debes aceptar los términos y la política de datos.',
      ]),
    });
  });

  it('acepta un pedido válido con correo opcional vacío', async () => {
    const values = { ...initialCheckoutValues, name: 'Ana Pérez', phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', acceptTerms: true };
    await expect(checkoutSchema.validate(values)).resolves.toBeTruthy();
  });

  it('rechaza correos inválidos', async () => {
    const values = { ...initialCheckoutValues, name: 'Ana Pérez', phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', acceptTerms: true, email: 'no-es-correo' };
    await expect(checkoutSchema.validate(values)).rejects.toThrow('Ingresa un correo válido.');
  });
});

describe('toCreateOrderRequest', () => {
  it('envía solo ids y cantidades (sin precios) y las notas dentro de customer', () => {
    const req = toCreateOrderRequest(
      { name: ' Ana ', phone: '300 123 4567', email: '', city: 'Cali ', address: ' Calle 1 ', notes: ' Portería ', acceptTerms: true },
      items,
    );
    expect(req).toEqual({
      customer: { name: 'Ana', phone: '3001234567', city: 'Cali', address: 'Calle 1', notes: 'Portería' },
      items: [
        { productId: 'a', quantity: 2 },
        { productId: 'b', quantity: 3 },
      ],
    });
    expect(JSON.stringify(req)).not.toContain('price');
  });

  it('la huella cambia si cambia el pedido', () => {
    const v = { name: 'Ana', phone: '3001234567', email: '', city: 'Cali', address: 'Calle 1', notes: '', acceptTerms: true };
    const a = orderFingerprint(toCreateOrderRequest(v, items));
    const b = orderFingerprint(toCreateOrderRequest(v, items.slice(0, 1)));
    expect(a).not.toBe(b);
    expect(a).toBe(orderFingerprint(toCreateOrderRequest(v, items)));
  });
});

describe('mensaje de WhatsApp del pedido', () => {
  it('incluye número, ítems y total en COP', () => {
    const order = toOrder({
      number: 'TB-001001',
      status: 'nuevo',
      customer: { name: 'Ana', phone: '3001234567', city: 'Cali', address: 'Calle 1' },
      items: [{ productId: 'a', productName: 'Celular A', unitPrice: 1000000, quantity: 1, lineTotal: 1000000 }],
      subtotal: 1000000,
      shippingCost: 0,
      total: 1000000,
    });
    const msg = buildOrderWhatsAppMessage(order, 'TecnoBray');
    expect(msg).toContain('#TB-001001');
    expect(msg).toContain('1 × Celular A');
    expect(msg).toContain('$ 1.000.000');
    expect(msg).toContain('formas de pago');
  });
});

describe('conflictos de stock (409)', () => {
  it('quita no disponibles y ajusta cantidades', () => {
    const conflicts = parseStockConflicts([
      { productId: 'a', reason: 'insufficient_stock', maxQuantity: 1, name: 'Celular A' },
      { productId: 'b', reason: 'unavailable' },
      'texto',
    ]);
    const res = applyStockConflicts(items, conflicts);
    expect(res.items).toEqual([{ ...items[0], quantity: 1, stock: 1 }]);
    expect(res.messages).toHaveLength(2);
    expect(res.messages[1]).toContain('ya no está disponible');
  });
});
