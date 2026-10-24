'use client';

import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { ROLE_LABELS, type AdminUser } from '@/features/admin/auth/adapters/user.adapter';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { SelectField, SwitchField, TextField } from '@/shared/ui/FormikFields';
import { Modal } from '@/shared/ui/Modal';
import { createUserSchema, editUserSchema, PASSWORD_MIN, type UserFormValues } from '../adapters/users.schema';
import { useSaveUser } from '../hooks/useUsers';

export function UserFormModal({ open, onClose, user, isSelf }: { open: boolean; onClose: () => void; user?: AdminUser; isSelf?: boolean }) {
  const save = useSaveUser();
  return (
    <Modal open={open} onClose={onClose} title={user ? 'Editar usuario' : 'Nuevo usuario'}>
      <Formik<UserFormValues>
        initialValues={{ email: user?.email ?? '', name: user?.name ?? '', role: user?.role ?? 'editor', password: '', active: user?.active ?? true }}
        validationSchema={user ? editUserSchema : createUserSchema}
        onSubmit={async (values) => {
          try {
            await save.mutateAsync({ id: user?.id, values });
            toast.success(user ? 'Usuario actualizado.' : 'Usuario creado.');
            onClose();
          } catch (e) {
            toast.error(e instanceof ApiError && e.details.length ? e.details.join(' · ') : getErrorMessage(e));
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-3">
            <TextField name="email" label="Correo" type="email" autoComplete="off" required={!user} disabled={!!user} />
            <TextField name="name" label="Nombre" required />
            <SelectField name="role" label="Rol" disabled={isSelf} hint={isSelf ? 'No puedes cambiar tu propio rol.' : 'Editor: catálogo, contenido, pedidos y clientes. Administrador: además usuarios y configuración.'}>
              <option value="editor">{ROLE_LABELS.editor}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </SelectField>
            <TextField
              name="password"
              label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              type="password"
              autoComplete="new-password"
              required={!user}
              hint={`Mínimo ${PASSWORD_MIN} caracteres.`}
            />
            {user && !isSelf ? <SwitchField name="active" label="Activo" hint="Un usuario inactivo no puede iniciar sesión." /> : null}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Guardar
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
