'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActiveBadge } from '@/features/admin/shell/components/ActiveBadge';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { getErrorMessage } from '@/shared/api/errors';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { EmptyState } from '@/shared/ui/States';
import type { AdminSection } from '../adapters/section.adapter';
import { useAdminSections, useDeleteSection } from '../hooks/useSections';
import { SectionFormModal } from './SectionFormModal';

export function SectionsManager() {
  const query = useAdminSections();
  const remove = useDeleteSection();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<AdminSection | 'new' | null>(null);

  return (
    <div>
      <PageHeader
        title="Secciones del inicio"
        description="Carruseles de productos elegidos a mano (además de Destacados y Lo más nuevo)."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva sección
          </Button>
        }
      />
      <QueryStates query={query} loadingLabel="Cargando secciones…">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No hay secciones" action={<Button onClick={() => setEditing('new')}>Crear sección</Button>} />
          ) : (
            <ul className="space-y-3">
              {list.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.title}</p>
                    {s.subtitle ? <p className="text-sm text-slate-500">{s.subtitle}</p> : null}
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <ActiveBadge active={s.active} on="Activa" off="Inactiva" /> {s.productIds.length} productos · orden {s.sortOrder}
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditing(s)} className={buttonClasses('ghost', 'icon')} aria-label={`Editar ${s.title}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
                    aria-label={`Eliminar ${s.title}`}
                    onClick={async () => {
                      if (await confirm({ title: `¿Eliminar la sección “${s.title}”?` })) {
                        remove.mutate(s.id, { onSuccess: () => toast.success('Sección eliminada.'), onError: (e) => toast.error(getErrorMessage(e)) });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryStates>
      {editing ? <SectionFormModal open onClose={() => setEditing(null)} section={editing === 'new' ? undefined : editing} /> : null}
    </div>
  );
}
