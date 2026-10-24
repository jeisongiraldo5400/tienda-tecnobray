'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { CategoryRef } from '@/shared/types/domain';
import { Drawer } from '@/shared/ui/Drawer';

export function MobileMenu({ categories }: { categories: CategoryRef[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>
      <Drawer open={open} onClose={close} title="Menú" side="left">
        <nav className="flex flex-col p-3" aria-label="Menú principal móvil">
          <Link href="/" onClick={close} className="flex min-h-11 items-center rounded-lg px-3 font-medium text-slate-900 hover:bg-brand-soft">
            Inicio
          </Link>
          <Link href="/productos" onClick={close} className="flex min-h-11 items-center rounded-lg px-3 font-medium text-slate-900 hover:bg-brand-soft">
            Todos los productos
          </Link>
          <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Categorías</p>
          {categories.map((c) => (
            <Link key={c.id || c.slug} href={`/categoria/${c.slug}`} onClick={close} className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-brand-soft hover:text-brand">
              {c.name}
            </Link>
          ))}
          <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ayuda</p>
          <Link href="/seguimiento" onClick={close} className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-brand-soft hover:text-brand">
            Rastrear mi pedido
          </Link>
          <Link href="/politicas/envios" onClick={close} className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-brand-soft hover:text-brand">
            Envíos
          </Link>
          <Link href="/politicas/garantias" onClick={close} className="flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-brand-soft hover:text-brand">
            Garantía
          </Link>
        </nav>
      </Drawer>
    </>
  );
}
