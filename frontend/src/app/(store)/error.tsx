'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Container } from '@/shared/ui/Container';

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <p className="text-7xl font-black text-brand">500</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-slate-600">
        Tuvimos un problema al cargar esta página. Intenta de nuevo en unos segundos.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-slate-400">Código: {error.digest}</p> : null}
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Button size="lg" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/" className={buttonClasses('outline', 'lg')}>
          Ir al inicio
        </Link>
      </div>
    </Container>
  );
}
