import type { Metadata } from 'next';
import { SectionsManager } from '@/features/admin/sections/components/SectionsManager';

export const metadata: Metadata = { title: 'Secciones del inicio' };

export default function Page() {
  return <SectionsManager />;
}
