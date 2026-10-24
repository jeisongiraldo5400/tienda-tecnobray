import type { Metadata } from 'next';
import Link from 'next/link';
import { StoreShell } from '@/features/layout/components/StoreShell';
import { buttonClasses } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

export const metadata: Metadata = { title: 'Página no encontrada', robots: { index: false } };

export default function NotFound() {
  return (
    <StoreShell>
      <Container className="flex flex-col items-center py-20 text-center">
        <p className="text-7xl font-black text-brand sm:text-8xl">4<span className="text-accent-text">0</span>4</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">No encontramos esta página</h1>
        <p className="mt-2 max-w-md text-slate-600">
          Es posible que el producto ya no esté disponible o que la dirección haya cambiado.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Link href="/" className={buttonClasses('primary', 'lg')}>
            Ir al inicio
          </Link>
          <Link href="/productos" className={buttonClasses('outline', 'lg')}>
            Ver productos
          </Link>
        </div>
      </Container>
    </StoreShell>
  );
}
