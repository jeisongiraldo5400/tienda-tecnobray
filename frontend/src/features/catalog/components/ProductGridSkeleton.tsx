import { Skeleton } from '@/shared/ui/Skeleton';

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="rounded-2xl border border-slate-200 bg-white p-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-3 h-5 w-1/2" />
          <Skeleton className="mt-3 h-8 w-full" />
        </li>
      ))}
    </ul>
  );
}
