import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrdersList } from '@/features/admin/orders/components/OrdersList';
import { LoadingState } from '@/shared/ui/States';

export const metadata: Metadata = { title: 'Pedidos' };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersList />
    </Suspense>
  );
}
