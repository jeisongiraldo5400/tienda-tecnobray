'use client';

import { Form, Formik } from 'formik';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import * as Yup from 'yup';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/FormikFields';
import { login } from '../services/auth.service';

export const loginSchema = Yup.object({
  email: Yup.string().trim().email('Correo inválido.').required('Ingresa tu correo.'),
  password: Yup.string().required('Ingresa tu contraseña.'),
});

/** Solo permite volver a rutas internas del panel (evita open redirect). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//') || next.startsWith('/admin/login')) return '/admin';
  return next;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={async (values, helpers) => {
        setError(null);
        try {
          await login(values.email, values.password);
          router.replace(safeNext(next));
          router.refresh();
        } catch (e) {
          setError(getErrorMessage(e, 'No fue posible iniciar sesión.'));
          helpers.setFieldValue('password', '', false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form noValidate className="space-y-2" aria-label="Iniciar sesión">
          <TextField name="email" label="Correo" type="email" autoComplete="username" required autoFocus />
          <TextField name="password" label="Contraseña" type="password" autoComplete="current-password" required />
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-2 w-full" loading={isSubmitting}>
            <Lock className="h-4 w-4" aria-hidden="true" /> Ingresar
          </Button>
        </Form>
      )}
    </Formik>
  );
}
