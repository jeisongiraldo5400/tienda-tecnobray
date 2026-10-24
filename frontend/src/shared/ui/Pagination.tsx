import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** Devuelve las páginas a mostrar con elipsis: [1, '…', 4, 5, 6, '…', 10]. */
export function pageWindow(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | '…'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

interface BaseProps {
  page: number;
  totalPages: number;
  className?: string;
}

const itemCls = 'inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-medium md:h-9 md:min-w-9';

/** Paginación con enlaces (SEO-friendly) para la tienda. */
export function LinkPagination({ page, totalPages, hrefFor, className }: BaseProps & { hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(itemCls, 'hover:bg-slate-100')} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className={cn(itemCls, 'text-slate-400')}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(itemCls, p === page ? 'bg-brand text-on-brand' : 'hover:bg-slate-100')}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(itemCls, 'hover:bg-slate-100')} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}

/** Paginación con botones para el panel. */
export function ButtonPagination({ page, totalPages, onChange, className }: BaseProps & { onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(itemCls, 'hover:bg-slate-100 disabled:opacity-40')} aria-label="Página anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className={cn(itemCls, 'text-slate-400')}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(itemCls, p === page ? 'bg-brand text-on-brand' : 'hover:bg-slate-100')}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={cn(itemCls, 'hover:bg-slate-100 disabled:opacity-40')} aria-label="Página siguiente">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
