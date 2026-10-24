'use client';

import { ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, type MouseEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import type { ImageAsset } from '@/shared/types/domain';
import { Modal } from '@/shared/ui/Modal';
import { RemoteImage } from '@/shared/ui/RemoteImage';

export function ProductGallery({ images, name }: { images: ImageAsset[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = images[active];
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const go = (i: number) => count > 0 && setActive(((i % count) + count) % count);

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[520px] md:flex-col md:overflow-y-auto" aria-label="Miniaturas">
          {images.map((img, i) => (
            <li key={img.id ?? img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white sm:h-20 sm:w-20',
                  i === active ? 'border-accent-text ring-2 ring-accent/30' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <RemoteImage src={img.url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative flex-1">
        <button
          type="button"
          className="relative block aspect-square w-full cursor-zoom-in touch-pan-y overflow-hidden rounded-2xl border border-slate-200 bg-white"
          // Deslizar con el dedo cambia de imagen (móvil); el clic/tap abre el visor ampliado.
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40 && count > 1) {
              e.preventDefault();
              go(active + (dx < 0 ? 1 : -1));
            }
          }}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          onClick={() => current && setLightbox(true)}
          aria-label="Ampliar imagen"
        >
          <RemoteImage
            src={current?.url}
            alt={current?.alt || name}
            fill
            preload
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 600px"
            className="object-contain p-4 transition-transform duration-150"
            style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {count > 1 ? (
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-brand/85 px-2.5 py-1 text-xs font-semibold text-white md:hidden">
              {active + 1} / {count}
            </span>
          ) : null}
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Ampliar
          </span>
        </button>
      </div>
      <Modal open={lightbox} onClose={() => setLightbox(false)} title={name} size="xl">
        {current ? (
          <div className="relative aspect-square w-full bg-white">
            <Image src={current.url} alt={current.alt || name} fill sizes="90vw" className="object-contain" />
          </div>
        ) : null}
        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2">
            {images.map((img, i) => (
              <button
                key={img.id ?? img.url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className="flex h-11 w-11 items-center justify-center"
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', i === active ? 'bg-brand' : 'bg-slate-300')} />
              </button>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
