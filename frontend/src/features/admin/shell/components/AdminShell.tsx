'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Layers,
  LayoutList,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ROLE_LABELS, type AdminUser } from '@/features/admin/auth/adapters/user.adapter';
import { logout } from '@/features/admin/auth/services/auth.service';
import { Logo } from '@/features/layout/components/Logo';
import { cn } from '@/shared/lib/cn';
import { useModalBehavior } from '@/shared/ui/useModalBehavior';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Package;
  adminOnly?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Layers },
  { href: '/admin/marcas', label: 'Marcas', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/secciones', label: 'Secciones del inicio', icon: LayoutList },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/usuarios', label: 'Usuarios y roles', icon: UserCog, adminOnly: true },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ user, onNavigate }: { user: AdminUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Menú del panel">
      {ADMIN_NAV.filter((i) => !i.adminOnly || user.role === 'admin').map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:min-h-10',
              active
                ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-accent'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className={cn('h-4.5 w-4.5 shrink-0', active && 'text-accent')} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  user,
  storeName,
  logoUrl,
  children,
}: {
  user: AdminUser;
  storeName: string;
  logoUrl?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  useModalBehavior(open, closeMenu, menuContainerRef, menuPanelRef);
  const router = useRouter();
  const qc = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error('No se pudo cerrar la sesión en el servidor.');
    } finally {
      qc.clear();
      router.replace('/admin/login');
      router.refresh();
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-ink p-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Logo name={storeName} logoUrl={logoUrl} tone="dark" href="/admin" imgClassName="h-7" sizes="127px" loading="eager" />
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-on-accent uppercase">Admin</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú">
          <X className="h-5 w-5" />
        </button>
      </div>
      <NavLinks user={user} onNavigate={() => setOpen(false)} />
      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex min-h-10 items-center gap-2 px-3 text-sm text-slate-300 hover:text-accent">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver tienda
        </Link>
        <div className="px-3">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">
            {user.email} · {ROLE_LABELS[user.role]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>
      {open ? (
        <div ref={menuContainerRef} className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeMenu} aria-hidden="true" />
          <aside
            ref={menuPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] focus:outline-none"
          >
            {sidebar}
          </aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <Logo name={storeName} logoUrl={logoUrl} href="/admin" imgClassName="h-7" sizes="127px" loading="eager" />
          <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Admin</span>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
