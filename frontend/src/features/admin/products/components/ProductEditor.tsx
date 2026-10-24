'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { buttonClasses } from '@/shared/ui/Button';
import { useAdminProduct } from '../hooks/useProducts';
import { ProductForm } from './ProductForm';

export function ProductEditor({ id }: { id: string }) {
  const query = useAdminProduct(id);
  return (
    <QueryStates query={query} loadingLabel="Cargando producto…">
      {(product) => (
        <>
          <PageHeader
            title={product.name}
            description={`SKU ${product.sku}`}
            back={
              <Link href="/admin/productos" className="text-sm text-slate-500 hover:text-brand">
                ← Productos
              </Link>
            }
            actions={
              product.active ? (
                <Link href={`/producto/${product.slug}`} target="_blank" className={buttonClasses('outline')}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver en tienda
                </Link>
              ) : null
            }
          />
          <ProductForm key={product.id} product={product} />
        </>
      )}
    </QueryStates>
  );
}
