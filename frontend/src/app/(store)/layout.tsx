import type { ReactNode } from 'react';
import { StoreShell } from '@/features/layout/components/StoreShell';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
