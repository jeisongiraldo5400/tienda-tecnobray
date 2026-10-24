'use client';

import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = Omit<ImageProps, 'src' | 'alt'> & { src?: string | null; alt: string; fallbackClassName?: string };

/** next/image con marcador de posición si no hay imagen o falla la carga. */
export function RemoteImage({ src, alt, className, fallbackClassName, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || 'Imagen no disponible'}
        className={cn('flex h-full w-full items-center justify-center bg-slate-100 text-slate-400', fallbackClassName)}
      >
        <ImageOff className="h-1/4 max-h-10 w-1/4 max-w-10" aria-hidden="true" />
      </div>
    );
  }
  return <Image src={src} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}
