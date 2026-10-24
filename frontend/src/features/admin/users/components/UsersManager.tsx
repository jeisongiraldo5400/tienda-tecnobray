'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ROLE_LABELS, type AdminUser } from '@/features/admin/auth/adapters/user.adapter';
import { useAdminUser } from '@/features/admin/auth/hooks/AdminSessionProvider';
import { ActiveBadge } from '@/features/admin/shell/components/ActiveBadge';
import { DataTable, type Column } from '@/features/admin/shell/components/DataTable';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { getErrorMessage } from '@/shared/api/errors';
import { formatDateTime } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { ErrorState } from '@/shared/ui/States';
import { useAdminUsers, useDeleteUser } from '../hooks/useUsers';
import { UserFormModal } from './UserFormModal';

export function UsersManager() {
  const me = useAdminUser();
  const query = useAdminUsers();
  const remove = useDeleteUser();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);

  if (me.role !== 'admin') {
    return <ErrorState title="Acceso restringido" description="Solo los administradores pueden gestionar usuarios y roles." />;
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Usuario',
      cell: (u) => (
        <div>
          <p className="font-medium">
            {u.name} {u.id === me.id ? <span className="text-xs text-slate-400">(tú)</span> : null}
          </p>
          <p className="text-xs text-slate-500">{u.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Rol', cell: (u) => <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>{ROLE_LABELS[u.role]}</Badge> },
    { key: 'active', header: 'Estado', cell: (u) => <ActiveBadge active={u.active} /> },
    { key: 'last', header: 'Último ingreso', cell: (u) => <span className="text-slate-600">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Nunca'}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <button type="button" className={buttonClasses('ghost', 'icon')} onClick={() => setEditing(u)} aria-label={`Editar ${u.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          {u.id !== me.id ? (
            <button
              type="button"
              className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
              aria-label={`Eliminar ${u.name}`}
              onClick={async () => {
                if (await confirm({ title: `¿Eliminar a ${u.name}?`, message: 'Perderá el acceso al panel de inmediato.' })) {
                  remove.mutate(u.id, { onSuccess: () => toast.success('Usuario eliminado.'), onError: (e) => toast.error(getErrorMessage(e)) });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuarios y roles"
        description="Administra quién puede ingresar al panel."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo usuario
          </Button>
        }
      />
      <QueryStates query={query} loadingLabel="Cargando usuarios…">
        {(users) => <DataTable caption="Usuarios" columns={columns} rows={users} rowKey={(u) => u.id} />}
      </QueryStates>
      {editing ? (
        <UserFormModal
          open
          onClose={() => setEditing(null)}
          user={editing === 'new' ? undefined : editing}
          isSelf={editing !== 'new' && editing.id === me.id}
        />
      ) : null}
    </div>
  );
}
