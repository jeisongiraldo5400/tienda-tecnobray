import type { Metadata } from 'next';
import { CategoriesManager } from '@/features/admin/categories/components/CategoriesManager';

export const metadata: Metadata = { title: 'Categorías' };

export default function Page() {
  return <CategoriesManager />;
}
