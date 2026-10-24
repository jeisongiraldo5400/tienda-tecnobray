import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import type { Brand, Category, Paginated, ProductSummary } from '@/shared/types/domain';
import { buttonClasses } from '@/shared/ui/Button';
import { LinkPagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState } from '@/shared/ui/States';
import { serializeCatalogFilters, type CatalogFilters } from '../adapters/filters';
import { CatalogSidebar, CatalogToolbar } from './CatalogControls';
import { ProductGrid } from './ProductGrid';

export interface CatalogViewProps {
  filters: CatalogFilters;
  result: Paginated<ProductSummary> | null;
  error?: unknown;
  categories: Category[];
  brands: Brand[];
  fixedCategory?: string;
}

export function CatalogView({ filters, result, error, categories, brands, fixedCategory }: CatalogViewProps) {
  const base = fixedCategory ? `/categoria/${encodeURIComponent(fixedCategory)}` : '/productos';
  const hrefFor = (page: number) => {
    const { categoria, ...rest } = filters;
    return `${base}${serializeCatalogFilters({ ...(fixedCategory ? rest : { ...rest, categoria }), pagina: page })}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32 rounded-2xl border border-slate-200 bg-white p-4">
          <Suspense fallback={null}>
            <CatalogSidebar categories={categories} brands={brands} fixedCategory={fixedCategory} />
          </Suspense>
        </div>
      </aside>
      {/* min-w-0: sin esto la columna del grid crece con la barra de orden y la página desborda en móvil. */}
      <div className="min-w-0 space-y-5">
        <Suspense fallback={null}>
          <CatalogToolbar categories={categories} brands={brands} fixedCategory={fixedCategory} total={result?.total ?? 0} />
        </Suspense>
        {error ? (
          <ErrorState description={getErrorMessage(error)} />
        ) : !result || result.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No encontramos productos"
            description="Prueba con otra búsqueda o quita algunos filtros."
            action={
              <Link href="/productos" className={buttonClasses('outline')}>
                Ver todos los productos
              </Link>
            }
          />
        ) : (
          <>
            <ProductGrid products={result.items} priorityCount={4} />
            <LinkPagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} className="pt-4" />
          </>
        )}
      </div>
    </div>
  );
}
