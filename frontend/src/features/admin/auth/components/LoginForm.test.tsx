import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/fixtures';
import { LoginForm, safeNext } from './LoginForm';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh: vi.fn(), push: vi.fn() }) }));

describe('LoginForm', () => {
  beforeEach(() => replace.mockReset());

  it('valida correo y contraseña', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /Ingresar/ }));
    expect(await screen.findByText('Ingresa tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
  });

  it('obtiene CSRF, inicia sesión y redirige a la ruta solicitada', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ csrfToken: 'tok' }))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 'u', email: 'a@b.co', name: 'Ana', role: 'admin', active: true } }));
    const user = userEvent.setup();
    render(<LoginForm next="/admin/pedidos" />);
    await user.type(screen.getByLabelText(/Correo/), 'Admin@TecnoBray.co');
    await user.type(screen.getByLabelText(/Contraseña/), 'clave-segura-123');
    await user.click(screen.getByRole('button', { name: /Ingresar/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/pedidos'));
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/bff/auth/csrf');
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toBe('/api/bff/auth/login');
    expect((init!.headers as Record<string, string>)['x-csrf-token']).toBe('tok');
    expect(JSON.parse(String(init!.body))).toEqual({ email: 'admin@tecnobray.co', password: 'clave-segura-123' });
  });

  it('muestra el error del backend y limpia la contraseña', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ csrfToken: 'tok' }))
      .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'Correo o contraseña incorrectos.' }, { status: 401 }));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/Correo/), 'a@b.co');
    await user.type(screen.getByLabelText(/Contraseña/), 'mala');
    await user.click(screen.getByRole('button', { name: /Ingresar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(screen.getByLabelText(/Contraseña/)).toHaveValue('');
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('safeNext', () => {
  it('solo permite rutas internas del panel', () => {
    expect(safeNext('/admin/productos')).toBe('/admin/productos');
    expect(safeNext('https://evil.com')).toBe('/admin');
    expect(safeNext('//evil.com')).toBe('/admin');
    expect(safeNext('/admin/login')).toBe('/admin');
    expect(safeNext(undefined)).toBe('/admin');
  });
});
