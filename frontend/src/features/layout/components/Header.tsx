import { PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { CartButton } from '@/features/cart/components/CartButton';
import type { Category, StoreSettings } from '@/shared/types/domain';
import { Container } from '@/shared/ui/Container';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { SearchBox } from './SearchBox';

/**
 * Móvil primero: barra fija compacta (menú, logo, carrito) y el buscador debajo, que se desplaza
 * con la página para no comerse la pantalla. Desde md el buscador va en la barra y desde lg
 * aparece la navegación de categorías en azul marino.
 */
export function Header({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const navCategories = categories.filter((c) => !c.parentId).slice(0, 7);
  const announcementShort = settings.announcement?.split('·')[0]?.trim();
  return (
    <>
      {settings.announcement ? (
        <div role="region" aria-label="Anuncio" className="bg-ink px-4 py-2 text-center text-xs leading-4 font-medium text-white">
          <span className="sm:hidden">{announcementShort}</span>
          <span className="hidden sm:inline">{settings.announcement}</span>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <Container className="flex h-14 items-center gap-2 sm:h-16 lg:h-[72px] lg:gap-8">
          <MobileMenu categories={navCategories} />
          <Logo
            name={settings.storeName}
            logoUrl={settings.logoUrl}
            imgClassName="h-7 sm:h-8 lg:h-10"
            sizes="(min-width: 1024px) 181px, (min-width: 640px) 145px, 127px"
            preload
          />
          <Suspense fallback={<div className="hidden flex-1 md:block" />}>
            <SearchBox className="hidden max-w-xl flex-1 md:block" />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/seguimiento"
              className="hidden h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand sm:flex"
              aria-label="Mi pedido"
            >
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
              <span className="hidden lg:inline">Mi pedido</span>
            </Link>
            <CartButton />
          </div>
        </Container>
        {navCategories.length > 0 ? (
          <nav aria-label="Categorías" className="hidden bg-brand lg:block">
            <Container className="no-scrollbar flex gap-1 overflow-x-auto py-1.5">
              <Link
                href="/productos"
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-accent hover:bg-white/10"
              >
                Todo
              </Link>
              {navCategories.map((c) => (
                <Link
                  key={c.id || c.slug}
                  href={`/categoria/${c.slug}`}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {c.name}
                </Link>
              ))}
            </Container>
          </nav>
        ) : null}
      </header>
      <Container className="border-b border-slate-200 bg-white py-2.5 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </Container>
    </>
  );
}
