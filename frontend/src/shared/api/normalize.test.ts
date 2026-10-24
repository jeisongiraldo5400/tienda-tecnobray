import { describe, expect, it } from 'vitest';
import { toApiError } from './errors';
import { num, toPaginated, unwrap } from './normalize';

describe('normalize', () => {
  it('toPaginated acepta {items,total,page,pageSize,totalPages}', () => {
    const p = toPaginated({ items: [1, 2], total: 30, page: 2, pageSize: 2, totalPages: 15 }, (x) => Number(x) * 10);
    expect(p).toEqual({ items: [10, 20], total: 30, page: 2, limit: 2, totalPages: 15 });
  });

  it('toPaginated acepta arreglos planos y {data, meta}', () => {
    expect(toPaginated([1], String).items).toEqual(['1']);
    expect(toPaginated({ data: [1, 2, 3], meta: { total: 9, page: 1, limit: 3 } }, Number).totalPages).toBe(3);
  });

  it('num convierte strings numéricos', () => {
    expect(num('1299900')).toBe(1299900);
    expect(num('abc', 7)).toBe(7);
  });

  it('unwrap solo desenvuelve envoltorios {data}', () => {
    expect(unwrap({ data: { a: 1 } })).toEqual({ a: 1 });
    expect(unwrap({ data: 1, items: [] })).toEqual({ data: 1, items: [] });
  });
});

describe('toApiError', () => {
  it('usa el mensaje en español del backend y conserva details', () => {
    const e = toApiError(409, { statusCode: 409, message: 'Stock insuficiente', details: [{ productId: 'p' }] });
    expect(e.message).toBe('Stock insuficiente');
    expect(e.rawDetails).toEqual([{ productId: 'p' }]);
  });

  it('details de validación como textos', () => {
    const e = toApiError(400, { message: 'Hay datos inválidos en la solicitud.', details: ['sku inválido'] });
    expect(e.details).toEqual(['sku inválido']);
  });

  it('mensaje por defecto según el estado', () => {
    expect(toApiError(500, null).message).toMatch(/servidor/);
    expect(toApiError(403, {}).message).toMatch(/permisos/);
  });
});
