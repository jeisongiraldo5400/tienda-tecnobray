import type { Metadata } from 'next';
import { CartPageView } from '@/features/cart/components/CartPageView';
import { Container } from '@/shared/ui/Container';

export const metadata: Metadata = { title: 'Carrito de compras', robots: { index: false } };

export default function CartPage() {
  return (
    <Container className="space-y-5 py-5 sm:space-y-6 sm:py-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Carrito de compras</h1>
      <CartPageView />
    </Container>
  );
}
