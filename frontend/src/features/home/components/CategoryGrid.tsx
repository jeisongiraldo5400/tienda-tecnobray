import { Cable, Cpu, Headphones, Laptop, Smartphone, Watch, Gamepad2, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Category } from '@/shared/types/domain';
import { RemoteImage } from '@/shared/ui/RemoteImage';

function iconFor(slug: string) {
  const s = slug.toLowerCase();
  if (/(celular|smartphone|telefono|movil)/.test(s)) return Smartphone;
  if (/(audio|audifono|parlante|sonido)/.test(s)) return Headphones;
  if (/(computador|portatil|laptop|pc)/.test(s)) return Laptop;
  if (/(accesorio|cable|cargador)/.test(s)) return Cable;
  if (/(reloj|smartwatch|wearable)/.test(s)) return Watch;
  if (/(gamer|consola|juego)/.test(s)) return Gamepad2;
  if (/(componente|hardware)/.test(s)) return Cpu;
  return Tag;
}

/** Columnas en escritorio según la cantidad, para que la última fila no quede con una sola tarjeta. */
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  const shown = categories.slice(0, 12);
  const lgCols = LG_COLS[shown.length] ?? 'lg:grid-cols-6';
  return (
    <section aria-labelledby="home-cats">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="home-cats" className="text-xl font-bold text-slate-900 sm:text-2xl">
          Compra por categoría
        </h2>
        <Link href="/productos" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text hover:underline md:min-h-0">
          Ver todo
        </Link>
      </div>
      {/* Móvil: fila deslizable (sin huérfanos); desde sm: cuadrícula. */}
      <ul className={`no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 ${lgCols}`}>
        {shown.map((c) => {
          const Icon = iconFor(c.slug);
          return (
            <li key={c.id || c.slug} className="w-[27%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/categoria/${c.slug}`}
                className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center transition hover:border-accent-text hover:shadow-md sm:p-4"
              >
                <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-brand sm:h-16 sm:w-16">
                  {c.imageUrl ? (
                    <RemoteImage src={c.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  )}
                </span>
                <span className="line-clamp-2 text-xs leading-4 font-semibold text-slate-800 group-hover:text-brand sm:text-sm sm:leading-5">{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
