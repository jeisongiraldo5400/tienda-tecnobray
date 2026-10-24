import Link from 'next/link';
import { buttonClasses } from '@/shared/ui/Button';

/** Hero por defecto cuando no hay banners configurados. */
export function HeroFallback({ storeName, tagline }: { storeName: string; tagline?: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand px-5 py-12 sm:px-12 sm:py-20">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent opacity-25 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 right-40 h-60 w-60 rounded-full bg-accent opacity-30 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{storeName}</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          {tagline ?? 'La mejor tecnología al mejor precio'}
        </h1>
        <p className="mt-4 text-white/80">Celulares, accesorios, audio y computadores con envío a toda Colombia.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/productos" className={buttonClasses('accent', 'lg')}>
            Ver catálogo
          </Link>
          <Link href="/seguimiento" className={buttonClasses('outline', 'lg', 'border-white/30 bg-white/10 text-white hover:bg-white/20')}>
            Rastrear pedido
          </Link>
        </div>
      </div>
    </section>
  );
}
