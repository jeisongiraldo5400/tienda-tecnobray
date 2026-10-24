import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '@/features/cart/store/cart.store';
import { cartProduct, jsonResponse } from '@/test/fixtures';
import { CheckoutView } from './CheckoutView';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }) }));

function renderView() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CheckoutView />
    </QueryClientProvider>,
  );
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre completo/), 'Camila Restrepo');
  await user.type(screen.getByLabelText(/^Celular/), '300 123 4567');
  await user.type(screen.getByLabelText(/^Ciudad/), 'Medellín');
  await user.type(screen.getByLabelText(/^Dirección/), 'Cra 43A # 1-50');
  await user.click(screen.getByRole('checkbox'));
}

describe('CheckoutView (flujo de compra)', () => {
  beforeEach(() => {
    push.mockReset();
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('muestra estado vacío sin productos', () => {
    renderView();
    expect(screen.getByText('No hay productos para pagar')).toBeInTheDocument();
  });

  it('valida el formulario antes de enviar', async () => {
    useCartStore.getState().addItem(cartProduct(), 1);
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar los términos y la política de datos.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('crea el pedido con Idempotency-Key, vacía el carrito y redirige a la confirmación', async () => {
    useCartStore.getState().addItem(cartProduct(), 2);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { number: 'TB-001001', status: 'nuevo', items: [], subtotal: 2000000, shippingCost: 0, total: 2000000, customer: { name: 'Camila' } },
        { status: 201 },
      ),
    );
    const user = userEvent.setup();
    renderView();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pedido/confirmacion?numero=TB-001001'));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/bff/store/orders');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['idempotency-key']).toMatch(/^[A-Za-z0-9-]{8,}$/);
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      customer: { name: 'Camila Restrepo', phone: '3001234567', city: 'Medellín', address: 'Cra 43A # 1-50' },
      items: [{ productId: 'p1', quantity: 2 }],
    });
    expect(useCartStore.getState().items).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem('tecnobray-last-order') ?? '{}').number).toBe('TB-001001');
  });

  it('reutiliza la misma Idempotency-Key al reintentar tras un error de red', async () => {
    useCartStore.getState().addItem(cartProduct(), 1);
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ number: 'TB-9', status: 'nuevo', items: [], total: 1 }, { status: 201 }));
    const user = userEvent.setup();
    renderView();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByText('No hay conexión con el servidor.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    const key = (i: number) => ((fetchMock.mock.calls[i]![1] as RequestInit).headers as Record<string, string>)['idempotency-key'];
    expect(key(0)).toBe(key(1));
  });

  it('ajusta el carrito cuando el backend responde 409 por stock', async () => {
    useCartStore.getState().addItem(cartProduct(), 5);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { statusCode: 409, message: 'Algunos productos no tienen stock suficiente.', details: [{ productId: 'p1', reason: 'insufficient_stock', maxQuantity: 2 }] },
        { status: 409 },
      ),
    );
    const user = userEvent.setup();
    renderView();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByText(/solo hay 2 unidades disponibles/)).toBeInTheDocument();
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(push).not.toHaveBeenCalled();
  });
});
