import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseCatalogFilters, toApiQuery, type CatalogFilters } from '@/features/catalog/adapters/filters';
import { CatalogView } from '@/features/catalog/components/CatalogView';
import { getBrands, getCategories, getProducts } from '@/features/catalog/services/catalog.server';
import type { Category } from '@/shared/types/domain';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Container } from '@/shared/ui/Container';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return { title: 'Categoría no encontrada' };
  return {
    title: category.name,
    description: category.description ?? `Compra ${category.name.toLowerCase()} con envío a toda Colombia.`,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: category.imageUrl ? { images: [{ url: category.imageUrl }] } : undefined,
  };
}

/** Resultados del catálogo de la categoría. */
async function CategoryResults({ slug, filters, categories }: { slug: string; filters: CatalogFilters; categories: Category[] }) {
  const [brands, result] = await Promise.all([
    getBrands(),
    getProducts(toApiQuery(filters)).then(
      (r) => ({ data: r, error: null as unknown }),
      (error: unknown) => ({ data: null, error }),
    ),
  ]);
  return (
    <CatalogView
      filters={filters}
      result={result.data}
      error={result.error}
      categories={categories}
      brands={brands}
      fixedCategory={slug}
    />
  );
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const filters = { ...parseCatalogFilters(await searchParams), categoria: slug };

  return (
    <Container className="space-y-5 py-5 sm:space-y-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Productos', href: '/productos' }, { label: category.name }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{category.name}</h1>
        {category.description ? <p className="mt-1 max-w-3xl text-slate-600">{category.description}</p> : null}
      </div>
      {/* Sin loading.tsx ni Suspense de ruta: así una categoría inexistente responde con estado HTTP 404 real. */}
      <CategoryResults slug={slug} filters={filters} categories={categories} />
    </Container>
  );
}
