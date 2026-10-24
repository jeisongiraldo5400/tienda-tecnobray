import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/fixtures';
import { ProductForm } from './ProductForm';
import { moveItem } from './ProductImagesManager';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

function mockBackend() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.endsWith('/admin/categories')) return jsonResponse([{ id: 'c1', name: 'Celulares', slug: 'celulares', parentId: null, active: true }]);
    if (url.endsWith('/admin/brands')) return jsonResponse([{ id: 'b1', name: 'Nova', slug: 'nova', active: true }]);
    if (url.endsWith('/admin/products') && init?.method === 'POST') {
      return jsonResponse({ id: 'new-id', ...JSON.parse(String(init.body)), images: [] }, { status: 201 });
    }
    return jsonResponse({}, { status: 404 });
  });
}

describe('ProductForm (admin)', () => {
  beforeEach(() => replace.mockReset());

  it('muestra errores de validación y no envía', async () => {
    const fetchMock = mockBackend();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProductForm />
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El SKU es obligatorio.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('crea el producto con el payload correcto y navega a la edición', async () => {
    const fetchMock = mockBackend();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProductForm />
      </QueryClientProvider>,
    );
    await user.type(screen.getByLabelText(/^Nombre/), 'Celular Nova X');
    await user.type(screen.getByLabelText(/^SKU/), 'TB-CEL-001');
    await user.type(screen.getByLabelText(/Precio de venta/), '1299900');
    await user.clear(screen.getByLabelText(/Stock disponible/));
    await user.type(screen.getByLabelText(/Stock disponible/), '7');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Celulares' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.click(screen.getByRole('button', { name: 'Agregar especificación' }));
    await user.type(screen.getByLabelText('Nombre 1'), 'Pantalla');
    await user.type(screen.getByLabelText('Valor 1'), '6,5 pulgadas');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/productos/new-id'));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(post[0]).toBe('/api/bff/admin/products');
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({
      name: 'Celular Nova X',
      sku: 'TB-CEL-001',
      price: 1299900,
      stock: 7,
      categoryId: 'c1',
      brandId: null,
      specs: [{ key: 'Pantalla', value: '6,5 pulgadas' }],
    });
  });
});

describe('moveItem (reordenar imágenes)', () => {
  it('mueve elementos y respeta límites', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
});
