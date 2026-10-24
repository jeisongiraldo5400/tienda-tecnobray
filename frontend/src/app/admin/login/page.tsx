import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm, safeNext } from '@/features/admin/auth/components/LoginForm';
import { getAdminUser } from '@/features/admin/auth/services/session.server';
import { Logo } from '@/features/layout/components/Logo';
import { getStoreSettings } from '@/features/settings/services/settings.server';

export const metadata: Metadata = { title: 'Iniciar sesión' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const [user, settings] = await Promise.all([getAdminUser().catch(() => null), getStoreSettings()]);
  if (user) redirect(safeNext(next));

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10 sm:py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo name={settings.storeName} logoUrl={settings.logoUrl} tone="dark" href={null} imgClassName="h-10 sm:h-12" sizes="(min-width: 640px) 217px, 181px" preload />
          <h1 className="mt-4 text-xl font-bold text-white sm:text-2xl">Panel de administración</h1>
          <p className="mt-1 text-sm text-slate-300">Ingresa con tu cuenta de {settings.storeName}.</p>
        </div>
        <div className="rounded-2xl border-t-4 border-accent bg-white p-5 shadow-xl sm:p-7">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="inline-flex min-h-11 items-center text-slate-300 hover:text-accent">
            ← Volver a la tienda
          </Link>
        </p>
      </div>
    </main>
  );
}
