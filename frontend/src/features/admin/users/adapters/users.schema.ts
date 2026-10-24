import * as Yup from 'yup';
import type { AdminRole } from '@/features/admin/auth/adapters/user.adapter';

export const PASSWORD_MIN = 10;

export interface UserFormValues {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
  active: boolean;
}

const password = Yup.string()
  .min(PASSWORD_MIN, `Mínimo ${PASSWORD_MIN} caracteres.`)
  .max(72, 'Máximo 72 caracteres.');

export const createUserSchema = Yup.object({
  email: Yup.string().trim().email('Correo inválido.').max(160).required('El correo es obligatorio.'),
  name: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120).required('El nombre es obligatorio.'),
  role: Yup.mixed<AdminRole>().oneOf(['admin', 'editor']).required(),
  password: password.required('La contraseña es obligatoria.'),
  active: Yup.boolean(),
});

export const editUserSchema = Yup.object({
  email: Yup.string(),
  name: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120).required('El nombre es obligatorio.'),
  role: Yup.mixed<AdminRole>().oneOf(['admin', 'editor']).required(),
  // Opcional al editar: vacío = no cambiar.
  password: password.transform((v: string) => (v === '' ? undefined : v)).optional(),
  active: Yup.boolean(),
});

export function toCreateUserPayload(v: UserFormValues) {
  return { email: v.email.trim().toLowerCase(), name: v.name.trim(), password: v.password, role: v.role };
}

export function toUpdateUserPayload(v: UserFormValues) {
  return { name: v.name.trim(), role: v.role, active: v.active, ...(v.password ? { password: v.password } : {}) };
}
