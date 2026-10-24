import { CategoryGrid } from '@/features/home/components/CategoryGrid';
import { HeroFallback } from '@/features/home/components/HeroFallback';
import { HeroSlider } from '@/features/home/components/HeroSlider';
import { ProductRail } from '@/features/home/components/ProductRail';
import { TrustBadges } from '@/features/home/components/TrustBadges';
import { getHomeData } from '@/features/home/services/home.server';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { Container } from '@/shared/ui/Container';

export const revalidate = 300;

export default async function HomePage() {
  const [settings, home] = await Promise.all([getStoreSettings(), getHomeData()]);
  const empty = home.featured.length === 0 && home.newest.length === 0 && home.sections.length === 0;

  return (
    <Container className="space-y-10 py-4 sm:space-y-14 sm:py-8">
      {home.banners.length > 0 ? (
        <>
          <h1 className="sr-only">
            {settings.storeName}: {settings.tagline}
          </h1>
          <HeroSlider banners={home.banners} />
        </>
      ) : (
        <HeroFallback storeName={settings.storeName} tagline={settings.tagline} />
      )}
      <TrustBadges shippingText={settings.shippingText} />
      <CategoryGrid categories={home.categories.filter((c) => !c.parentId)} />
      <ProductRail title="Destacados" products={home.featured} href="/productos" />
      {home.sections.map((s) => (
        <ProductRail key={s.id} title={s.title} products={s.products} />
      ))}
      <ProductRail title="Lo más nuevo" products={home.newest} href="/productos?orden=newest" />
      {empty ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Muy pronto tendremos productos disponibles. ¡Vuelve pronto!
        </p>
      ) : null}
    </Container>
  );
}
