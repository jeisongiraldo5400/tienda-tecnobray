import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { publicEnv } from '@/shared/config/env.public';
import { BRAND_ASSETS } from '@/shared/config/brand';
import { ensureContrast, readableTextOn } from '@/shared/lib/color';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const title = settings.seo.title ?? settings.storeName;
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: title, template: `%s | ${settings.storeName}` },
    description: settings.seo.description,
    applicationName: settings.storeName,
    icons: {
      icon: settings.faviconUrl ?? BRAND_ASSETS.icon,
      apple: settings.appleTouchIconUrl ?? BRAND_ASSETS.appleIcon,
    },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: settings.storeName,
      title,
      description: settings.seo.description,
      url: publicEnv.siteUrl,
      ...(settings.logoUrl ? { images: [{ url: settings.logoUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description: settings.seo.description },
    alternates: { canonical: '/' },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getStoreSettings();
  return { themeColor: settings.colors.primary, width: 'device-width', initialScale: 1 };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getStoreSettings();
  const style = {
    '--brand-primary': settings.colors.primary,
    '--brand-primary-contrast': readableTextOn(settings.colors.primary),
    '--brand-secondary': settings.colors.secondary,
    '--brand-accent': settings.colors.accent,
    '--brand-accent-contrast': readableTextOn(settings.colors.accent),
    // Contra el gris más oscuro donde aparece (fondos suaves #EEF1F6): también cumple sobre blanco y el fondo de página.
    '--brand-accent-text': ensureContrast(settings.colors.accent, '#EEF1F6'),
  } as CSSProperties;
  return (
    <html lang="es-CO" className={inter.variable} style={style}>
      <body className="min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
