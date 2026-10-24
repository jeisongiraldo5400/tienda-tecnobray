import type { Metadata } from 'next';
import { CheckoutView } from '@/features/checkout/components/CheckoutView';
import { Container } from '@/shared/ui/Container';

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Container className="space-y-5 py-5 sm:space-y-6 sm:py-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Finalizar compra</h1>
      <CheckoutView />
    </Container>
  );
}
