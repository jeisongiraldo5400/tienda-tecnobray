import { PackageSearch } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackingView } from '@/features/orders/components/TrackingView';
import { Container } from '@/shared/ui/Container';
import { LoadingState } from '@/shared/ui/States';

export const metadata: Metadata = {
  title: 'Rastrear pedido',
  description: 'Consulta el estado de tu pedido con el número de pedido y tu celular.',
};

export default function TrackingPage() {
  return (
    <Container className="space-y-6 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-accent">
          <PackageSearch className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Rastrear mi pedido</h1>
        <p className="mt-2 text-slate-600">Ingresa el número de pedido y el celular con el que compraste.</p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <TrackingView />
      </Suspense>
    </Container>
  );
}
