'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { cn } from '@/shared/lib/cn';

export function SearchBox({ className, autoFocus, onSubmitted }: { className?: string; autoFocus?: boolean; onSubmitted?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  // El encabezado renderiza dos buscadores (escritorio y móvil): cada uno necesita su propio id.
  const inputId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos');
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={submit} className={cn('relative w-full', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar productos
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar celulares, audífonos, cargadores…"
        autoFocus={autoFocus}
        maxLength={100}
        className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-4 pr-14 text-base placeholder:text-slate-500 focus:border-accent-text focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 md:text-sm"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-full bg-brand text-on-brand hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-1"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
