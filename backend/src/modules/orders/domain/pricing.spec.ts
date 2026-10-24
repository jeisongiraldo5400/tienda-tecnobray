import { formatCop, mergeItems, pricePlan, whatsappSummary, type PricingProduct } from './pricing';

const product = (over: Partial<PricingProduct> = {}): PricingProduct => ({
  id: 'p1',
  name: 'Nova A55',
  slug: 'nova-a55',
  sku: 'TB-1',
  price: 1_299_900,
  stock: 5,
  active: true,
  imageKey: null,
  ...over,
});

describe('pricing', () => {
  it('une líneas repetidas', () => {
    expect(mergeItems([{ productId: 'a', quantity: 1 }, { productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }])).toEqual([
      { productId: 'a', quantity: 3 },
      { productId: 'b', quantity: 1 },
    ]);
  });

  it('calcula totales con precios del servidor', () => {
    const r = pricePlan(
      [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 1 }],
      [product(), product({ id: 'p2', name: 'Cable', price: 39_900 })],
    );
    expect(r.problems).toEqual([]);
    expect(r.subtotal).toBe(2 * 1_299_900 + 39_900);
    expect(r.total).toBe(r.subtotal);
    expect(r.shippingCost).toBe(0);
    expect(r.itemsCount).toBe(3);
    expect(r.lines[0]).toMatchObject({ unitPrice: 1_299_900, quantity: 2, lineTotal: 2_599_800 });
  });

  it('reporta productos inexistentes, inactivos o sin stock', () => {
    const r = pricePlan(
      [
        { productId: 'x', quantity: 1 },
        { productId: 'p1', quantity: 9 },
        { productId: 'p3', quantity: 1 },
        { productId: 'p4', quantity: 1 },
      ],
      [product(), product({ id: 'p3', active: false }), product({ id: 'p4', stock: 0 })],
    );
    expect(r.lines).toHaveLength(0);
    expect(r.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'x', reason: 'unavailable' }),
        expect.objectContaining({ productId: 'p1', reason: 'insufficient_stock', maxQuantity: 5 }),
        expect.objectContaining({ productId: 'p3', reason: 'unavailable' }),
        expect.objectContaining({ productId: 'p4', reason: 'unavailable' }),
      ]),
    );
  });

  it('aplica el tope por producto', () => {
    const r = pricePlan([{ productId: 'p1', quantity: 11 }], [product({ stock: 100 })]);
    expect(r.problems[0]).toMatchObject({ reason: 'quantity_limit', maxQuantity: 10 });
  });

  it('formatea pesos colombianos sin decimales', () => {
    expect(formatCop(1_299_900)).toMatch(/^\$ ?1\.299\.900$/);
  });

  it('arma el resumen de WhatsApp', () => {
    const text = whatsappSummary({
      storeName: 'TecnoBray',
      number: 'TB-001001',
      customerName: 'Camila',
      city: 'Medellín',
      address: 'Cra 1',
      lines: [{ productName: 'Nova A55', quantity: 2, lineTotal: 2_599_800 }],
      total: 2_599_800,
    });
    expect(text).toContain('TB-001001');
    expect(text).toContain('2 x Nova A55');
    expect(text).toContain('Total:');
    expect(text).toContain('formas de pago');
  });
});
