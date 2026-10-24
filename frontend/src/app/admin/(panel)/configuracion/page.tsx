import type { Metadata } from 'next';
import { SettingsView } from '@/features/admin/settings/components/SettingsView';

export const metadata: Metadata = { title: 'Configuración' };

export default function Page() {
  return <SettingsView />;
}
