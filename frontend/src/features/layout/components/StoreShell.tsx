import type { ReactNode } from 'react';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { getCategories } from '@/features/catalog/services/catalog.server';
import { StoreSettingsProvider } from '@/features/settings/hooks/StoreSettingsProvider';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { publicEnv } from '@/shared/config/env.public';
import { JsonLd } from '@/shared/seo/json-ld';
import { organizationJsonLd, websiteJsonLd } from '@/shared/seo/structured-data';
import { ConfirmDialogHost } from '@/shared/ui/ConfirmDialog';
import { Footer } from './Footer';
import { Header } from './Header';
import { WhatsAppFloat } from './WhatsAppFloat';

/** Estructura pública: header, footer, carrito y datos de la tienda para componentes cliente. */
export async function StoreShell({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  return (
    <StoreSettingsProvider value={settings}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Saltar al contenido
      </a>
      <Header settings={settings} categories={categories} />
      <main id="contenido" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <WhatsAppFloat />
      <ConfirmDialogHost />
      <JsonLd data={[organizationJsonLd(settings, publicEnv.siteUrl), websiteJsonLd(settings, publicEnv.siteUrl)]} />
    </StoreSettingsProvider>
  );
}
