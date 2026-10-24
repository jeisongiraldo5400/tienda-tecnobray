import type { Metadata } from 'next';
import { BannersManager } from '@/features/admin/banners/components/BannersManager';

export const metadata: Metadata = { title: 'Banners' };

export default function Page() {
  return <BannersManager />;
}
