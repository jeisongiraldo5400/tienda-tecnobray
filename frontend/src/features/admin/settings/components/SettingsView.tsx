'use client';

import { useState } from 'react';
import { useAdminUser } from '@/features/admin/auth/hooks/AdminSessionProvider';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { cn } from '@/shared/lib/cn';
import { Card, CardBody, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useAdminSettings } from '../hooks/useSettings';
import { BrandingImages } from './BrandingImages';
import { PolicyPagesEditor } from './PolicyPagesEditor';
import { SettingsForm } from './SettingsForm';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'paginas', label: 'Páginas de políticas' },
] as const;

export function SettingsView() {
  const user = useAdminUser();
  const canEdit = user.role === 'admin';
  const query = useAdminSettings();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('general');

  return (
    <div>
      <PageHeader
        title="Configuración de la tienda"
        description={canEdit ? 'Logo, colores, contacto, redes, envíos y políticas.' : 'Solo lectura: únicamente un administrador puede editar la configuración.'}
      />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-medium', tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'general' ? (
        <QueryStates query={query} loadingLabel="Cargando configuración…">
          {(settings) => (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo y favicon</CardTitle>
                </CardHeader>
                <CardBody>
                  <BrandingImages settings={settings} canEdit={canEdit} />
                </CardBody>
              </Card>
              <SettingsForm key={settings.updatedAt ?? 'settings'} settings={settings} canEdit={canEdit} />
            </div>
          )}
        </QueryStates>
      ) : (
        <PolicyPagesEditor canEdit={canEdit} />
      )}
    </div>
  );
}
