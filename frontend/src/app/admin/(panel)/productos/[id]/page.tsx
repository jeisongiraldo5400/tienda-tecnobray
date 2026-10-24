import type { Metadata } from 'next';
import { ProductEditor } from '@/features/admin/products/components/ProductEditor';

export const metadata: Metadata = { title: 'Editar producto' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
