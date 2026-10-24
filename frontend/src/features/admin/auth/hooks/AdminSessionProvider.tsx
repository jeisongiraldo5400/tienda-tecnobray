'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/shared/api/browser-client';
import type { AdminUser } from '../adapters/user.adapter';

const AdminSessionContext = createContext<AdminUser | null>(null);

export function AdminSessionProvider({ user, children }: { user: AdminUser; children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      qc.clear();
      router.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [router, qc]);
  return <AdminSessionContext.Provider value={user}>{children}</AdminSessionContext.Provider>;
}

export function useAdminUser(): AdminUser {
  const user = useContext(AdminSessionContext);
  if (!user) throw new Error('useAdminUser debe usarse dentro de AdminSessionProvider');
  return user;
}
