import Link from 'next/link';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { ProductSummary } from '@/shared/types/domain';

export function ProductRail({ title, products, href }: { title: string; products: ProductSummary[]; href?: string }) {
  if (products.length === 0) return null;
  const id = `rail-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const items = products.slice(0, 8);
  // En la cuadrícula (sm: 3 col, lg: 4 col) solo se muestran filas completas; en móvil la fila se desliza.
  const full = (cols: number) => (items.length >= cols ? Math.floor(items.length / cols) * cols : items.length);
  const smCount = full(3);
  const lgCount = full(4);
  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id={id} className="text-xl font-bold text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {href ? (
          <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent-text hover:underline md:min-h-0">
            Ver más
          </Link>
        ) : null}
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {items.map((p, i) => (
          <li
            key={p.id || p.slug}
            className={`w-[46%] shrink-0 snap-start sm:w-auto ${i >= smCount ? 'sm:hidden' : ''} ${i < lgCount ? 'lg:block' : 'lg:hidden'}`}
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
