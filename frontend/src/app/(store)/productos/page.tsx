import type { Metadata } from 'next';
import { parseCatalogFilters, toApiQuery } from '@/features/catalog/adapters/filters';
import { CatalogView } from '@/features/catalog/components/CatalogView';
import { getBrands, getCategories, getProducts } from '@/features/catalog/services/catalog.server';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Container } from '@/shared/ui/Container';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams);
  const title = filters.q ? `Resultados para “${filters.q}”` : 'Todos los productos';
  return {
    title,
    description: 'Explora celulares, accesorios, audio y computadores con envío a toda Colombia.',
    alternates: { canonical: '/productos' },
    robots: filters.q || filters.pagina ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const filters = parseCatalogFilters(await searchParams);
  const [categories, brands, result] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts(toApiQuery(filters)).then(
      (r) => ({ data: r, error: null as unknown }),
      (error: unknown) => ({ data: null, error }),
    ),
  ]);
  const categoryName = categories.find((c) => c.slug === filters.categoria)?.name;
  const heading = filters.q ? `Resultados para “${filters.q}”` : (categoryName ?? 'Todos los productos');

  return (
    <Container className="space-y-5 py-5 sm:space-y-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Productos' }]} />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{heading}</h1>
      <CatalogView filters={filters} result={result.data} error={result.error} categories={categories} brands={brands} />
    </Container>
  );
}
