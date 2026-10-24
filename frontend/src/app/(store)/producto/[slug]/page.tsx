import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductGridSkeleton } from '@/features/catalog/components/ProductGridSkeleton';
import { getProduct, getRelatedProducts } from '@/features/catalog/services/catalog.server';
import { ProductRail } from '@/features/home/components/ProductRail';
import { ProductGallery } from '@/features/product/components/ProductGallery';
import { ProductInfo } from '@/features/product/components/ProductInfo';
import { SpecsTable } from '@/features/product/components/SpecsTable';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { publicEnv } from '@/shared/config/env.public';
import { textToHtml } from '@/shared/lib/sanitize';
import { JsonLd } from '@/shared/seo/json-ld';
import { breadcrumbJsonLd, productJsonLd, stripHtml } from '@/shared/seo/structured-data';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Container } from '@/shared/ui/Container';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

/** ISR bajo demanda: no se pre-generan productos en el build; se generan en la primera visita. */
export function generateStaticParams(): Array<{ slug: string }> {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Producto no encontrado', robots: { index: false } };
  const description =
    product.seoDescription ?? product.shortDescription ?? stripHtml(product.description ?? '').slice(0, 160);
  const images = product.images.slice(0, 4).map((i) => ({ url: i.url, alt: i.alt || product.name }));
  // El título SEO del backend suele incluir ya el nombre de la tienda: usarlo tal cual.
  return {
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: { type: 'website', title: product.seoTitle ?? product.name, description, images },
    twitter: { card: 'summary_large_image', title: product.name, description, images: images.map((i) => i.url) },
  };
}

async function RelatedProducts({ product }: { product: Awaited<ReturnType<typeof getProduct>> & object }) {
  const related = await getRelatedProducts(product);
  return <ProductRail title="También te puede interesar" products={related} />;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getStoreSettings()]);
  if (!product || !product.isActive) notFound();
  const site = publicEnv.siteUrl;

  const crumbs = [
    { label: 'Inicio', href: '/' },
    ...(product.category?.slug ? [{ label: product.category.name, href: `/categoria/${product.category.slug}` }] : []),
    { label: product.name },
  ];

  return (
    <Container className="space-y-10 py-5 sm:space-y-14 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
          <ProductGallery images={product.images} name={product.name} />
          <ProductInfo product={product} shippingText={settings.shippingText} />
        </div>
      </div>

      {product.description || product.specs.length > 0 ? (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {product.description ? (
            <section aria-labelledby="desc">
              <h2 id="desc" className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
                Descripción
              </h2>
              <div className="prose-store" dangerouslySetInnerHTML={{ __html: textToHtml(product.description) }} />
            </section>
          ) : null}
          {product.specs.length > 0 ? (
            <section aria-labelledby="specs">
              <h2 id="specs" className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
                Especificaciones
              </h2>
              <SpecsTable specs={product.specs} />
            </section>
          ) : null}
        </div>
      ) : null}

      {/* Los relacionados se transmiten después: el 404 se decide antes (sin loading.tsx de ruta → estado HTTP real). */}
      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <RelatedProducts product={product} />
      </Suspense>

      <JsonLd
        data={[
          productJsonLd(product, settings, site),
          breadcrumbJsonLd(
            crumbs.map((c) => ({ name: c.label, url: `${site}${c.href ?? `/producto/${product.slug}`}` })),
          ),
        ]}
      />
    </Container>
  );
}
