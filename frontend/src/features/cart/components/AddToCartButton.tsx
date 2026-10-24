'use client';

import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductSummary } from '@/shared/types/domain';
import { Button, type ButtonSize, type ButtonVariant } from '@/shared/ui/Button';
import { productToCartInput } from '../adapters/cart.adapter';
import { useCartStore } from '../store/cart.store';

export function AddToCartButton({
  product,
  quantity = 1,
  size = 'md',
  className,
  openDrawer = true,
  compact = false,
  variant = 'accent',
  shortLabelOnMobile = false,
}: {
  product: ProductSummary;
  quantity?: number;
  size?: ButtonSize;
  className?: string;
  openDrawer?: boolean;
  compact?: boolean;
  variant?: ButtonVariant;
  /** En tarjetas estrechas (2 columnas en teléfono) muestra "Agregar"; el nombre accesible sigue completo. */
  shortLabelOnMobile?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const open = useCartStore((s) => s.open);
  const soldOut = product.stock <= 0;

  function handleClick() {
    addItem(productToCartInput(product), quantity);
    toast.success('Producto agregado al carrito', { description: product.name });
    if (openDrawer) open();
  }

  return (
    <Button
      size={size}
      variant={soldOut ? 'outline' : variant}
      className={className}
      onClick={handleClick}
      disabled={soldOut}
      aria-label={compact ? `Agregar ${product.name} al carrito` : undefined}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      {compact ? null : soldOut ? (
        'Agotado'
      ) : shortLabelOnMobile ? (
        <span>
          Agregar<span className="max-sm:sr-only"> al carrito</span>
        </span>
      ) : (
        'Agregar al carrito'
      )}
    </Button>
  );
}
