import { cn } from '@/shared/lib/cn';
import { discountPercent, formatCOP } from '@/shared/lib/format';

export function PriceTag({
  price,
  compareAtPrice,
  size = 'md',
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const hasDiscount = discountPercent(price, compareAtPrice) > 0;
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
      <span
        className={cn(
          'font-bold text-slate-900',
          size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-lg' : 'text-base',
        )}
      >
        {formatCOP(price)}
      </span>
      {hasDiscount ? (
        <span className={cn('text-slate-500 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
          <span className="sr-only">Antes </span>
          {formatCOP(compareAtPrice)}
        </span>
      ) : null}
    </div>
  );
}
