'use client';

import { Form, Formik } from 'formik';
import { useState } from 'react';
import { toast } from 'sonner';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { getErrorMessage } from '@/shared/api/errors';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { TextAreaField, TextField } from '@/shared/ui/FormikFields';
import { pageSchema, type AdminPolicyPage } from '../adapters/admin-settings.adapter';
import { useAdminPages, useUpdatePage } from '../hooks/useSettings';

function PageForm({ page, canEdit }: { page: AdminPolicyPage; canEdit: boolean }) {
  const update = useUpdatePage();
  return (
    <Formik
      initialValues={{ title: page.title, content: page.content }}
      validationSchema={pageSchema}
      onSubmit={async (values, helpers) => {
        try {
          await update.mutateAsync({ slug: page.slug, data: { title: values.title.trim(), content: values.content } });
          helpers.resetForm({ values });
          toast.success('Página guardada.');
        } catch (e) {
          toast.error(getErrorMessage(e));
        }
      }}
    >
      {({ isSubmitting, dirty }) => (
        <Form noValidate className="space-y-4">
          <fieldset disabled={!canEdit} className="space-y-4">
            <TextField name="title" label="Título" required />
            <TextAreaField name="content" label="Contenido" rows={16} className="font-mono" hint="Admite Markdown: ## Títulos, **negrita**, listas con “-” y enlaces [texto](https://…)." />
          </fieldset>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{page.updatedAt ? `Actualizada: ${formatDateTime(page.updatedAt)}` : null}</p>
            {canEdit ? (
              <Button type="submit" loading={isSubmitting} disabled={!dirty}>
                Guardar página
              </Button>
            ) : null}
          </div>
        </Form>
      )}
    </Formik>
  );
}

export function PolicyPagesEditor({ canEdit }: { canEdit: boolean }) {
  const query = useAdminPages();
  const [active, setActive] = useState<string | null>(null);
  return (
    <QueryStates query={query} loadingLabel="Cargando páginas…">
      {(pages) => {
        const current = pages.find((p) => p.slug === active) ?? pages[0];
        if (!current) return <p className="text-sm text-slate-500">No hay páginas configuradas.</p>;
        return (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Páginas de políticas">
              {pages.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setActive(p.slug)}
                  aria-current={p.slug === current.slug ? 'page' : undefined}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm',
                    p.slug === current.slug ? 'bg-brand-soft font-semibold text-brand' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {p.title}
                </button>
              ))}
            </nav>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <PageForm key={current.slug} page={current} canEdit={canEdit} />
            </div>
          </div>
        );
      }}
    </QueryStates>
  );
}
