import { allowedTransitions, canTransition, OrderStatus, stockEffect } from './order-status';

describe('order-status', () => {
  it('permite el flujo nuevo → confirmado → enviado → entregado', () => {
    expect(canTransition(OrderStatus.Nuevo, OrderStatus.Confirmado)).toBe(true);
    expect(canTransition(OrderStatus.Confirmado, OrderStatus.Enviado)).toBe(true);
    expect(canTransition(OrderStatus.Enviado, OrderStatus.Entregado)).toBe(true);
  });

  it('no permite saltos ni salir de estados finales', () => {
    expect(canTransition(OrderStatus.Nuevo, OrderStatus.Enviado)).toBe(false);
    expect(canTransition(OrderStatus.Nuevo, OrderStatus.Entregado)).toBe(false);
    expect(allowedTransitions(OrderStatus.Entregado)).toEqual([]);
    expect(allowedTransitions(OrderStatus.Cancelado)).toEqual([]);
  });

  it('permite cancelar desde nuevo, confirmado y enviado', () => {
    for (const s of [OrderStatus.Nuevo, OrderStatus.Confirmado, OrderStatus.Enviado]) {
      expect(canTransition(s, OrderStatus.Cancelado)).toBe(true);
    }
  });

  it('descuenta stock al confirmar y lo repone al cancelar solo si estaba aplicado', () => {
    expect(stockEffect(OrderStatus.Confirmado, false)).toBe('decrement');
    expect(stockEffect(OrderStatus.Confirmado, true)).toBe('none');
    expect(stockEffect(OrderStatus.Cancelado, true)).toBe('restore');
    expect(stockEffect(OrderStatus.Cancelado, false)).toBe('none');
    expect(stockEffect(OrderStatus.Enviado, true)).toBe('none');
  });
});
