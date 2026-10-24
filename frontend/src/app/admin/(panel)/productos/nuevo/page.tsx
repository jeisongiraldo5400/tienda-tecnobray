import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductForm } from '@/features/admin/products/components/ProductForm';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';

export const metadata: Metadata = { title: 'Nuevo producto' };

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Nuevo producto"
        back={
          <Link href="/admin/productos" className="text-sm text-slate-500 hover:text-brand">
            ← Productos
          </Link>
        }
      />
      <ProductForm />
    </>
  );
}
