import type { Metadata } from 'next';
import { BrandsManager } from '@/features/admin/brands/components/BrandsManager';

export const metadata: Metadata = { title: 'Marcas' };

export default function Page() {
  return <BrandsManager />;
}
