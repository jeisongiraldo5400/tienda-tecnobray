import Image from 'next/image';
import Link from 'next/link';
import { BRAND_ASSETS } from '@/shared/config/brand';
import { cn } from '@/shared/lib/cn';
import { BrandWordmark } from './BrandWordmark';

export interface LogoProps {
  name: string;
  /** Logo cargado en Configuración; si no hay, se dibuja el logo vectorial de la marca. */
  logoUrl?: string;
  className?: string;
  /** Clases de alto del logo (el ancho se ajusta solo). */
  imgClassName?: string;
  /** `null` para renderizar sin enlace (p. ej. en el login). */
  href?: string | null;
  /** Sobre fondo oscuro: el logo cargado va sobre una placa blanca; el vectorial usa sus colores para fondo oscuro. */
  tone?: 'light' | 'dark';
  /** Solo el logo del encabezado (candidato a LCP) se precarga. */
  preload?: boolean;
  /** `eager` para logos visibles al cargar que no deben precargarse (panel); por defecto `lazy`. */
  loading?: 'eager' | 'lazy';
  /** Ancho mostrado, para `sizes` (el alto lo dan las clases). */
  sizes?: string;
}

export function Logo({
  name,
  logoUrl,
  className,
  imgClassName = 'h-8 lg:h-10',
  href = '/',
  tone = 'light',
  preload = false,
  loading,
  sizes = '180px',
}: LogoProps) {
  const onDark = tone === 'dark';
  const img = !logoUrl ? (
    <span className="flex items-center">
      <BrandWordmark tone={tone} className={imgClassName} />
    </span>
  ) : (
    <span className={cn('flex items-center', onDark && 'rounded-xl bg-white px-3 py-1.5')}>
      <Image
        src={logoUrl}
        alt={name}
        width={BRAND_ASSETS.logoWidth}
        height={BRAND_ASSETS.logoHeight}
        sizes={sizes}
        className={cn('w-auto object-contain', imgClassName)}
        {...(preload ? { preload: true } : { loading: loading ?? 'lazy' })}
      />
    </span>
  );
  if (href === null) return <span className={cn('inline-flex shrink-0 items-center', className)}>{img}</span>;
  return (
    <Link href={href} className={cn('flex shrink-0 items-center rounded-lg', className)} aria-label={`${name}, ir al inicio`}>
      {img}
    </Link>
  );
}
