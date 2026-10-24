import { MAX_QTY_PER_ITEM, publicStock } from './stock-policy';

describe('publicStock', () => {
  it('nunca expone stock por encima del tope', () => {
    expect(publicStock(250)).toEqual({ inStock: true, maxQuantity: MAX_QTY_PER_ITEM });
  });
  it('limita al stock disponible si es menor', () => {
    expect(publicStock(3)).toEqual({ inStock: true, maxQuantity: 3 });
  });
  it('marca agotado si no hay stock o el producto está inactivo', () => {
    expect(publicStock(0)).toEqual({ inStock: false, maxQuantity: 0 });
    expect(publicStock(-2)).toEqual({ inStock: false, maxQuantity: 0 });
    expect(publicStock(20, false)).toEqual({ inStock: false, maxQuantity: 0 });
  });
});
