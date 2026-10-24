import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsList } from '@/features/admin/products/components/ProductsList';
import { LoadingState } from '@/shared/ui/States';

export const metadata: Metadata = { title: 'Productos' };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductsList />
    </Suspense>
  );
}
