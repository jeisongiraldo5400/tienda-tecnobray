import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminSessionProvider } from '@/features/admin/auth/hooks/AdminSessionProvider';
import { getAdminUser } from '@/features/admin/auth/services/session.server';
import { AdminShell } from '@/features/admin/shell/components/AdminShell';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { ConfirmDialogHost } from '@/shared/ui/ConfirmDialog';

export const dynamic = 'force-dynamic';

/** Verificación de sesión en el servidor (además del proxy): GET /auth/me. */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const [user, settings] = await Promise.all([getAdminUser(), getStoreSettings()]);
  if (!user) {
    const h = await headers();
    const path = h.get('x-admin-path') ?? '/admin';
    redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }
  return (
    <AdminSessionProvider user={user}>
      <AdminShell user={user} storeName={settings.storeName} logoUrl={settings.logoUrl}>
        {children}
      </AdminShell>
      <ConfirmDialogHost />
    </AdminSessionProvider>
  );
}
