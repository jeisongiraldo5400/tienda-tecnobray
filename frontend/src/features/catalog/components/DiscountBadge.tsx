import { discountPercent } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

export function DiscountBadge({ price, compareAtPrice, className }: { price: number; compareAtPrice?: number | null; className?: string }) {
  const pct = discountPercent(price, compareAtPrice);
  if (pct <= 0) return null;
  return (
    <span className={cn('rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-on-accent', className)}>-{pct}%</span>
  );
}
