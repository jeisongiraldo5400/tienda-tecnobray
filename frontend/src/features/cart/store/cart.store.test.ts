import { beforeEach, describe, expect, it } from 'vitest';
import { cartProduct } from '@/test/fixtures';
import { MAX_QTY_PER_ITEM, selectCount, selectSavings, selectSubtotal, useCartStore } from './cart.store';

const state = () => useCartStore.getState();

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
    localStorage.clear();
  });

  it('agrega productos y suma cantidades del mismo producto', () => {
    state().addItem(cartProduct(), 2);
    state().addItem(cartProduct(), 1);
    expect(state().items).toHaveLength(1);
    expect(state().items[0]?.quantity).toBe(3);
    expect(selectCount(state())).toBe(3);
    expect(selectSubtotal(state())).toBe(3_000_000);
    expect(selectSavings(state())).toBe(600_000);
  });

  it('respeta el stock disponible y el tope por producto', () => {
    state().addItem(cartProduct({ stock: 3 }), 5);
    expect(state().items[0]?.quantity).toBe(3);
    state().addItem(cartProduct({ productId: 'p2', stock: 100 }), 50);
    expect(state().items.find((i) => i.productId === 'p2')?.quantity).toBe(MAX_QTY_PER_ITEM);
  });

  it('no agrega productos agotados', () => {
    state().addItem(cartProduct({ stock: 0 }));
    expect(state().items).toHaveLength(0);
  });

  it('setQuantity limita al rango y elimina con 0', () => {
    state().addItem(cartProduct({ stock: 4 }));
    state().setQuantity('p1', 9);
    expect(state().items[0]?.quantity).toBe(4);
    state().setQuantity('p1', 0);
    expect(state().items).toHaveLength(0);
  });

  it('removeItem, clear y replaceItems', () => {
    state().addItem(cartProduct());
    state().addItem(cartProduct({ productId: 'p2' }));
    state().removeItem('p1');
    expect(state().items.map((i) => i.productId)).toEqual(['p2']);
    state().replaceItems([{ ...cartProduct({ productId: 'p3' }), quantity: 2 }]);
    expect(selectCount(state())).toBe(2);
    state().clear();
    expect(state().items).toEqual([]);
  });

  it('persiste solo los ítems en localStorage', () => {
    state().addItem(cartProduct());
    state().open();
    const saved = JSON.parse(localStorage.getItem('tecnobray-cart') ?? '{}');
    expect(saved.state.items).toHaveLength(1);
    expect(saved.state.isOpen).toBeUndefined();
  });
});
