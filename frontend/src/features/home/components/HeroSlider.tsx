'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageProps } from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { Banner } from '@/shared/types/domain';
import { buttonClasses } from '@/shared/ui/Button';

const INTERVAL = 6000;

/**
 * Dirección de arte sin descargas dobles: un solo <img> (móvil) y un <source> para ≥ 640 px.
 * El navegador elige UNA fuente según el ancho; la primera diapositiva se pide con prioridad alta.
 */
function BannerPicture({ banner, first }: { banner: Banner; first: boolean }) {
  const common = { alt: banner.title, fill: true, className: 'object-cover' } as const;
  const {
    props: { srcSet: desktopSrcSet, sizes: desktopSizes },
  } = getImageProps({ ...common, src: banner.imageUrl, sizes: '(max-width: 1279px) 100vw, 1216px' });
  const { props: mobile } = getImageProps({
    ...common,
    src: banner.mobileImageUrl ?? banner.imageUrl,
    sizes: '100vw',
    loading: first ? 'eager' : 'lazy',
    fetchPriority: first ? 'high' : 'auto',
  });
  return (
    <picture className="absolute inset-0 block">
      <source media="(min-width: 640px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt viene en las props generadas por getImageProps */}
      <img {...mobile} />
    </picture>
  );
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      className="relative overflow-hidden rounded-3xl bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative aspect-[4/5] max-h-[70svh] w-full sm:aspect-[16/7] sm:max-h-none lg:aspect-[16/6]">
        {banners.map((b, i) => {
          const active = i === index;
          return (
            <div
              key={b.id || i}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={!active}
              className={cn('absolute inset-0 transition-opacity duration-700', active ? 'opacity-100' : 'pointer-events-none opacity-0')}
            >
              {/* next/image con `fill` exige un padre posicionado (sin esto Next avisa y el layout no queda garantizado). */}
              <BannerPicture banner={b} first={i === 0} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071630]/85 via-[#071630]/25 to-transparent sm:bg-gradient-to-r sm:from-[#071630]/80 sm:via-[#071630]/30" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-10 sm:inset-y-0 sm:flex sm:max-w-xl sm:flex-col sm:justify-center sm:p-12">
                <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{b.title}</h2>
                {b.subtitle ? <p className="mt-2 text-sm text-white/85 sm:mt-3 sm:text-lg">{b.subtitle}</p> : null}
                {b.linkUrl ? (
                  <Link href={b.linkUrl} tabIndex={active ? 0 : -1} className={buttonClasses('accent', 'lg', 'mt-4 w-full sm:mt-6 sm:w-fit')}>
                    {b.buttonText ?? 'Ver más'}
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute right-[4.5rem] bottom-4 hidden h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand shadow hover:bg-white sm:flex"
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-4 bottom-4 hidden h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand shadow hover:bg-white sm:flex"
            aria-label="Diapositiva siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-5">
            {banners.map((b, i) => (
              <button
                key={b.id || i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === index}
                className="group/dot flex h-8 min-w-8 items-center justify-center"
              >
                <span className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-accent' : 'w-2 bg-white/60 group-hover/dot:bg-white')} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
